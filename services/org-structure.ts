import 'server-only';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { OrganizationRole } from '@/services/organization';
import { refreshUsageSeats } from '@/services/organization-usage';

async function getActorRole(actorUserId: string, organizationId: string): Promise<OrganizationRole | null> {
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from('organization_members').select('role,status,organizations(status)').eq('organization_id', organizationId).eq('user_id', actorUserId).maybeSingle();
  if (!data || data.status === 'inactive' || (data as any).organizations?.status !== 'active') return null;
  return (data.role as OrganizationRole) ?? null;
}

async function assertStructureManager(actorUserId: string, organizationId: string) {
  const role = await getActorRole(actorUserId, organizationId);
  if (!role || (role !== 'owner' && role !== 'admin')) throw new Error('Only organization owners/admins can manage departments and batches');
}

async function audit(organizationId: string, actorUserId: string, action: string, entityType: string, entityId?: string | null, metadata: Record<string, unknown> = {}) {
  const admin = createAdminSupabaseClient();
  await admin.from('organization_audit_logs').insert({ organization_id: organizationId, actor_user_id: actorUserId, action, entity_type: entityType, entity_id: entityId ?? null, metadata });
}

export async function listDepartments(organizationId: string, includeArchived = true) {
  const admin = createAdminSupabaseClient();
  let q = admin.from('organization_departments').select('*').eq('organization_id', organizationId).order('name');
  if (!includeArchived) q = q.eq('archived', false);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createDepartment(actorUserId: string, organizationId: string, input: { name: string; description?: string }) {
  await assertStructureManager(actorUserId, organizationId);
  if (!String(input.name ?? '').trim()) throw new Error('Department name is required');
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('organization_departments').insert({
    organization_id: organizationId,
    name: String(input.name).trim(),
    description: String(input.description ?? '').trim(),
    archived: false,
  }).select('*').single();
  if (error) throw new Error(error.message);
  await audit(organizationId, actorUserId, 'department.create', 'organization_department', data.id, { name: data.name });
  return data;
}

export async function updateDepartment(actorUserId: string, organizationId: string, departmentId: string, input: { name?: string; description?: string; archived?: boolean }) {
  await assertStructureManager(actorUserId, organizationId);
  const admin = createAdminSupabaseClient();
  const existing = await admin.from('organization_departments').select('id').eq('id', departmentId).eq('organization_id', organizationId).maybeSingle();
  if (!existing.data) throw new Error('Department not found');
  const { data, error } = await admin.from('organization_departments').update({
    ...(input.name ? { name: String(input.name).trim() } : {}),
    ...(input.description !== undefined ? { description: String(input.description) } : {}),
    ...(input.archived !== undefined ? { archived: input.archived } : {}),
  }).eq('id', departmentId).select('*').single();
  if (error) throw new Error(error.message);
  await audit(organizationId, actorUserId, input.archived ? 'department.archive' : 'department.update', 'organization_department', departmentId, input);
  return data;
}
export async function listBatches(organizationId: string, includeArchived = true) {
  const admin = createAdminSupabaseClient();
  let q = admin
    .from('organization_batches')
    .select('*,organization_departments(name),batch_members(user_id),faculty_assignments(faculty_user_id)')
    .eq('organization_id', organizationId)
    .order('name');
  if (!includeArchived) q = q.eq('archived', false);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createBatch(actorUserId: string, organizationId: string, input: { name: string; code?: string; departmentId?: string | null; startYear?: number | null; endYear?: number | null; mentorId?: string | null }) {
  await assertStructureManager(actorUserId, organizationId);
  if (!String(input.name ?? '').trim()) throw new Error('Batch name is required');
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('organization_batches').insert({
    organization_id: organizationId,
    name: String(input.name).trim(),
    code: input.code?.trim() || null,
    department_id: input.departmentId ?? null,
    start_year: input.startYear ?? null,
    end_year: input.endYear ?? null,
    mentor_id: input.mentorId ?? null,
    archived: false,
  }).select('*').single();
  if (error) throw new Error(error.message);
  await audit(organizationId, actorUserId, 'batch.create', 'organization_batch', data.id, { name: data.name, code: data.code });
  return data;
}

export async function updateBatch(actorUserId: string, organizationId: string, batchId: string, input: { name?: string; code?: string; departmentId?: string | null; startYear?: number | null; endYear?: number | null; mentorId?: string | null; archived?: boolean }) {
  await assertStructureManager(actorUserId, organizationId);
  const admin = createAdminSupabaseClient();
  const existing = await admin.from('organization_batches').select('id').eq('id', batchId).eq('organization_id', organizationId).maybeSingle();
  if (!existing.data) throw new Error('Batch not found');
  const { data, error } = await admin.from('organization_batches').update({
    ...(input.name ? { name: String(input.name).trim() } : {}),
    ...(input.code !== undefined ? { code: input.code?.trim() || null } : {}),
    ...(input.departmentId !== undefined ? { department_id: input.departmentId } : {}),
    ...(input.startYear !== undefined ? { start_year: input.startYear } : {}),
    ...(input.endYear !== undefined ? { end_year: input.endYear } : {}),
    ...(input.mentorId !== undefined ? { mentor_id: input.mentorId } : {}),
    ...(input.archived !== undefined ? { archived: input.archived } : {}),
  }).eq('id', batchId).select('*').single();
  if (error) throw new Error(error.message);
  await audit(organizationId, actorUserId, input.archived ? 'batch.archive' : 'batch.update', 'organization_batch', batchId, input);
  return data;
}

export async function setBatchMembers(actorUserId: string, organizationId: string, batchId: string, memberUserIds: string[]) {
  await assertStructureManager(actorUserId, organizationId);
  const admin = createAdminSupabaseClient();
  const batch = await admin.from('organization_batches').select('id').eq('id', batchId).eq('organization_id', organizationId).maybeSingle();
  if (!batch.data) throw new Error('Batch not found');

  const existing = await admin.from('batch_members').select('user_id').eq('batch_id', batchId);
  const existingIds = new Set((existing.data ?? []).map((m) => m.user_id));
  const desired = new Set(memberUserIds);
  const toRemove = [...existingIds].filter((id) => !desired.has(id));
  const toAdd = [...desired].filter((id) => !existingIds.has(id));

  if (toRemove.length) {
    const { error } = await admin.from('batch_members').delete().eq('batch_id', batchId).in('user_id', toRemove);
    if (error) throw new Error(error.message);
  }
  if (toAdd.length) {
    const rows = toAdd.map((uid) => ({ batch_id: batchId, user_id: uid }));
    const { error } = await admin.from('batch_members').upsert(rows, { onConflict: 'batch_id,user_id' });
    if (error) throw new Error(error.message);
  }
  await audit(organizationId, actorUserId, 'batch.members.set', 'batch_member', batchId, { added: toAdd.length, removed: toRemove.length });
  await refreshUsageSeats(organizationId);
}

export async function listBatchMembers(batchId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('batch_members')
    .select('user_id')
    .eq('batch_id', batchId);

  if (error) throw new Error(error.message);

  const { getUserDirectoryByIds } = await import('@/services/user-directory');
  const users = await getUserDirectoryByIds((data ?? []).map((m) => m.user_id));

  return (data ?? []).map((m) => {
    const user = users.get(m.user_id);
    return {
      user_id: m.user_id,
      name: user?.name ?? '',
      email: user?.email ?? '',
    };
  });
}
