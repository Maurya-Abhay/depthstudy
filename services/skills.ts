import 'server-only';

import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { createServerSupabaseClient } from '@/services/supabase-server';
import type {
  Skill,
  SkillProfile,
  SkillProfileItem,
  UserSkillMastery,
  SkillEventType,
  SkillEventSource,
} from '@/types/skills';

// ── Scoring weights (deterministic) ─────────────────────────────────────────
const W = { correctness: 0.40, consistency: 0.20, recency: 0.20, repetition: 0.10, effort: 0.10 } as const;
const HALF_LIFE_DAYS = 14;
const MS_PER_DAY = 86_400_000;
const HALF_LIFE_MS = HALF_LIFE_DAYS * MS_PER_DAY;

export interface EvidenceRow {
  score: number;
  difficulty: number;
  timestamp: string;
  source: SkillEventSource;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function difficultyWeight(difficulty: number): number {
  if (difficulty >= 3) return 1.15;
  if (difficulty === 2) return 1.0;
  if (difficulty === 1) return 0.85;
  return 1.0;
}

function recencyDecay(timestamp: string, now: number): number {
  const ageMs = now - new Date(timestamp).getTime();
  if (ageMs <= 0) return 1;
  return Math.pow(0.5, ageMs / HALF_LIFE_MS);
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function computeMasteryScore(evidence: EvidenceRow[], now = Date.now()): {
  mastery: number; confidence: number; attempts: number; successful: number; lastActivity: string | null;
} {
  if (evidence.length === 0) {
    return { mastery: 0, confidence: 0, attempts: 0, successful: 0, lastActivity: null };
  }
  const attempts = evidence.length;
  const successful = evidence.filter((e) => e.score >= 60).length;
  const lastActivity = evidence.map((e) => e.timestamp).sort().reverse()[0] ?? null;

  let weightedSum = 0;
  let weightTotal = 0;
  for (const ev of evidence) {
    const w = difficultyWeight(ev.difficulty) * recencyDecay(ev.timestamp, now);
    weightedSum += ev.score * w;
    weightTotal += w;
  }
  const correctness = weightTotal > 0 ? weightedSum / weightTotal : 0;
  const scores = evidence.map((e) => e.score);
  const consistency = Math.max(0, 1 - stdDev(scores) / 50);
  const recency = evidence.reduce((sum, e) => sum + recencyDecay(e.timestamp, now), 0) / evidence.length;
  const repetition = Math.min(1, Math.log2(attempts + 1) / 4);
  const effort = successful / attempts;

  const mastery = (correctness / 100) * W.correctness + consistency * W.consistency
    + recency * W.recency + repetition * W.repetition + effort * W.effort;
  const masteryScore = clampInt(mastery * 100, 0, 100);
  const confidence = clampInt(Math.min(100, attempts * 8 + successful * 12), 0, 100);

  return { mastery: masteryScore, confidence, attempts, successful, lastActivity };
}

function difficultyToNumber(difficulty: string | null | undefined): number {
  if (!difficulty) return 0;
  const d = difficulty.toLowerCase();
  if (d === 'hard' || d === 'advanced') return 3;
  if (d === 'medium' || d === 'intermediate') return 2;
  if (d === 'easy' || d === 'beginner') return 1;
  return 0;
}

// ── Skills CRUD ─────────────────────────────────────────────────────────────

export async function getPublishedSkills(): Promise<Skill[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('skills')
    .select('id,name,slug,description,category,published,sort_order,created_at')
    .eq('published', true)
    .order('sort_order')
    .order('name');
  if (error || !data) return [];
  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: row.description as string,
    category: row.category as string,
    published: row.published as boolean,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
  }));
}

// ── Evidence gathering ──────────────────────────────────────────────────────

