import 'server-only';

import { createAdminSupabaseClient } from '@/services/supabase-admin';

export type AuditEntry = {
  id: string;
  organization_id: string;
  actor_user_id: string | null;
  actor_name: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type AuditRow = {
  id: string;
  organization_id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  name: string | null;
};

async function getActorMap(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  actorIds: string[],
) {
  const profileMap = new Map<
    string,
    {
      name: string;
      email: string;
    }
  >();

  if (actorIds.length === 0) {
    return profileMap;
  }

  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id,name')
    .in('id', actorIds);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const profileRows = (profiles ?? []) as ProfileRow[];

  for (const profile of profileRows) {
    profileMap.set(profile.id, {
      name: profile.name ?? '',
      email: '',
    });
  }

  // Email belongs to auth.users, not public.profiles.
  // Load it through Supabase Admin Auth so we do not depend
  // on a non-existent profiles.email column.
  await Promise.all(
    actorIds.map(async (userId) => {
      const result = await admin.auth.admin.getUserById(userId);

      if (result.error || !result.data.user) {
        return;
      }

      const existing = profileMap.get(userId);

      profileMap.set(userId, {
        name: existing?.name ?? '',
        email: result.data.user.email ?? '',
      });
    }),
  );

  return profileMap;
}

export async function listAuditLogs(
  organizationId: string,
  opts: {
    search?: string;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<{
  entries: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const admin = createAdminSupabaseClient();

  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 20));

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const {
    data,
    count,
    error,
  } = await admin
    .from('organization_audit_logs')
    .select(
      'id,organization_id,actor_user_id,action,entity_type,entity_id,metadata,created_at',
      { count: 'exact' },
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as AuditRow[];

  const actorIds = Array.from(
    new Set(
      rows
        .map((row) => row.actor_user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const actorMap = await getActorMap(admin, actorIds);

  const mapped: AuditEntry[] = rows.map((row) => {
    const actor = row.actor_user_id
      ? actorMap.get(row.actor_user_id)
      : undefined;

    return {
      id: row.id,
      organization_id: row.organization_id,
      actor_user_id: row.actor_user_id,
      actor_name:
        actor?.name ||
        actor?.email ||
        row.actor_user_id ||
        'System',
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      metadata: row.metadata ?? {},
      created_at: row.created_at,
    };
  });

  const search = opts.search?.trim().toLowerCase();

  if (search) {
    const filtered = mapped.filter(
      (entry) =>
        entry.action.toLowerCase().includes(search) ||
        entry.actor_name.toLowerCase().includes(search) ||
        (entry.entity_type ?? '').toLowerCase().includes(search),
    );

    return {
      entries: filtered,
      total: filtered.length,
      page,
      pageSize,
    };
  }

  return {
    entries: mapped,
    total: count ?? mapped.length,
    page,
    pageSize,
  };
}

export async function listPlatformAudit(
  orgId?: string | null,
  limit = 100,
) {
  const admin = createAdminSupabaseClient();

  let query = admin
    .from('organization_audit_logs')
    .select(
      'id,organization_id,actor_user_id,action,entity_type,entity_id,metadata,created_at',
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (orgId) {
    query = query.eq('organization_id', orgId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as AuditRow[];

  const actorIds = Array.from(
    new Set(
      rows
        .map((row) => row.actor_user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const actorMap = await getActorMap(admin, actorIds);

  return rows.map((row) => {
    const actor = row.actor_user_id
      ? actorMap.get(row.actor_user_id)
      : undefined;

    return {
      ...row,
      actor: actor
        ? {
            name: actor.name,
            email: actor.email,
          }
        : null,
    };
  });
}