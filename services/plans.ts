import 'server-only';
import { createAdminSupabaseClient } from '@/services/supabase-admin';

export type BillingModel = 'flat' | 'per_student' | 'per_seat' | 'hybrid';

export type PlanDefinition = {
  id: string;
  code: string;
  name: string;
  description: string;
  billing_model: BillingModel;
  monthly_price: number;
  yearly_price: number;
  included_student_seats: number;
  extra_student_seat_price: number;
  included_faculty_seats: number;
  extra_faculty_seat_price: number;
  included_ai_usage: number;
  feature_flags: Record<string, boolean>;
  services: Record<string, boolean>;
  currency: string;
  active: boolean;
};

export type PlanInput = Partial<{
  code: string;
  name: string;
  description: string;
  billingModel: BillingModel;
  monthlyPrice: number;
  yearlyPrice: number;
  includedStudentSeats: number;
  extraStudentSeatPrice: number;
  includedFacultySeats: number;
  extraFacultySeatPrice: number;
  includedAiUsage: number;
  featureFlags: Record<string, unknown>;
  services: Record<string, unknown>;
  currency: string;
  active: boolean;
}>;

function pickPlanRow(input: PlanInput): Record<string, unknown> {
  return {
    code: input.code?.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-') || undefined,
    name: input.name?.trim() || undefined,
    description: input.description ?? '',
    billing_model: input.billingModel ?? 'per_seat',
    monthly_price: input.monthlyPrice ?? 0,
    yearly_price: input.yearlyPrice ?? 0,
    included_student_seats: input.includedStudentSeats ?? 0,
    extra_student_seat_price: input.extraStudentSeatPrice ?? 0,
    included_faculty_seats: input.includedFacultySeats ?? 0,
    extra_faculty_seat_price: input.extraFacultySeatPrice ?? 0,
    included_ai_usage: input.includedAiUsage ?? 0,
    feature_flags: input.featureFlags ?? {},
    services: input.services ?? {},
    currency: input.currency ?? 'INR',
    active: input.active ?? true,
  };
}

export async function getPlans(includeInactive = false): Promise<PlanDefinition[]> {
  const admin = createAdminSupabaseClient();
  let query = admin.from('organization_plan_definitions').select('*').order('monthly_price', { ascending: true });
  if (!includeInactive) query = query.eq('active', true);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as PlanDefinition[];
}

export async function getPlanById(id: string): Promise<PlanDefinition | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('organization_plan_definitions').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PlanDefinition | null) ?? null;
}

export async function getDefaultPlanId(): Promise<string | null> {
  const plans = await getPlans();
  const business = plans.find((p) => p.code === 'business');
  return (business?.id ?? plans[0]?.id) ?? null;
}

export async function createPlan(input: PlanInput): Promise<PlanDefinition> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('organization_plan_definitions')
    .insert(pickPlanRow(input))
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as PlanDefinition;
}

export async function updatePlan(id: string, input: PlanInput): Promise<PlanDefinition> {
  const admin = createAdminSupabaseClient();
  const row = pickPlanRow(input);
  const clean = Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined));
  const { data, error } = await admin
    .from('organization_plan_definitions')
    .update({ ...clean, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as PlanDefinition;
}

export async function setPlanActive(id: string, active: boolean): Promise<void> {
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from('organization_plan_definitions')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}
