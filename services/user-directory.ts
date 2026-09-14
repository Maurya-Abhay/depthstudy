import 'server-only';

import { createAdminSupabaseClient } from '@/services/supabase-admin';

export type UserDirectoryRow = {
  id: string;
  name: string;
  email: string;
};

export async function getUserDirectoryByIds(userIds: string[]): Promise<Map<string, UserDirectoryRow>> {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  const map = new Map<string, UserDirectoryRow>();
  if (uniqueIds.length === 0) return map;

  const admin = createAdminSupabaseClient();

  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select('id,name')
    .in('id', uniqueIds);

  if (profileError) throw new Error(profileError.message);

  for (const profile of (profiles ?? []) as Array<{ id: string; name: string | null }>) {
    map.set(profile.id, {
      id: profile.id,
      name: profile.name ?? '',
      email: '',
    });
  }

  // Supabase Auth owns email addresses; public.profiles intentionally does not.
  // Resolve only the requested users and do it concurrently for low latency on
  // the bounded paginated admin/org lists.
  await Promise.all(
    uniqueIds.map(async (userId) => {
      const { data, error } = await admin.auth.admin.getUserById(userId);
      if (error || !data.user) return;
      const existing = map.get(userId);
      map.set(userId, {
        id: userId,
        name: existing?.name ?? String(data.user.user_metadata?.name ?? ''),
        email: data.user.email ?? '',
      });
    }),
  );

  return map;
}


export async function findAuthUserByEmail(email: string): Promise<string | null> {
  const normalized = String(email ?? '').trim().toLowerCase();
  if (!normalized) return null;

  const admin = createAdminSupabaseClient();
  const perPage = 1000;

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw new Error(error.message);

    const users = data.users ?? [];
    const found = users.find(
      (user) => user.email?.toLowerCase() === normalized,
    );
    if (found) return found.id;

    if (users.length < perPage) break;
  }

  return null;
}
