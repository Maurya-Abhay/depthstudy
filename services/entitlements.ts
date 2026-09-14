import 'server-only';
import { createAdminSupabaseClient } from '@/services/supabase-admin';

export const ORGANIZATION_SERVICES = [
  'courses',
  'tests',
  'dsa',
  'ai_coach',
  'projects',
  'mock_interviews',
  'placement_analytics',
  'certificates',
  'advanced_analytics',
] as const;
export type OrganizationService = (typeof ORGANIZATION_SERVICES)[number];

export async function getUserPlan(userId: string): Promise<'free'|'pro'> {
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from('user_entitlements').select('plan,status,current_period_end').eq('user_id', userId).maybeSingle();
  if (!data) return 'free';
  if (data.status !== 'active') return 'free';
  if (data.current_period_end && new Date(data.current_period_end) < new Date()) return 'free';
  return data.plan === 'pro' ? 'pro' : 'free';
}

export function canUseFeature(plan: 'free'|'pro', feature: string): boolean {
  if (plan === 'pro') return true;
  return new Set(['basic_courses','basic_tests','basic_dsa','basic_ai','basic_profile','basic_projects']).has(feature);
}

export function canUsePremiumProject(plan: 'free'|'pro', premium: boolean): boolean {
  return !premium || plan === 'pro';
}

/**
 * ---- Organization service entitlements (tenant feature flags) ----
 * The platform admin toggles these ON/OFF per organization. Every server page,
 * API route and mutation that gates a purchased service calls assertOrganizationService
 * so a disabled service is actually blocked server-side — never only in the UI.
 */

export async function getOrganizationFeatureEntitlements(organizationId: string): Promise<Array<{ service: string; enabled: boolean; quota: number | null; quota_unit: string | null; current_usage: number }>> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('organization_feature_entitlements').select('*').eq('organization_id', organizationId);
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{ service: string; enabled: boolean; quota: number | null; quota_unit: string | null; current_usage: number }>;
}

/**
 * Resolve whether a service is enabled for an org. Falls back to the plan's
 * default `services` map when no explicit entitlement row exists, else true.
 */
export async function isOrganizationServiceEnabled(organizationId: string, service: string): Promise<boolean> {
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from('organization_feature_entitlements')
    .select('enabled')
    .eq('organization_id', organizationId)
    .eq('service', service)
    .maybeSingle();
  if (data) return data.enabled === true;

  // No explicit row yet: default from the org's plan services map.
  const org = await admin
    .from('organizations')
    .select('plan_id, organization_plan_definitions(services)')
    .eq('id', organizationId)
    .maybeSingle();
  const services = (org.data as any)?.organization_plan_definitions?.services;
  if (services && typeof services === 'object' && service in services) {
    return (services as Record<string, boolean>)[service] !== false;
  }
  return true;
}

/**
 * Throws SERVICE_DISABLED when the org has not purchased/enabled `service`.
 * Call this at the top of server functions/API routes that implement a service.
 */
export async function assertOrganizationService(organizationId: string, service: string): Promise<void> {
  if (!(await isOrganizationServiceEnabled(organizationId, service))) {
    const error = new Error(`The "${service}" service is not enabled for this organization.`) as Error & { code?: string };
    error.code = 'SERVICE_DISABLED';
    throw error;
  }
}

/** Platform-admin action: set/replace a service entitlement row for an org. */
export async function setOrganizationService(organizationId: string, service: string, enabled: boolean, quota?: number | null, quotaUnit?: string | null): Promise<void> {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('organization_feature_entitlements').upsert(
    {
      organization_id: organizationId,
      service,
      enabled,
      quota: quota ?? null,
      quota_unit: quotaUnit ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id,service' },
  );
  if (error) throw new Error(error.message);
}

/** Seed the default service entitlements for a freshly provisioned org. */
export async function assertOrganizationSeatAvailable(organizationId: string, role: 'student' | 'mentor'): Promise<void> {
  const admin = createAdminSupabaseClient();
  const org = await admin.from('organizations').select('id,plan_id,status').eq('id', organizationId).maybeSingle();
  if (!org.data) { const e = new Error('ORG_NOT_FOUND') as Error & { code?: string }; e.code = 'ORG_NOT_FOUND'; throw e; }
  if (org.data.status !== 'active') { const e = new Error('Organization is suspended') as Error & { code?: string }; e.code = 'ORG_SUSPENDED'; throw e; }
  const plan = org.data.plan_id ? await admin.from('organization_plan_definitions').select('included_student_seats,included_faculty_seats,extra_student_seat_price,extra_faculty_seat_price').eq('id', org.data.plan_id).maybeSingle() : { data: null } as any;
  if (!plan.data) return;
  const counts = await admin.from('organization_members').select('role,status').eq('organization_id', organizationId);
  const activeRows = counts.data ?? [];
  const current = activeRows.filter((r: any) => r.status !== 'inactive' && r.role === role).length;
  const pending = await admin.from('organization_invites').select('id').eq('organization_id', organizationId).eq('role', role).eq('status', 'pending').gt('expires_at', new Date().toISOString());
  const reserved = current + (pending.data?.length ?? 0);
  const limit = role === 'student' ? Number(plan.data.included_student_seats ?? 0) : Number(plan.data.included_faculty_seats ?? 0);
  const overagePrice = role === 'student' ? Number(plan.data.extra_student_seat_price ?? 0) : Number(plan.data.extra_faculty_seat_price ?? 0);
  if (limit > 0 && reserved >= limit && overagePrice <= 0) {
    const e = new Error(`PLAN_LIMIT_REACHED: ${role} seat limit reached.`) as Error & { code?: string }; e.code = 'PLAN_LIMIT_REACHED'; throw e;
  }
}

export async function seedOrganizationServices(organizationId: string, services?: Record<string, boolean>): Promise<void> {
  const admin = createAdminSupabaseClient();
  const defaultServices: Record<string, boolean> =
    services && Object.keys(services).length ? services : Object.fromEntries(ORGANIZATION_SERVICES.map((s) => [s, true]));
  const rows = Object.entries(defaultServices).map(([service, enabled]) => ({
    organization_id: organizationId,
    service,
    enabled,
  }));
  const { error } = await admin.from('organization_feature_entitlements').upsert(rows, { onConflict: 'organization_id,service' });
  if (error) throw new Error(error.message);
}

