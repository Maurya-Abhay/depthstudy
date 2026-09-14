import 'server-only';
import { createAdminSupabaseClient } from '@/services/supabase-admin';

export type ReviewGrade = 0 | 1 | 2 | 3 | 4 | 5;

function nextInterval(current: number, grade: ReviewGrade, stability: number): number {
  const safeCurrent = Math.max(1, current);
  const factor = grade <= 1 ? 0.35 : grade === 2 ? 0.8 : grade === 3 ? 1.6 : grade === 4 ? 2.4 : 3.4;
  const stabilityBonus = Math.min(2.5, Math.max(0.75, stability));
  const raw = grade <= 1 ? 1 : Math.round(safeCurrent * factor * stabilityBonus);
  return Math.min(120, Math.max(1, raw));
}

export async function getDueReviews(userId: string, limit = 20) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('learning_reviews')
    .select('*, skills(name), study_topics(title), dsa_problems(title)')
    .eq('user_id', userId)
    .lte('due_at', new Date().toISOString())
    .order('due_at', { ascending: true })
    .limit(Math.min(Math.max(limit, 1), 50));
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertReview(input: {
  userId: string;
  skillId?: string | null;
  topicId?: string | null;
  dsaProblemId?: string | null;
  sourceType: 'topic' | 'dsa' | 'question' | 'assessment' | 'mission';
  sourceId: string;
}) {
  const admin = createAdminSupabaseClient();
  const existing = await admin.from('learning_reviews').select('*').eq('user_id', input.userId).eq('source_type', input.sourceType).eq('source_id', input.sourceId).maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data;
  const { data, error } = await admin.from('learning_reviews').insert({
    user_id: input.userId,
    skill_id: input.skillId ?? null,
    topic_id: input.topicId ?? null,
    dsa_problem_id: input.dsaProblemId ?? null,
    source_type: input.sourceType,
    source_id: input.sourceId,
    due_at: new Date().toISOString(),
  }).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function gradeReview(userId: string, reviewId: string, grade: ReviewGrade) {
  const admin = createAdminSupabaseClient();
  const current = await admin.from('learning_reviews').select('*').eq('id', reviewId).eq('user_id', userId).single();
  if (current.error || !current.data) throw new Error('Review not found');
  const interval = nextInterval(Number(current.data.interval_days) || 1, grade, Number(current.data.stability || 1));
  const now = new Date();
  const due = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
  const repetitions = grade <= 1 ? 0 : Number(current.data.repetitions || 0) + 1;
  const lapses = grade <= 1 ? Number(current.data.lapses || 0) + 1 : Number(current.data.lapses || 0);
  const stability = Math.min(30, Math.max(1, Number(current.data.stability || 1) * (grade <= 1 ? 0.7 : 1 + grade / 12)));
  const quality = grade >= 4 ? 'easy' : grade === 3 ? 'good' : grade === 2 ? 'hard' : 'again';
  const { data, error } = await admin.from('learning_reviews').update({
    interval_days: interval,
    repetitions,
    lapses,
    stability,
    last_grade: grade,
    last_reviewed_at: now.toISOString(),
    due_at: due.toISOString(),
    quality,
    updated_at: now.toISOString(),
  }).eq('id', reviewId).eq('user_id', userId).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}
