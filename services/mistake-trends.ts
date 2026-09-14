import 'server-only';
import { createAdminSupabaseClient } from '@/services/supabase-admin';

export async function recalculateMistakeTrends(userId: string) {
  const admin = createAdminSupabaseClient();
  const { data: mistakes, error } = await admin.from('mistake_logs').select('category, metadata, created_at').eq('user_id', userId).order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  const grouped = new Map<string, { count: number; resolved: number; first: string; last: string }>();
  for (const row of mistakes ?? []) {
    const category = row.category || 'unknown';
    const current = grouped.get(category) ?? { count: 0, resolved: 0, first: row.created_at, last: row.created_at };
    current.count += 1;
    if (row.metadata?.resolved === true || row.metadata?.resolved === 'true') current.resolved += 1;
    current.last = row.created_at;
    grouped.set(category, current);
  }
  for (const [category, value] of grouped) {
    const severity = Math.max(0, Math.min(100, Math.round((value.count * 12) + ((value.count - value.resolved) * 8))));
    await admin.from('mistake_trends').upsert({
      user_id: userId,
      category,
      occurrence_count: value.count,
      resolved_count: value.resolved,
      severity_score: severity,
      first_seen_at: value.first,
      last_seen_at: value.last,
      metadata: { resolutionRate: value.count ? value.resolved / value.count : 0 },
    }, { onConflict: 'user_id,category' });
  }
  const { data, error: readError } = await admin.from('mistake_trends').select('*').eq('user_id', userId).order('severity_score', { ascending: false });
  if (readError) throw new Error(readError.message);
  return data ?? [];
}

export async function getMistakeTrends(userId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('mistake_trends').select('*').eq('user_id', userId).order('severity_score', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
