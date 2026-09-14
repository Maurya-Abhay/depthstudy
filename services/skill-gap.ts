import 'server-only';

import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { createServerSupabaseClient } from '@/services/supabase-server';
import type { Skill, GapPriority } from '@/types/skills';
import { getUserSkillProfile } from '@/services/skills';
import type { SkillProfile, SkillGapsResult, SkillGap } from '@/types/skills';

function priorityFromGap(gapScore: number): GapPriority {
  if (gapScore >= 70) return 'critical';
  if (gapScore >= 45) return 'high';
  if (gapScore >= 20) return 'medium';
  return 'low';
}

function gapReason(gapScore: number, attempts: number, skillName: string): string {
  if (attempts === 0) return `No evidence recorded for ${skillName} yet. Start practicing to build mastery.`;
  if (gapScore >= 70) return `${skillName} needs significant improvement. Focus on foundational concepts and practice.`;
  if (gapScore >= 45) return `${skillName} has moderate gaps. More consistent practice recommended.`;
  if (gapScore >= 20) return `${skillName} is progressing well. A bit more practice will solidify mastery.`;
  return `${skillName} is nearly mastered. Keep up the good work.`;
}

/**
 * Generate skill gaps for a user.
 * Considers: current mastery, confidence, and attempts.
 * Gap = 100 - mastery_score (adjusted by confidence).
 * Lower confidence with same mastery = higher gap (uncertain mastery).
 */
export async function getUserSkillGaps(userId: string): Promise<SkillGapsResult> {
  const profile: SkillProfile = await getUserSkillProfile(userId);
  const now = Date.now();
  const admin = createAdminSupabaseClient();
  const gaps: SkillGap[] = [];

  for (const item of profile.skills) {
    const mastery = item.mastery;
    const rawMastery = mastery?.masteryScore ?? 0;
    const confidence = mastery?.confidenceScore ?? 0;
    const attempts = mastery?.attempts ?? 0;

    // Adjust gap: lower confidence inflates the gap (uncertain mastery is risky)
    // confidenceModifier: 1.0 at confidence=100, up to 1.4 at confidence=0
    const confidenceModifier = 1 + (1 - confidence / 100) * 0.4;
    const gapScore = Math.min(100, Math.round((100 - rawMastery) * confidenceModifier));
    const priority = priorityFromGap(gapScore);

    gaps.push({
      skill: item.skill,
      masteryScore: rawMastery,
      confidenceScore: confidence,
      gapScore,
      priority,
      reason: gapReason(gapScore, attempts, item.skill.name),
    });

    // Persist snapshot
    await admin.from('skill_gap_snapshots').insert({
      user_id: userId,
      skill_id: item.skill.id,
      gap_score: gapScore,
      priority,
      reason: gapReason(gapScore, attempts, item.skill.name),
      generated_at: new Date().toISOString(),
    });
  }

  // Sort by gap score descending (biggest gaps first)
  gaps.sort((a, b) => b.gapScore - a.gapScore);

  return {
    userId,
    gaps,
    highPriorityGaps: gaps.filter((g) => g.priority === 'critical' || g.priority === 'high'),
    generatedAt: new Date(now).toISOString(),
  };
}

/**
 * Get the latest skill gap snapshots without recomputing.
 */
export async function getLatestSkillGapSnapshots(userId: string): Promise<SkillGap[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('skill_gap_snapshots')
    .select('skill_id, gap_score, priority, reason, generated_at, skills(id,name,slug,description,category)')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(100);

  if (error || !data) return [];

  // Deduplicate by skill_id (take latest)
  const seen = new Set<string>();
  const gaps: SkillGap[] = [];
  for (const row of data) {
    if (seen.has(row.skill_id)) continue;
    seen.add(row.skill_id);
    const skillRel = row.skills as
      | { id: string; name: string; slug: string; description: string; category: string }
      | Array<{ id: string; name: string; slug: string; description: string; category: string }>
      | null;
    const skillRaw = Array.isArray(skillRel) ? skillRel[0] : skillRel;
    if (!skillRaw) continue;
    gaps.push({
      skill: {
        id: skillRaw.id, name: skillRaw.name, slug: skillRaw.slug,
        description: skillRaw.description, category: skillRaw.category,
        published: true, sortOrder: 0, createdAt: '',
      },
      masteryScore: 0,
      confidenceScore: 0,
      gapScore: row.gap_score,
      priority: row.priority as GapPriority,
      reason: row.reason,
    });
  }
  return gaps;
}
