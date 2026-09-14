import 'server-only';
import crypto from 'node:crypto';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { ensureProvisioningState, completeProvisioningStep, markOwnerAccepted } from '@/services/organization-provisioning';
import { assertOrganizationService, isOrganizationServiceEnabled, seedOrganizationServices } from '@/services/entitlements';
import { getDefaultPlanId } from '@/services/plans';
import { refreshUsageSeats } from '@/services/organization-usage';

export type OrganizationRole = 'owner'|'admin'|'mentor'|'student';

async function getMembershipRole(userId: string, organizationId: string): Promise<OrganizationRole|null> {
  const admin = createAdminSupabaseClient();
  const row = await admin.from('organization_members').select('role').eq('organization_id', organizationId).eq('user_id', userId).maybeSingle();
  return (row.data?.role as OrganizationRole | undefined) ?? null;
}

async function assertCanAssignRole(userId: string, organizationId: string, targetRole: OrganizationRole) {
  const actor = await getMembershipRole(userId, organizationId);
  if (!actor) throw new Error('Organization access denied');
  if (targetRole === 'owner') throw new Error('Owner transfer must use a dedicated ownership flow');
  if (actor === 'owner') return;
  if (actor === 'admin' && targetRole in { mentor: true, student: true }) return;
  if (actor === 'mentor' && targetRole === 'student') return;
  throw new Error('You do not have permission to assign this organization role');
}


async function audit(organizationId: string, actorUserId: string, action: string, entityType: string, entityId?: string|null, metadata: Record<string,unknown> = {}) {
  const admin = createAdminSupabaseClient();
  await admin.from('organization_audit_logs').insert({ organization_id: organizationId, actor_user_id: actorUserId, action, entity_type: entityType, entity_id: entityId ?? null, metadata });
}

async function assertManager(userId: string, organizationId: string) {
  const role = await getActiveMembershipRole(userId, organizationId);
  if (!role || !['owner','admin','mentor'].includes(role)) throw new Error('Organization manager access required');
  return role;
}

async function assertAdminOrOwner(userId: string, organizationId: string) {
  const role = await getActiveMembershipRole(userId, organizationId);
  if (!role || !['owner','admin'].includes(role)) throw new Error('Organization admin access required');
  return role;
}

/**
 * Centralized enforcement of org membership + active status. Every
 * /api/organization/* write/read route goes through this, so a suspended
 * organization or a deactivated member is rejected server-side (never only
 * via page redirects/UI hiding).
 */
async function getActiveMembershipRole(userId: string, organizationId: string): Promise<OrganizationRole | null> {
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from('organization_members')
    .select('role,status,organizations(status)')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) throw new Error('Organization access denied');
  const orgStatus = (data as any).organizations?.status ?? 'active';
  if (orgStatus !== 'active') throw new Error('ORG_SUSPENDED: This organization is suspended');
  if (data.status === 'inactive') throw new Error('MEMBER_DEACTIVATED: Your membership is deactivated');
  return (data.role as OrganizationRole) ?? null;
}

export async function requireOrganizationManager(userId: string, organizationId: string): Promise<OrganizationRole> {
  return assertManager(userId, organizationId);
}

export async function requireOrganizationOwnerOrAdmin(userId: string, organizationId: string): Promise<OrganizationRole> {
  return assertAdminOrOwner(userId, organizationId);
}

