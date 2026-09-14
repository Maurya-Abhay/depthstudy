import 'server-only';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { createAdminSupabaseClient } from '@/services/supabase-admin';

function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function readProfileRole(userId: string): Promise<string | null> {
  // 1) Normal path: RLS SELECT policy (users read own profile).
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
    if (data?.role === 'admin' || data?.role === 'user') return data.role;
  } catch {
    // fall through to service-role fallback below
  }
  // 2) Fallback: service-role bypasses RLS (fixes loop when SELECT policy missing).
  if (hasServiceRole()) {
    try {
      const admin = createAdminSupabaseClient();
      const { data } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle();
      if (data?.role === 'admin' || data?.role === 'user') return data.role;
    } catch {
      return null;
    }
  }
  return null;
}

async function readLearnerProfile(userId: string): Promise<{ role: string | null; status: string | null }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.from('profiles').select('role,status').eq('id', userId).maybeSingle();
    if (data?.role) return { role: data.role, status: data.status ?? null };
  } catch {
    // fall through
  }
  if (hasServiceRole()) {
    try {
      const admin = createAdminSupabaseClient();
      const { data } = await admin.from('profiles').select('role,status').eq('id', userId).maybeSingle();
      if (data?.role) return { role: data.role, status: data.status ?? null };
    } catch {
      return { role: null, status: null };
    }
  }
  return { role: null, status: null };
}

async function ensureProfileRow(userId: string, email?: string | null): Promise<string | null> {
  if (!hasServiceRole()) return null;
  try {
    const admin = createAdminSupabaseClient();
    const { data: existing } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle();
    if (existing?.role === 'admin' || existing?.role === 'user') return existing.role;
    // Profile row missing (old user created before trigger) -> create it as learner.
    const { data: created, error } = await admin
      .from('profiles')
      .upsert({ id: userId, name: email?.split('@')[0] ?? '', role: 'user', status: 'active' }, { onConflict: 'id' })
      .select('role')
      .maybeSingle();
    if (error) return existing?.role ?? null;
    return created?.role ?? 'user';
  } catch {
    return null;
  }
}

export async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/login');
  return data.user;
}

export async function getCurrentRole(userId: string) {
  const role = await readProfileRole(userId);
  return role === 'admin' ? 'admin' : role === 'user' ? 'user' : null;
}

export async function requireLearner() {
  const user = await requireUser();
  let profile = await readLearnerProfile(user.id);
  // Self-heal: profile row missing entirely -> create it, then continue.
  if (!profile?.role) {
    const healed = await ensureProfileRow(user.id, user.email);
    if (healed) profile = { role: healed, status: 'active' };
  }
  if (profile?.status === 'suspended') redirect('/login?error=suspended');
  const role = profile?.role;
  if (role === 'admin') redirect('/admin');
  if (role !== 'user') redirect('/login');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  const role = await getCurrentRole(user.id);
  if (role !== 'admin') redirect('/dashboard');
  return user;
}
