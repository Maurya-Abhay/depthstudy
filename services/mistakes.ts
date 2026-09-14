import 'server-only';

import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { createServerSupabaseClient } from '@/services/supabase-server';
import type {
  MistakeLog,
  MistakeCategoryCode,
  MistakeSource,
  MistakeAggregation,
  MistakeIntelligence,
} from '@/types/assessments';

// ── Record a mistake ────────────────────────────────────────────────────────

export async function recordMistake(params: {
  userId: string;
  source: MistakeSource;
  sourceId?: string | null;
  skillId?: string | null;
  category: MistakeCategoryCode;
  severity?: number;
  description?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('mistake_logs')
    .insert({
      user_id: params.userId,
      source: params.source,
      source_id: params.sourceId ?? null,
      skill_id: params.skillId ?? null,
      category: params.category,
      severity: Math.max(1, Math.min(5, params.severity ?? 3)),
      description: params.description ?? '',
      metadata: params.metadata ?? {},
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

// ── Aggregate mistakes by category ──────────────────────────────────────────

export async function getMistakeIntelligence(userId: string): Promise<MistakeIntelligence> {
  const admin = createAdminSupabaseClient();

  const { data: mistakes, error } = await admin
    .from('mistake_logs')
    .select('category, severity, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error || !mistakes) {
    return { userId, totalMistakes: 0, aggregations: [], topCategories: [], generatedAt: new Date().toISOString() };
  }

  // Aggregate by category
  const byCategory = new Map<MistakeCategoryCode, { count: number; totalSeverity: number; lastAt: string | null }>();
  for (const row of mistakes) {
    const existing = byCategory.get(row.category) ?? { count: 0, totalSeverity: 0, lastAt: null };
    existing.count += 1;
    existing.totalSeverity += row.severity ?? 3;
    if (!existing.lastAt) existing.lastAt = row.created_at;
    byCategory.set(row.category, existing);
  }

  const aggregations: MistakeAggregation[] = [...byCategory.entries()]
    .map(([category, agg]) => ({
      category,
      label: category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      count: agg.count,
      lastOccurrence: agg.lastAt,
      avgSeverity: Math.round((agg.totalSeverity / agg.count) * 10) / 10,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    userId,
    totalMistakes: mistakes.length,
    aggregations,
    topCategories: aggregations.slice(0, 3),
    generatedAt: new Date().toISOString(),
  };
}

// ── Read recent mistakes for a skill ────────────────────────────────────────

export async function getMistakesForSkill(userId: string, skillId: string): Promise<MistakeLog[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('mistake_logs')
    .select('id, user_id, source, source_id, skill_id, category, severity, description, metadata, created_at')
    .eq('user_id', userId)
    .eq('skill_id', skillId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    userId: row.user_id as string,
    source: row.source as MistakeSource,
    sourceId: row.source_id as string | null,
    skillId: row.skill_id as string | null,
    category: row.category as MistakeCategoryCode,
    severity: row.severity as number,
    description: row.description as string,
    metadata: row.metadata as Record<string, unknown>,
    createdAt: row.created_at as string,
  }));
}
