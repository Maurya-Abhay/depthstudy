import 'server-only';

import crypto from 'node:crypto';

import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { OrganizationRole } from '@/services/organization';
import { refreshUsageSeats } from '@/services/organization-usage';
import { assertOrganizationSeatAvailable } from '@/services/entitlements';

export type MemberRow = {
  user_id: string;
  role: OrganizationRole;
  status: string;
  joined_at: string;
  deactivated_at: string | null;
  last_seen_at: string | null;
  name: string;
  email: string;
};

type OrganizationMemberRecord = {
  user_id: string;
  role: OrganizationRole;
  status: string;
  joined_at: string;
  deactivated_at: string | null;
  last_seen_at: string | null;
};

type ProfileRecord = {
  id: string;
  name: string | null;
  email: string | null;
};

async function assertCanManage(
  actorRole: OrganizationRole | null,
): Promise<void> {
  if (!actorRole || (actorRole !== 'owner' && actorRole !== 'admin')) {
    throw new Error(
      'Only organization owners and admins can manage members',
    );
  }
}

async function getActorRole(
  actorUserId: string,
  organizationId: string,
): Promise<OrganizationRole | null> {
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from('organization_members')
    .select('role,status,organization_id')
    .eq('organization_id', organizationId)
    .eq('user_id', actorUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  if (data.status === 'inactive') {
    return null;
  }

  const role = data.role as OrganizationRole;

  if (!['owner', 'admin', 'mentor', 'student'].includes(role)) {
    return null;
  }

  return role;
}

async function audit(
  organizationId: string,
  actorUserId: string,
  action: string,
  entityType: string,
  entityId?: string | null,
  metadata: Record<string, unknown> = {},
) {
  const admin = createAdminSupabaseClient();

  const { error } = await admin
    .from('organization_audit_logs')
    .insert({
      organization_id: organizationId,
      actor_user_id: actorUserId,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      metadata,
    });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listMembers(
  organizationId: string,
  opts: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<{
  members: MemberRow[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const admin = createAdminSupabaseClient();

  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 20));

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Do NOT use:
  // profiles(...)
  //
  // There is no guaranteed PostgREST relationship from
  // organization_members to profiles in the current schema.

  let query = admin
    .from('organization_members')
    .select(
      'user_id,role,status,joined_at,deactivated_at,last_seen_at',
      { count: 'exact' },
    )
    .eq('organization_id', organizationId);

  if (
    opts.role &&
    ['owner', 'admin', 'mentor', 'student'].includes(opts.role)
  ) {
    query = query.eq('role', opts.role);
  }

  if (opts.status === 'active' || opts.status === 'inactive') {
    query = query.eq('status', opts.status);
  }

  const {
    data,
    count,
    error,
  } = await query
    .order('joined_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const members = (data ?? []) as OrganizationMemberRecord[];

  const userIds = Array.from(
    new Set(
      members
        .map((member) => member.user_id)
        .filter(Boolean),
    ),
  );

  const profileMap = new Map<string, ProfileRecord>();

  if (userIds.length > 0) {
    const {
      data: profiles,
      error: profileError,
    } = await admin
      .from('profiles')
      .select('id,name')
      .in('id', userIds);

    if (profileError) {
      throw new Error(profileError.message);
    }

    for (const profile of (profiles ?? []) as ProfileRecord[]) {
      profileMap.set(profile.id, profile);
    }
    // Email lives in auth.users, NOT public.profiles — enrich via Admin Auth.
    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const result = await admin.auth.admin.getUserById(userId);
          const email = result.data.user?.email ?? '';
          const existing = profileMap.get(userId);
          profileMap.set(userId, {
            id: userId,
            name: existing?.name ?? (result.data.user?.user_metadata as any)?.name ?? '',
            email,
          });
        } catch { /* best effort — leave email blank */ }
      }),
    );
  }

  const rows: MemberRow[] = members.map((member) => {
    const profile = profileMap.get(member.user_id);

    return {
      user_id: member.user_id,
      role: member.role,
      status: member.status,
      joined_at: member.joined_at,
      deactivated_at: member.deactivated_at,
      last_seen_at: member.last_seen_at,
      name: profile?.name ?? '',
      email: profile?.email ?? '',
    };
  });

  const search = opts.search?.trim().toLowerCase();

  if (search) {
    const filtered = rows.filter(
      (row) =>
        row.name.toLowerCase().includes(search) ||
        row.email.toLowerCase().includes(search) ||
        row.role.toLowerCase().includes(search),
    );

    return {
      members: filtered,
      total: filtered.length,
      page,
      pageSize,
    };
  }

  return {
    members: rows,
    total: count ?? rows.length,
    page,
    pageSize,
  };
}