export async function getUserOrganizations(userId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('organization_members').select('organization_id, role, organizations(id,name,slug,kind,status,plan)').eq('user_id', userId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getOrganizationDashboard(userId: string, organizationId: string) {
  const admin = createAdminSupabaseClient();
  const membership = await admin.from('organization_members').select('role').eq('organization_id', organizationId).eq('user_id', userId).maybeSingle();
  if (!membership.data) throw new Error('Organization access denied');
  const [batches, assignments, members, placement, departments, batchMembers, attempts] = await Promise.all([
    admin.from('organization_batches').select('id,name,department_id,start_year,end_year,created_at').eq('organization_id', organizationId).order('name'),
    admin.from('organization_assignments').select('id,batch_id,title,description,target_type,target_id,due_at,status,created_by,created_at').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(50),
    admin.from('organization_members').select('user_id,role,joined_at').eq('organization_id', organizationId),
    admin.from('organization_placement_snapshots').select('*').eq('organization_id', organizationId).order('calculated_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('organization_departments').select('id,name,created_at').eq('organization_id', organizationId).order('name'),
    admin.from('batch_members').select('batch_id,user_id').in('batch_id', (await admin.from('organization_batches').select('id').eq('organization_id', organizationId)).data?.map((b:any)=>b.id) ?? []),
    admin.from('assignment_attempts').select('assignment_id,user_id,score,status,submitted_at').in('assignment_id', (await admin.from('organization_assignments').select('id').eq('organization_id', organizationId)).data?.map((a:any)=>a.id) ?? []),
  ]);
  for (const item of [batches, assignments, members, placement, departments, batchMembers, attempts]) if (item.error) throw new Error(item.error.message);
  const role = membership.data.role;
  let batchRows = batches.data ?? [];
  let assignmentRows = assignments.data ?? [];
  let memberRows = members.data ?? [];
  let attemptRows = (attempts.data ?? []) as any[];

  // Strict mentor scope: only assigned batches and assignments, no member roster.
  if (role === 'mentor') {
    const { getMentorScope } = await import('@/services/org-monitoring');
    const scope = await getMentorScope(userId, organizationId);
    const bset = new Set(scope.assignedBatchIds);
    batchRows = batchRows.filter((b: any) => bset.has(b.id));
    assignmentRows = assignmentRows.filter((a: any) => (a.batch_id ? bset.has(a.batch_id) : false));
    const aset = new Set(assignmentRows.map((a: any) => a.id));
    attemptRows = attemptRows.filter((a: any) => aset.has(a.assignment_id));
    memberRows = [];
  }

  const roleCounts = (memberRows as any[]).reduce((acc:any, row:any) => { acc[row.role] = (acc[row.role] ?? 0) + 1; return acc; }, {});
  const batchCount = batchMembers.data ?? [];
  const avgAssignmentScore = attemptRows.filter((x:any)=>Number.isFinite(Number(x.score))).length ? Math.round(attemptRows.filter((x:any)=>Number.isFinite(Number(x.score))).reduce((a:any,x:any)=>a+Number(x.score),0)/attemptRows.filter((x:any)=>Number.isFinite(Number(x.score))).length) : 0;
  return {
    role,
    batches: batchRows,
    assignments: assignmentRows,
    members: memberRows,
    memberCount: memberRows.length,
    roleCounts,
    placement: placement.data ?? null,
    departments: departments.data ?? [],
    batchMemberCount: batchCount.length,
    avgAssignmentScore,
  };
}

export async function createOrganization(adminUserId: string, input: {
  name: string;
  slug: string;
  kind?: 'college'|'company'|'institute';
  planId?: string|null;
  legalName?: string | null;
  phone?: string | null;
  officialEmail?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  contactPerson?: string | null;
  notes?: string | null;
  ownerEmail?: string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
}) {
  const admin = createAdminSupabaseClient();
  const planId = input.planId ?? (await getDefaultPlanId());
  const { data, error } = await admin.from('organizations').insert({
    name: input.name,
    slug: input.slug,
    kind: input.kind ?? 'college',
    plan_id: planId,
    legal_name: input.legalName ?? null,
    phone: input.phone ?? null,
    official_email: input.officialEmail ?? null,
    website: input.website ?? null,
    address: input.address ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    country: input.country ?? null,
    postal_code: input.postalCode ?? null,
    contact_person: input.contactPerson ?? null,
    notes: input.notes ?? null,
  }).select('*').single();
  if (error) throw new Error(error.message);

  // Bootstrap provisioning, billing profile, feature entitlements and usage.
  // NOTE: the platform admin is deliberately NOT inserted as the organization
  // owner. Owner provisioning is a separate, explicit step
  // (provisionOrganizationOwner / createOrganizationOwnerInvite).
  // Each step is best-effort + rollback-on-fatal so a partial failure never
  // leaves a half-created org that the detail page cannot render.
  const rollback = async () => {
    try { await admin.from('organizations').delete().eq('id', data.id); } catch { /* best effort */ }
  };
  try {
    await ensureProvisioningState(data.id);
    const { error: bpError } = await admin
      .from('organization_billing_profiles')
      .upsert({ organization_id: data.id, currency: 'INR', payment_provider: 'none' }, { onConflict: 'organization_id' });
    if (bpError) throw new Error(bpError.message);
    await seedOrganizationServices(data.id);
    await refreshUsageSeats(data.id);
  } catch (bootstrapError) {
    await rollback();
    throw bootstrapError instanceof Error ? bootstrapError : new Error('Organization bootstrap failed');
  }
  let ownerCreated = false;
  if (input.ownerEmail?.trim()) {
    try {
      await createOwnerAccount(adminUserId, data.id, {
        name: input.ownerName ?? '', email: input.ownerEmail.trim(), phone: input.ownerPhone ?? '',
      });
      ownerCreated = true;
    } catch (ownerError) {
      // Owner account is optional — org is fully usable without it.
      console.error('[createOrganization] owner account failed (non-fatal):', ownerError instanceof Error ? ownerError.message : ownerError);
    }
  }
  await audit(data.id, adminUserId, 'organization.create', 'organization', data.id, { name: input.name, slug: input.slug, owner_created: ownerCreated });
  return { ...data, ownerCreated };
}

async function assertIsPlatformAdmin(userId: string) {
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle();
  if (data?.role !== 'admin') throw new Error('Platform admin access required');
}

/**
 * Platform-admin only: promote an EXISTING auth user to be the first owner of
 * an organization. This is separate from organization creation — creating a
 * tenant and assigning its owner are two distinct concepts.
 */
export async function provisionOrganizationOwner(actorUserId: string, organizationId: string, input: { ownerUserId: string }) {
  await assertIsPlatformAdmin(actorUserId);
  const admin = createAdminSupabaseClient();
  const org = await admin.from('organizations').select('id').eq('id', organizationId).maybeSingle();
  if (!org.data) throw new Error('Organization not found');
  const profile = await admin.from('profiles').select('id').eq('id', input.ownerUserId).maybeSingle();
  if (!profile.data) throw new Error('Owner user does not exist');

  const { error } = await admin.from('organization_members').upsert(
    { organization_id: organizationId, user_id: input.ownerUserId, role: 'owner', status: 'active', role_valid: true },
    { onConflict: 'organization_id,user_id' },
  );
  if (error) throw new Error(error.message);
  await audit(organizationId, actorUserId, 'owner.provision', 'organization_member', input.ownerUserId, { role: 'owner' });
  await markOwnerAccepted(organizationId);
  await completeProvisioningStep(organizationId, 5);
  return { organizationId, ownerUserId: input.ownerUserId };
}

/**
 * Platform-admin only: create the FIRST OWNER directly — auth account (with
 * password) + owner membership. No invite/token flow anymore.
 */
export async function createOwnerAccount(actorUserId: string, organizationId: string, opts: { name?: string; email: string; phone?: string | null }) {
  await assertIsPlatformAdmin(actorUserId);
  const admin = createAdminSupabaseClient();
  const normalized = String(opts.email ?? '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) throw new Error('Owner email is required');
  // Default password (min 8) — admin/owner can reset it later via Owner & Access.
  const defaultPassword = `Owner@${Math.random().toString(36).slice(2, 8)}`;

  const created = await admin.auth.admin.createUser({
    email: normalized,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: { name: opts.name ?? '' },
  });
  let ownerUserId: string | null = created.data.user?.id ?? null;
  if (created.error) {
    const { findAuthUserByEmail } = await import('@/services/user-directory');
    ownerUserId = await findAuthUserByEmail(normalized);
    if (!ownerUserId) throw new Error(created.error.message);
  }
  if (!ownerUserId) throw new Error('Could not create owner account');

  const existing = await admin
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('user_id', ownerUserId)
    .maybeSingle();
  if (!existing.data) {
    const { error: insErr } = await admin.from('organization_members').insert({
      organization_id: organizationId,
      user_id: ownerUserId,
      role: 'owner',
      status: 'active',
      role_valid: true,
    });
    if (insErr) throw new Error(insErr.message);
  }
  await completeProvisioningStep(organizationId, 5);
  await audit(organizationId, actorUserId, 'owner.created', 'organization_member', ownerUserId, { email: normalized });
  return { ownerUserId, email: normalized, defaultPassword };
}

export async function addOrganizationMember(userId: string, organizationId: string, memberUserId: string, role: OrganizationRole) {
  await assertCanAssignRole(userId, organizationId, role);
  const admin = createAdminSupabaseClient();
  const profile = await admin.from('profiles').select('id').eq('id', memberUserId).maybeSingle();
  if (!profile.data) throw new Error('User profile not found');
  const existing = await admin.from('organization_members').select('role').eq('organization_id', organizationId).eq('user_id', memberUserId).maybeSingle();
  if (existing.data?.role === 'owner' && role !== 'owner') throw new Error('Organization owner cannot be demoted here');
  const { data, error } = await admin.from('organization_members').upsert({ organization_id: organizationId, user_id: memberUserId, role, status: 'active' }, { onConflict: 'organization_id,user_id' }).select('*').single();
  if (error) throw new Error(error.message);
  await audit(organizationId, userId, 'member.upsert', 'organization_member', data.user_id, { role });
  await refreshUsageSeats(organizationId);
  return data;
}

export async function createOrganizationBatch(userId: string, organizationId: string, input: { name: string; departmentId?: string|null; startYear?: number|null; endYear?: number|null }) {
  await assertAdminOrOwner(userId, organizationId);
  const admin = createAdminSupabaseClient();
  if (input.departmentId) {
    const department = await admin.from('organization_departments').select('id').eq('id', input.departmentId).eq('organization_id', organizationId).maybeSingle();
    if (!department.data) throw new Error('Department does not belong to organization');
  }
  const { data, error } = await admin.from('organization_batches').insert({ organization_id: organizationId, name: input.name.trim(), department_id: input.departmentId ?? null, start_year: input.startYear ?? null, end_year: input.endYear ?? null }).select('*').single();
  if (error) throw new Error(error.message);
  await audit(organizationId, userId, 'batch.create', 'organization_batch', data.id);
  return data;
}

export async function createOrganizationDepartment(userId: string, organizationId: string, name: string) {
  await assertAdminOrOwner(userId, organizationId);
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('organization_departments').insert({ organization_id: organizationId, name: name.trim() }).select('*').single();
  if (error) throw new Error(error.message);
  await audit(organizationId, userId, 'department.create', 'organization_department', data.id);
  return data;
}

export async function addBatchMember(userId: string, organizationId: string, batchId: string, memberUserId: string) {
  await assertManager(userId, organizationId);
  const admin = createAdminSupabaseClient();
  const batch = await admin.from('organization_batches').select('id').eq('id', batchId).eq('organization_id', organizationId).maybeSingle();
  if (!batch.data) throw new Error('Batch does not belong to organization');
  const member = await admin.from('organization_members').select('user_id').eq('organization_id', organizationId).eq('user_id', memberUserId).maybeSingle();
  if (!member.data) throw new Error('User is not an organization member');
  const { data, error } = await admin.from('batch_members').upsert({ batch_id: batchId, user_id: memberUserId }, { onConflict: 'batch_id,user_id' }).select('*').single();
  if (error) throw new Error(error.message);
  await audit(organizationId, userId, 'batch.member.add', 'batch_member', null, { batchId, memberUserId });
  return data;
}

function serviceForAssignmentType(targetType: 'course'|'topic'|'test'|'dsa'|'project'|'skill'): string | null {
  switch (targetType) {
    case 'course':
    case 'topic':
      return 'courses';
    case 'test':
      return 'tests';
    case 'dsa':
      return 'dsa';
    case 'project':
      return 'projects';
    case 'skill':
      return 'courses';
    default:
      return null;
  }
}

export async function createOrganizationAssignment(userId: string, organizationId: string, input: { title:string; description?:string; targetType:'course'|'topic'|'test'|'dsa'|'project'|'skill'; targetId?:string|null; batchId?:string|null; dueAt?:string|null }) {
  await assertManager(userId, organizationId);
  const gatedService = serviceForAssignmentType(input.targetType);
  if (gatedService) await assertOrganizationService(organizationId, gatedService);
  const admin = createAdminSupabaseClient();
  if (input.batchId) {
    const batch = await admin.from('organization_batches').select('id').eq('id', input.batchId).eq('organization_id', organizationId).maybeSingle();
    if (!batch.data) throw new Error('Batch does not belong to organization');
  }
  const { data, error } = await admin.from('organization_assignments').insert({ organization_id: organizationId, batch_id: input.batchId ?? null, title: input.title.trim(), description: input.description ?? '', target_type: input.targetType, target_id: input.targetId ?? null, due_at: input.dueAt ?? null, status: 'published', created_by: userId }).select('*').single();
  if (error) throw new Error(error.message);
  await audit(organizationId, userId, 'assignment.create', 'organization_assignment', data.id, { targetType: input.targetType, batchId: input.batchId ?? null });
  return data;
}

export async function createOrganizationInvite(userId: string, organizationId: string, role: Exclude<OrganizationRole,'owner'>, email?: string|null) {
  await assertCanAssignRole(userId, organizationId, role);
  const admin = createAdminSupabaseClient();
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const { data, error } = await admin.from('organization_invites').insert({ organization_id: organizationId, email: email?.trim().toLowerCase() || null, role, token_hash: tokenHash, created_by: userId }).select('id,role,email,expires_at').single();
  if (error) throw new Error(error.message);
  await audit(organizationId, userId, 'invite.create', 'organization_invite', data.id, { role, email: email?.trim().toLowerCase() || null });
  return { ...data, token: rawToken };
}

export async function acceptOrganizationInvite(userId: string, token: string) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const admin = createAdminSupabaseClient();
  const invite = await admin
    .from('organization_invites')
    .select('id,organization_id,role,email,expires_at,accepted_at,status,context')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (!invite.data || invite.data.accepted_at || invite.data.status !== 'pending') {
    throw new Error('Invite is invalid, expired, revoked, or already used');
  }
  if (new Date(invite.data.expires_at).getTime() < Date.now()) {
    await admin.from('organization_invites').update({ status: 'expired' }).eq('id', invite.data.id).eq('status', 'pending');
    throw new Error('Invite has expired');
  }

  const org = await admin.from('organizations').select('id,status').eq('id', invite.data.organization_id).maybeSingle();
  if (!org.data) throw new Error('Organization not found');
  if (org.data.status !== 'active') throw new Error('Organization is currently suspended');

  const authUser = await admin.auth.admin.getUserById(userId);
  const email = authUser.data.user?.email?.toLowerCase() ?? null;
  if (invite.data.email && invite.data.email !== email) throw new Error('This invite is for a different email address');

  const existing = await admin
    .from('organization_members')
    .select('role,status')
    .eq('organization_id', invite.data.organization_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing.data && existing.data.status === 'active' && existing.data.role !== invite.data.role) {
    throw new Error('This user is already an active member with a different organization role');
  }
  if (invite.data.role === 'owner' && existing.data && existing.data.role !== 'owner') {
    throw new Error('Owner provisioning requires a dedicated ownership transfer path for existing members');
  }

  const context = (invite.data.context ?? {}) as Record<string, unknown>;
  const batchId = typeof context.batchId === 'string' ? context.batchId : null;
  if (batchId) {
    const batch = await admin.from('organization_batches').select('id').eq('id', batchId).eq('organization_id', invite.data.organization_id).maybeSingle();
    if (!batch.data) throw new Error('Invite references an invalid organization batch');
  }

  // Atomically claim the invite so concurrent accepts cannot both succeed.
  const claimed = await admin
    .from('organization_invites')
    .update({ accepted_at: new Date().toISOString(), accepted_by: userId, status: 'accepted' })
    .eq('id', invite.data.id)
    .eq('status', 'pending')
    .is('accepted_at', null)
    .select('id')
    .maybeSingle();
  if (!claimed.data) throw new Error('Invite was already accepted or revoked');

  try {
    if (!existing.data) {
      const { error } = await admin.from('organization_members').insert({
        organization_id: invite.data.organization_id,
        user_id: userId,
        role: invite.data.role,
        status: 'active',
        metadata: context,
      });
      if (error) throw new Error(error.message);
    } else if (existing.data.status === 'inactive') {
      const { error } = await admin
        .from('organization_members')
        .update({ role: invite.data.role, status: 'active', deactivated_at: null, role_valid: true, metadata: context })
        .eq('organization_id', invite.data.organization_id)
        .eq('user_id', userId);
      if (error) throw new Error(error.message);
    }

    if (batchId) {
      const { error: batchError } = await admin.from('batch_members').upsert({ batch_id: batchId, user_id: userId }, { onConflict: 'batch_id,user_id' });
      if (batchError) throw new Error(batchError.message);
    }
  } catch (error) {
    // Best-effort rollback so a failed membership write does not permanently consume an invite.
    await admin.from('organization_invites').update({ accepted_at: null, accepted_by: null, status: 'pending' }).eq('id', invite.data.id).eq('status', 'accepted');
    throw error;
  }

  if (invite.data.role === 'owner') {
    await markOwnerAccepted(invite.data.organization_id);
    await audit(invite.data.organization_id, userId, 'owner.invite.accept', 'organization_member', userId, { role: 'owner' });
  }
  await refreshUsageSeats(invite.data.organization_id);
  return { organizationId: invite.data.organization_id, role: existing.data?.role ?? invite.data.role };
}


export async function getUserOrganizationAssignments(userId: string) {
  const admin = createAdminSupabaseClient();
  const memberships = await admin.from('organization_members').select('organization_id,role,status,organizations(name,slug,status)').eq('user_id', userId).eq('status', 'active');
  if (memberships.error) throw new Error(memberships.error.message);
  const activeMemberships = (memberships.data ?? []).filter((m:any) => m.organizations?.status === 'active');
  const orgIds = activeMemberships.map((m:any)=>m.organization_id);
  if (!orgIds.length) return [];
  const batchRows = await admin.from('batch_members').select('batch_id').eq('user_id', userId);
  const batchIds = (batchRows.data ?? []).map((b:any)=>b.batch_id);
  const result = await admin.from('organization_assignments').select('id,organization_id,batch_id,title,description,target_type,target_id,due_at,status,created_at,organizations(name,slug)').in('organization_id', orgIds).eq('status','published').order('due_at', { ascending: true, nullsFirst: false });
  if (result.error) throw new Error(result.error.message);

  const serviceByTarget: Record<string, string> = { course: 'courses', topic: 'courses', test: 'tests', dsa: 'dsa', project: 'projects', skill: 'courses' };
  const enabledByOrg = new Map<string, boolean>();
  const candidates = (result.data ?? []).filter((a:any)=>!a.batch_id || batchIds.includes(a.batch_id));
  for (const a of candidates) {
    const service = serviceByTarget[a.target_type];
    if (!service) { enabledByOrg.set(`${a.organization_id}:${service}`, true); continue; }
    const key = `${a.organization_id}:${service}`;
    if (!enabledByOrg.has(key)) enabledByOrg.set(key, await isOrganizationServiceEnabled(a.organization_id, service));
  }
  return candidates.filter((a:any) => {
    const service = serviceByTarget[a.target_type];
    return !service || enabledByOrg.get(`${a.organization_id}:${service}`) !== false;
  });
}
