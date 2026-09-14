import 'server-only';
import { createAdminSupabaseClient } from '@/services/supabase-admin';

export type ProvisioningStatus = 'pending' | 'in_progress' | 'owner_invited' | 'owner_accepted' | 'complete' | 'suspended';

export type ProvisioningState = {
  organization_id: string;
  current_step: number;
  total_steps: number;
  completed_steps: number[];
  status: ProvisioningStatus;
  owner_invite_id: string | null;
  onboarding_completed: boolean;
};

export async function getProvisioningState(organizationId: string): Promise<ProvisioningState | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('organization_provisioning').select('*').eq('organization_id', organizationId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ProvisioningState | null) ?? null;
}

export async function ensureProvisioningState(organizationId: string): Promise<ProvisioningState> {
  const existing = await getProvisioningState(organizationId);
  if (existing) return existing;
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('organization_provisioning')
    .insert({ organization_id: organizationId })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as ProvisioningState;
}

/**
 * Mark a wizard step as completed and advance current_step. Callers must
 * authorize (platform admin or org owner/admin) before calling.
 */
export async function completeProvisioningStep(organizationId: string, step: number): Promise<ProvisioningState> {
  const admin = createAdminSupabaseClient();
  let state = await getProvisioningState(organizationId);
  if (!state) state = await ensureProvisioningState(organizationId);

  const completed = Array.from(new Set<number>([...(state.completed_steps ?? []), step])).sort((a, b) => a - b);
  const currentStep = Math.min(state.total_steps, Math.max(1, step + 1));
  const status: ProvisioningStatus = state.status === 'suspended' ? state.status : 'in_progress';
  const onboardingComplete = completed.length >= state.total_steps;

  const { data, error } = await admin
    .from('organization_provisioning')
    .update({
      current_step: currentStep,
      completed_steps: completed,
      status,
      onboarding_completed: onboardingComplete,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as ProvisioningState;
}

export async function setProvisioningStatus(organizationId: string, status: ProvisioningStatus): Promise<ProvisioningState> {
  const admin = createAdminSupabaseClient();
  let state = await getProvisioningState(organizationId);
  if (!state) state = await ensureProvisioningState(organizationId);
  const { data, error } = await admin
    .from('organization_provisioning')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as ProvisioningState;
}

export async function markOwnerInvited(organizationId: string, inviteId: string): Promise<void> {
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from('organization_provisioning')
    .update({ status: 'owner_invited', owner_invite_id: inviteId, updated_at: new Date().toISOString() })
    .eq('organization_id', organizationId);
  if (error) throw new Error(error.message);
}

export async function markOwnerAccepted(organizationId: string): Promise<void> {
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from('organization_provisioning')
    .update({ status: 'owner_accepted', updated_at: new Date().toISOString() })
    .eq('organization_id', organizationId);
  if (error) throw new Error(error.message);
}