export async function createInvite(
  actorUserId: string,
  organizationId: string,
  role: Exclude<OrganizationRole, 'owner'>,
  email?: string | null,
  metadata: Record<string, unknown> = {},
) {
  const actorRole = await getActorRole(actorUserId, organizationId);

  await assertCanManage(actorRole);

  const elevated = role === 'admin' || role === 'mentor';

  if (elevated && actorRole !== 'owner') {
    throw new Error(
      'Only the organization owner can invite admins/mentors',
    );
  }

  if (actorRole === 'mentor' || actorRole === null) {
    throw new Error('Insufficient role to invite members');
  }

  if (role === 'student' || role === 'mentor') {
    await assertOrganizationSeatAvailable(organizationId, role);
  }

  const admin = createAdminSupabaseClient();

  const rawToken = crypto.randomBytes(32).toString('hex');

  const tokenHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const normalizedEmail = email?.trim().toLowerCase() || null;

  const {
    data,
    error,
  } = await admin
    .from('organization_invites')
    .insert({
      organization_id: organizationId,
      email: normalizedEmail,
      role,
      token_hash: tokenHash,
      created_by: actorUserId,
      context: metadata,
    })
    .select(
      'id,organization_id,email,role,status,created_at,expires_at,accepted_at,revoked_at,revoked_by,created_by,context',
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await audit(
    organizationId,
    actorUserId,
    'invite.create',
    'organization_invite',
    data.id,
    {
      role,
      email: normalizedEmail,
    },
  );

  return {
    ...data,
    token: rawToken,
  };
}

export async function revokeInvite(
  actorUserId: string,
  organizationId: string,
  inviteId: string,
) {
  const actorRole = await getActorRole(actorUserId, organizationId);

  await assertCanManage(actorRole);

  const admin = createAdminSupabaseClient();

  const { error } = await admin
    .from('organization_invites')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by: actorUserId,
    })
    .eq('id', inviteId)
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error(error.message);
  }

  await audit(
    organizationId,
    actorUserId,
    'invite.revoke',
    'organization_invite',
    inviteId,
  );
}

export async function resendInvite(
  actorUserId: string,
  organizationId: string,
  inviteId: string,
) {
  const admin = createAdminSupabaseClient();

  const {
    data: invite,
    error,
  } = await admin
    .from('organization_invites')
    .select('email,role,context')
    .eq('id', inviteId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!invite) {
    throw new Error('Invite not found');
  }

  await revokeInvite(
    actorUserId,
    organizationId,
    inviteId,
  );

  return createInvite(
    actorUserId,
    organizationId,
    invite.role as Exclude<OrganizationRole, 'owner'>,
    invite.email,
    (invite.context as Record<string, unknown>) ?? {},
  );
}

