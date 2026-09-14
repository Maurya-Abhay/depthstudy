import 'server-only';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { OrganizationRole } from '@/services/organization';

async function getActorRole(actorUserId: string, organizationId: string): Promise<OrganizationRole | null> {
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from('organization_members').select('role,status,organizations(status)').eq('organization_id', organizationId).eq('user_id', actorUserId).maybeSingle();
  if (!data || data.status === 'inactive' || (data as any).organizations?.status !== 'active') return null;
  return (data.role as OrganizationRole) ?? null;
}

async function assertCanManageFaculty(actorUserId: string, organizationId: string) {
  const role = await getActorRole(actorUserId, organizationId);
  if (!role || (role !== 'owner' && role !== 'admin')) throw new Error('Only organization owners/admins can manage faculty');
}

export async function listFaculty(organizationId: string) {
  const admin = createAdminSupabaseClient();
  const { data: members, error: memberError } = await admin
    .from('organization_members')
    .select('user_id,status,joined_at')
    .eq('organization_id', organizationId)
    .eq('role', 'mentor');
  if (memberError) throw new Error(memberError.message);
  const facultyIds = (members ?? []).map((m) => m.user_id);
  const { getUserDirectoryByIds } = await import('@/services/user-directory');
  const users = await getUserDirectoryByIds(facultyIds);
  const assignments = facultyIds.length
    ? await admin.from('faculty_assignments').select('*,organization_batches(name)').eq('organization_id', organizationId).in('faculty_user_id', facultyIds)
    : { data: [] };

  return (members ?? []).map((m) => {
    const fa = (assignments.data ?? []).filter((a: any) => a.faculty_user_id === m.user_id);
    const user = users.get(m.user_id);
    return {
      user_id: m.user_id,
      name: user?.name ?? '',
      email: user?.email ?? '',
      status: m.status,
      joined_at: m.joined_at,
      batches: fa.map((a: any) => ({ id: a.batch_id, name: a.organization_batches?.name ?? '' })),
      workload: fa.length,
    };
  });
}

export async function assignFaculty(actorUserId: string, organizationId: string, facultyUserId: string, input: { departmentId?: string | null; batchId?: string | null }) {
  await assertCanManageFaculty(actorUserId, organizationId);
  const admin = createAdminSupabaseClient();
  const member = await admin.from('organization_members').select('user_id').eq('organization_id', organizationId).eq('user_id', facultyUserId).eq('role', 'mentor').maybeSingle();
  if (!member.data) throw new Error('Faculty member not found');
  const { error } = await admin.from('faculty_assignments').insert({
    organization_id: organizationId,
    faculty_user_id: facultyUserId,
    department_id: input.departmentId ?? null,
    batch_id: input.batchId ?? null,
    created_by: actorUserId,
  });
  if (error) throw new Error(error.message);
}

export async function removeFacultyAssignment(actorUserId: string, organizationId: string, facultyUserId: string, batchId: string) {
  await assertCanManageFaculty(actorUserId, organizationId);
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from('faculty_assignments')
    .delete()
    .eq('organization_id', organizationId)
    .eq('faculty_user_id', facultyUserId)
    .eq('batch_id', batchId);
  if (error) throw new Error(error.message);
}

export async function inviteFaculty(actorUserId: string, organizationId: string, email: string, password?: string) {
  await assertCanManageFaculty(actorUserId, organizationId);
  const cleanEmail = String(email ?? '').trim().toLowerCase();
  const cleanPassword = String(password ?? '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) throw new Error('Valid faculty email is required');
  if (cleanPassword.length < 8) throw new Error('Password is required (min 8 characters) — bina password ke faculty add nahi hoga');
  // Direct add: auth account + mentor role, invite ka option khatm.
  const admin = createAdminSupabaseClient();
  const { findAuthUserByEmail } = await import('@/services/user-directory');
  let userId = await findAuthUserByEmail(cleanEmail);
  if (!userId) {
    const created = await admin.auth.admin.createUser({ email: cleanEmail, password: cleanPassword, email_confirm: true });
    if (created.data.user?.id) userId = created.data.user.id;
    else if (created.error && String(created.error.message ?? '').toLowerCase().includes('already')) {
      userId = await findAuthUserByEmail(cleanEmail);
    } else if (created.error) {
      throw new Error(created.error.message);
    }
  }
  if (!userId) throw new Error('Faculty account banane me fail hua. Dobara try karo.');
  const upd = await admin.auth.admin.updateUserById(userId, { password: cleanPassword });
  if (upd.error) throw new Error(upd.error.message);
  const credentials = { email: cleanEmail, password: cleanPassword };
  const { error } = await admin.from('organization_members').upsert(
    { organization_id: organizationId, user_id: userId, role: 'mentor', status: 'active' },
    { onConflict: 'organization_id,user_id' },
  );
  if (error) throw new Error(error.message);
  return { added: true as const, member: { user_id: userId }, credentials };
}