async function gatherEvidence(userId: string, skillId: string): Promise<EvidenceRow[]> {
  const admin = createAdminSupabaseClient();
  const evidence: EvidenceRow[] = [];

  const { data: skillTopics } = await admin
    .from('skill_topics')
    .select('id, slug')
    .eq('skill_id', skillId)
    .eq('published', true);

  const skillTopicSlugs = (skillTopics ?? []).map((t: { slug: string }) => t.slug).filter(Boolean);

  const { data: matchedStudyTopics } = skillTopicSlugs.length
    ? await admin.from('study_topics').select('id').in('slug', skillTopicSlugs)
    : { data: [] as Array<{ id: string }> };
  const studyTopicIds = (matchedStudyTopics ?? []).map((t: { id: string }) => t.id);

  const { data: matchedDsaTopics } = skillTopicSlugs.length
    ? await admin.from('dsa_topics').select('id').in('slug', skillTopicSlugs)
    : { data: [] as Array<{ id: string }> };
  const dsaTopicIds = (matchedDsaTopics ?? []).map((t: { id: string }) => t.id);

  // 1. topic_progress
  if (studyTopicIds.length > 0) {
    const { data: progress } = await admin
      .from('topic_progress')
      .select('progress, last_studied_at, study_topics(difficulty)')
      .eq('user_id', userId)
      .in('topic_id', studyTopicIds);
    for (const row of progress ?? []) {
      const topicRel = row.study_topics as { difficulty?: string } | Array<{ difficulty?: string }> | null;
      const topic = Array.isArray(topicRel) ? topicRel[0] : topicRel;
      evidence.push({
        score: Math.max(0, Math.min(100, row.progress ?? 0)),
        difficulty: difficultyToNumber(topic?.difficulty),
        timestamp: row.last_studied_at ?? new Date().toISOString(),
        source: 'progress',
      });
    }
  }

  // 2. test_attempts via study topics
  if (studyTopicIds.length > 0) {
    const { data: testQuestions } = await admin
      .from('test_questions')
      .select('test_id, study_topic_id')
      .in('study_topic_id', studyTopicIds);
    const testIds = [...new Set((testQuestions ?? []).map((q: { test_id: string }) => q.test_id))];
    if (testIds.length > 0) {
      const { data: attempts } = await admin
        .from('test_attempts')
        .select('score, submitted_at')
        .eq('user_id', userId)
        .in('test_id', testIds)
        .not('submitted_at', 'is', null);
      for (const row of attempts ?? []) {
        evidence.push({
          score: row.score ?? 0,
          difficulty: 2,
          timestamp: row.submitted_at ?? new Date().toISOString(),
          source: 'test',
        });
      }
    }
  }

  // 3. dsa_submissions via dsa topics
  if (dsaTopicIds.length > 0) {
    const { data: dsaProblems } = await admin
      .from('dsa_problems')
      .select('id')
      .in('topic_id', dsaTopicIds)
      .eq('published', true);
    const problemIds = (dsaProblems ?? []).map((p: { id: string }) => p.id);
    if (problemIds.length > 0) {
      const { data: submissions } = await admin
        .from('dsa_submissions')
        .select('score, status, created_at, dsa_problems(difficulty)')
        .eq('user_id', userId)
        .in('problem_id', problemIds);
      for (const row of submissions ?? []) {
        const probRel = row.dsa_problems as { difficulty?: string } | Array<{ difficulty?: string }> | null;
        const prob = Array.isArray(probRel) ? probRel[0] : probRel;
        evidence.push({
          score: row.status === 'accepted' ? (row.score ?? 100) : (row.score ?? 25),
          difficulty: difficultyToNumber(prob?.difficulty),
          timestamp: row.created_at,
          source: 'dsa',
        });
      }
    }
  }

  // 4. skill_events
  const { data: events } = await admin
    .from('skill_events')
    .select('score, source, created_at')
    .eq('user_id', userId)
    .eq('skill_id', skillId)
    .order('created_at', { ascending: false })
    .limit(50);
  for (const row of events ?? []) {
    if (row.score != null) {
      evidence.push({
        score: row.score,
        difficulty: 0,
        timestamp: row.created_at,
        source: (row.source as SkillEventSource) ?? 'system',
      });
    }
  }

  return evidence;
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function getUserSkillProfile(userId: string): Promise<SkillProfile> {
  const skills = await getPublishedSkills();
  const now = Date.now();
  const items: SkillProfileItem[] = [];
  let totalAttempts = 0;
  let totalMastery = 0;

  for (const skill of skills) {
    const evidence = await gatherEvidence(userId, skill.id);
    const computed = computeMasteryScore(evidence, now);
    const admin = createAdminSupabaseClient();
    await admin.from('user_skill_mastery').upsert({
      user_id: userId,
      skill_id: skill.id,
      mastery_score: computed.mastery,
      confidence_score: computed.confidence,
      attempts: computed.attempts,
      successful_attempts: computed.successful,
      last_activity_at: computed.lastActivity,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,skill_id' });

    const masteryRow: UserSkillMastery | null = computed.attempts > 0 ? {
      userId, skillId: skill.id,
      masteryScore: computed.mastery, confidenceScore: computed.confidence,
      attempts: computed.attempts, successfulAttempts: computed.successful,
      lastActivityAt: computed.lastActivity, updatedAt: new Date().toISOString(),
    } : null;

    if (masteryRow) {
      totalAttempts += computed.attempts;
      totalMastery += computed.mastery;
    }
    items.push({ skill, mastery: masteryRow, strongest: false, weakest: false });
  }

  const withData = items.filter((i) => i.mastery != null);
  if (withData.length > 0) {
    const sorted = [...withData].sort((a, b) => (b.mastery?.masteryScore ?? 0) - (a.mastery?.masteryScore ?? 0));
    if (sorted[0]) sorted[0].strongest = true;
    if (sorted[sorted.length - 1]) sorted[sorted.length - 1].weakest = true;
  }

  return {
    userId,
    skills: items,
    strongestSkills: items.filter((i) => i.strongest),
    weakestSkills: items.filter((i) => i.weakest),
    totalAttempts,
    averageMastery: withData.length > 0 ? Math.round(totalMastery / withData.length) : 0,
    generatedAt: new Date().toISOString(),
  };
}

export async function recordSkillEvent(params: {
  userId: string;
  skillId: string | null;
  topicId?: string | null;
  eventType: SkillEventType;
  score?: number | null;
  source: SkillEventSource;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('skill_events')
    .insert({
      user_id: params.userId,
      skill_id: params.skillId,
      topic_id: params.topicId ?? null,
      event_type: params.eventType,
      score: params.score ?? null,
      source: params.source,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? {},
    })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

export async function recalculateSkillMastery(
  userId: string,
  skillId?: string,
): Promise<{ ok: number; failed: number }> {
  const admin = createAdminSupabaseClient();
  const now = Date.now();

  let skills: Skill[];
  if (skillId) {
    const { data } = await admin
      .from('skills')
      .select('id,name,slug,description,category,published,sort_order,created_at')
      .eq('id', skillId)
      .eq('published', true)
      .maybeSingle();
    skills = data ? [{
      id: data.id as string, name: data.name as string, slug: data.slug as string,
      description: data.description as string, category: data.category as string,
      published: data.published as boolean, sortOrder: data.sort_order as number,
      createdAt: data.created_at as string,
    }] : [];
  } else {
    skills = await getPublishedSkills();
  }

  let ok = 0;
  let failed = 0;
  for (const skill of skills) {
    try {
      const evidence = await gatherEvidence(userId, skill.id);
      const computed = computeMasteryScore(evidence, now);
      await admin.from('user_skill_mastery').upsert({
        user_id: userId, skill_id: skill.id,
        mastery_score: computed.mastery, confidence_score: computed.confidence,
        attempts: computed.attempts, successful_attempts: computed.successful,
        last_activity_at: computed.lastActivity, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,skill_id' });
      ok += 1;
    } catch {
      failed += 1;
    }
  }
  return { ok, failed };
}

export async function getUserSkillMasteryRow(userId: string, skillId: string): Promise<UserSkillMastery | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('user_skill_mastery')
    .select('mastery_score,confidence_score,attempts,successful_attempts,last_activity_at,updated_at')
    .eq('user_id', userId)
    .eq('skill_id', skillId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    userId, skillId, masteryScore: data.mastery_score, confidenceScore: data.confidence_score,
    attempts: data.attempts, successfulAttempts: data.successful_attempts,
    lastActivityAt: data.last_activity_at ?? null, updatedAt: data.updated_at,
  };
}