export async function listInvites(organizationId: string) {
  const admin = createAdminSupabaseClient();

  const {
    data,
    error,
  } = await admin
    .from('organization_invites')
    .select(
      'id,organization_id,email,role,status,created_at,expires_at,accepted_at,revoked_at,revoked_by,created_by,context',
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function deactivateMember(
  actorUserId: string,
  organizationId: string,
  memberUserId: string,
) {
  const actorRole = await getActorRole(
    actorUserId,
    organizationId,
  );

  await assertCanManage(actorRole);

  const admin = createAdminSupabaseClient();

  const {
    data: target,
    error: targetError,
  } = await admin
    .from('organization_members')
    .select('role,status')
    .eq('organization_id', organizationId)
    .eq('user_id', memberUserId)
    .maybeSingle();

  if (targetError) {
    throw new Error(targetError.message);
  }

  if (!target) {
    throw new Error('Member not found');
  }

  if (target.role === 'owner') {
    throw new Error(
      'Organization owner cannot be deactivated',
    );
  }

  if (target.role === 'admin' && actorRole !== 'owner') {
    throw new Error(
      'Only the owner can deactivate an admin',
    );
  }

  if (memberUserId === actorUserId) {
    throw new Error('You cannot deactivate yourself');
  }

  const { error } = await admin
    .from('organization_members')
    .update({
      status: 'inactive',
      deactivated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)
    .eq('user_id', memberUserId);

  if (error) {
    throw new Error(error.message);
  }

  await audit(
    organizationId,
    actorUserId,
    'member.deactivate',
    'organization_member',
    memberUserId,
  );

  await refreshUsageSeats(organizationId);
}

export async function reactivateMember(
  actorUserId: string,
  organizationId: string,
  memberUserId: string,
) {
  const actorRole = await getActorRole(
    actorUserId,
    organizationId,
  );

  await assertCanManage(actorRole);

  const admin = createAdminSupabaseClient();

  const {
    data: target,
    error: targetError,
  } = await admin
    .from('organization_members')
    .select('role,status')
    .eq('organization_id', organizationId)
    .eq('user_id', memberUserId)
    .maybeSingle();

  if (targetError) {
    throw new Error(targetError.message);
  }

  if (!target) {
    throw new Error('Member not found');
  }

  if (target.role === 'owner') {
    throw new Error(
      'Organization owner does not need reactivation',
    );
  }

  if (target.role === 'admin' && actorRole !== 'owner') {
    throw new Error(
      'Only the owner can reactivate an admin',
    );
  }

  const { error } = await admin
    .from('organization_members')
    .update({
      status: 'active',
      deactivated_at: null,
    })
    .eq('organization_id', organizationId)
    .eq('user_id', memberUserId);

  if (error) {
    throw new Error(error.message);
  }

  await audit(
    organizationId,
    actorUserId,
    'member.reactivate',
    'organization_member',
    memberUserId,
  );

  await refreshUsageSeats(organizationId);
}

export async function changeMemberRole(
  actorUserId: string,
  organizationId: string,
  memberUserId: string,
  newRole: OrganizationRole,
) {
  const actorRole = await getActorRole(
    actorUserId,
    organizationId,
  );

  await assertCanManage(actorRole);

  if (!actorRole) {
    throw new Error('Insufficient role');
  }

  const admin = createAdminSupabaseClient();

  const {
    data: target,
    error: targetError,
  } = await admin
    .from('organization_members')
    .select('role,status')
    .eq('organization_id', organizationId)
    .eq('user_id', memberUserId)
    .maybeSingle();

  if (targetError) {
    throw new Error(targetError.message);
  }

  if (!target) {
    throw new Error('Member not found');
  }

  const hierarchy: Record<OrganizationRole, number> = {
    owner: 4,
    admin: 3,
    mentor: 2,
    student: 1,
  };

  if (target.role === 'owner') {
    throw new Error(
      'Organization owner role cannot be changed here',
    );
  }

  if (newRole === 'owner') {
    throw new Error(
      'Owner transfer requires a dedicated ownership flow',
    );
  }

  if (newRole === 'admin' && actorRole !== 'owner') {
    throw new Error(
      'Only the owner can assign the admin role',
    );
  }

  if (
    actorRole !== 'owner' &&
    hierarchy[newRole] >= hierarchy[actorRole]
  ) {
    throw new Error(
      'You cannot assign a role at or above your own',
    );
  }

  const { error } = await admin
    .from('organization_members')
    .update({
      role: newRole,
      role_valid: true,
    })
    .eq('organization_id', organizationId)
    .eq('user_id', memberUserId);

  if (error) {
    throw new Error(error.message);
  }

  await audit(
    organizationId,
    actorUserId,
    'member.role_change',
    'organization_member',
    memberUserId,
    {
      from: target.role,
      to: newRole,
    },
  );
}
/**
 * Direct add: auth account (with password) + membership. No invite/token flow.
 */
export async function directAddMember(
  actorUserId: string,
  organizationId: string,
  opts: { email: string; password: string; role: Exclude<OrganizationRole, 'owner'> },
) {
  const actorRole = await getActorRole(actorUserId, organizationId);
  await assertCanManage(actorRole);
  if (opts.role === 'admin' && actorRole !== 'owner') {
    throw new Error('Only the organization owner can add organization admins');
  }

  const admin = createAdminSupabaseClient();
  const cleanEmail = String(opts.email ?? '').trim().toLowerCase();
  const cleanPassword = String(opts.password ?? '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) throw new Error('Valid email is required');
  if (cleanPassword.length < 8) throw new Error('Password is required (min 8 characters)');
  if (opts.role === 'student' || opts.role === 'mentor') {
    await assertOrganizationSeatAvailable(organizationId, opts.role);
  }

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
  if (!userId) throw new Error('Account banane me fail hua. Dobara try karo.');
  const upd = await admin.auth.admin.updateUserById(userId, { password: cleanPassword });
  if (upd.error) throw new Error(upd.error.message);

  const { error } = await admin
    .from('organization_members')
    .upsert(
      { organization_id: organizationId, user_id: userId, role: opts.role, status: 'active' },
      { onConflict: 'organization_id,user_id' },
    );
  if (error) throw new Error(error.message);
  await refreshUsageSeats(organizationId);
  return { added: true as const, member: { user_id: userId }, credentials: { email: cleanEmail, password: cleanPassword } };
}
