import 'server-only';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { OrganizationRole } from '@/services/organization';
import { getProvisioningState } from '@/services/organization-provisioning';

async function getActorRole(actorUserId: string, organizationId: string): Promise<OrganizationRole | null> {
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from('organization_members').select('role,status,organizations(status)').eq('organization_id', organizationId).eq('user_id', actorUserId).maybeSingle();
  if (!data || data.status === 'inactive' || (data as any).organizations?.status !== 'active') return null;
  return (data.role as OrganizationRole) ?? null;
}

export async function getOrganizationSettings(organizationId: string) {
  const admin = createAdminSupabaseClient();
  const { data: org } = await admin.from('organizations').select('*').eq('id', organizationId).maybeSingle();
  const provisioning = await getProvisioningState(organizationId);
  return { organization: org ?? null, provisioning };
}

export async function updateOrganizationProfile(actorUserId: string, organizationId: string, input: Record<string, string>) {
  const role = await getActorRole(actorUserId, organizationId);
  if (!role || (role !== 'owner' && role !== 'admin')) throw new Error('Only organization owners/admins can edit settings');

  const admin = createAdminSupabaseClient();
  const allowed = ['phone', 'official_email', 'website', 'address', 'city', 'state', 'country', 'postal_code', 'contact_person', 'notes', 'internal_notes'];
  const patch: Record<string, string> = {};
  for (const key of allowed) if (key in input) patch[key] = String(input[key] ?? '');

  const { data, error } = await admin.from('organizations').update(patch).eq('id', organizationId).select('*').single();
  if (error) throw new Error(error.message);
  await admin.from('organization_audit_logs').insert({ organization_id: organizationId, actor_user_id: actorUserId, action: 'organization.update', entity_type: 'organization', entity_id: organizationId, metadata: { fields: Object.keys(patch) } });
  return data;
}