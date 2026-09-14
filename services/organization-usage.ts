import 'server-only';
import { createAdminSupabaseClient } from '@/services/supabase-admin';

export function currentBillingPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Record a raw usage event and bump the org's monthly usage snapshot.
 * Used for AI usage, storage, and other server-measured quantities.
 */
export async function recordUsageEvent(organizationId: string, input: {
  usageType: string;
  quantity: number;
  unit?: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const admin = createAdminSupabaseClient();
  const { error: eventError } = await admin.from('organization_usage_events').insert({
    organization_id: organizationId,
    usage_type: input.usageType,
    quantity: input.quantity,
    unit: input.unit ?? null,
    user_id: input.userId ?? null,
    metadata: input.metadata ?? {},
  });
  if (eventError) throw new Error(eventError.message);

  const period = currentBillingPeriod();
  const existing = await admin
    .from('organization_usage')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('period', period)
    .maybeSingle();

  if (input.usageType === 'ai_requests') {
    if (existing.data) {
      await admin
        .from('organization_usage')
        .update({ ai_requests: (existing.data.ai_requests ?? 0) + 1, updated_at: new Date().toISOString() })
        .eq('organization_id', organizationId)
        .eq('period', period);
    } else {
      await admin.from('organization_usage').insert({ organization_id: organizationId, period, ai_requests: 1 });
    }
  } else if (input.usageType === 'ai_usage_units') {
    if (existing.data) {
      await admin
        .from('organization_usage')
        .update({ ai_usage_units: Number(existing.data.ai_usage_units ?? 0) + input.quantity, updated_at: new Date().toISOString() })
        .eq('organization_id', organizationId)
        .eq('period', period);
    } else {
      await admin.from('organization_usage').insert({ organization_id: organizationId, period, ai_usage_units: input.quantity });
    }
  } else if (input.usageType === 'storage_bytes') {
    if (existing.data) {
      await admin
        .from('organization_usage')
        .update({ storage_bytes: Number(existing.data.storage_bytes ?? 0) + Math.round(input.quantity), updated_at: new Date().toISOString() })
        .eq('organization_id', organizationId)
        .eq('period', period);
    } else {
      await admin.from('organization_usage').insert({ organization_id: organizationId, period, storage_bytes: Math.round(input.quantity) });
    }
  }
}

/**
 * Recompute the seat counts in the current usage snapshot from live membership.
 */
export async function refreshUsageSeats(organizationId: string): Promise<void> {
  const admin = createAdminSupabaseClient();
  const { data: rows } = await admin.from('organization_members').select('role,status').eq('organization_id', organizationId);
  const active = (rows ?? []).filter((r) => r.status !== 'inactive');
  const students = active.filter((r) => r.role === 'student').length;
  const faculty = active.filter((r) => r.role === 'mentor').length;
  const period = currentBillingPeriod();

  const existing = await admin.from('organization_usage').select('id').eq('organization_id', organizationId).eq('period', period).maybeSingle();
  if (existing.data) {
    await admin
      .from('organization_usage')
      .update({ student_seats_used: students, faculty_seats_used: faculty, updated_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .eq('period', period);
  } else {
    await admin
      .from('organization_usage')
      .insert({ organization_id: organizationId, period, student_seats_used: students, faculty_seats_used: faculty });
  }
}
