import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';

async function admin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return { supabase, response: NextResponse.json({ error: 'Admin access required.' }, { status: 403 }) };
  return { supabase, user };
}

export async function GET(request: Request) {
  const { supabase, response } = await admin();
  if (response) return response;
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || '1') || 1);
  const pageSize = Math.min(50, Math.max(10, Number(url.searchParams.get('pageSize') || '25') || 25));
  const query = (url.searchParams.get('q') || '').trim().slice(0, 80);
  const role = url.searchParams.get('role');
  const status = url.searchParams.get('status');
  let usersQuery = supabase.from('profiles').select('id,name,role,status,created_at',{count:'exact'}).order('created_at',{ascending:false}).range((page-1)*pageSize,page*pageSize-1);
  if (query) usersQuery = usersQuery.ilike('name', `%${query.replace(/[%_]/g, '\\$&')}%`);
  if (role === 'admin' || role === 'user') usersQuery = usersQuery.eq('role', role);
  if (status === 'active' || status === 'suspended') usersQuery = usersQuery.eq('status', status);
  const { data, error, count } = await usersQuery;
  if (error) return NextResponse.json({ error: 'The requested operation could not be completed.' }, { status: 500 });
  const ids = (data ?? []).map((x) => x.id);
  const activity: Record<string, { completed: number; enrolled: number; tests: number; solved: number; certs: number }> = {};
  if (ids.length) {
    const [{ data: progress }, { data: enrollments }, { data: attempts }, { data: submissions }, { data: certificates }] = await Promise.all([
      supabase.from('topic_progress').select('user_id,progress,status').in('user_id', ids),
      supabase.from('enrollments').select('user_id').in('user_id', ids),
      supabase.from('test_attempts').select('user_id').in('user_id', ids),
      supabase.from('dsa_submissions').select('user_id,status').in('user_id', ids),
      supabase.from('certificates').select('user_id').in('user_id', ids),
    ]);
    for (const row of progress ?? []) { const x = activity[row.user_id] ?? { completed: 0, enrolled: 0, tests: 0, solved: 0, certs: 0 }; if (row.status === 'completed' || row.progress === 100) x.completed += 1; activity[row.user_id] = x; }
    for (const row of enrollments ?? []) { const x = activity[row.user_id] ?? { completed: 0, enrolled: 0, tests: 0, solved: 0, certs: 0 }; x.enrolled += 1; activity[row.user_id] = x; }
    for (const row of attempts ?? []) { const x = activity[row.user_id] ?? { completed: 0, enrolled: 0, tests: 0, solved: 0, certs: 0 }; x.tests += 1; activity[row.user_id] = x; }
    for (const row of submissions ?? []) { const x = activity[row.user_id] ?? { completed: 0, enrolled: 0, tests: 0, solved: 0, certs: 0 }; if (row.status === 'accepted') x.solved += 1; activity[row.user_id] = x; }
    for (const row of certificates ?? []) { const x = activity[row.user_id] ?? { completed: 0, enrolled: 0, tests: 0, solved: 0, certs: 0 }; x.certs += 1; activity[row.user_id] = x; }
  }
  return NextResponse.json({ users: data ?? [], activity, page, pageSize, total: count ?? 0, totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)) }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PATCH(request: Request) {
  const { supabase, response, user } = await admin();
  if (response) return response;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }
  const id = typeof body.id === 'string' ? body.id : '';
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : undefined;
  const role = body.role === 'admin' ? 'admin' : body.role === 'user' ? 'user' : undefined;
  const status = body.status === 'suspended' ? 'suspended' : body.status === 'active' ? 'active' : undefined;
  if (!id) return NextResponse.json({ error: 'User id is required.' }, { status: 400 });
  if (id === user.id && (role === 'user' || status === 'suspended')) return NextResponse.json({ error: 'You cannot remove your own admin access.' }, { status: 409 });
  if (role === 'user') { const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin'); if ((count ?? 0) <= 1) return NextResponse.json({ error: 'At least one administrator account must remain.' }, { status: 409 }); }
  if (!name && !role && !status) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (role !== undefined) update.role = role;
  if (status !== undefined) { update.status = status; update.suspended_at = status === 'suspended' ? new Date().toISOString() : null; update.suspended_by = status === 'suspended' ? user.id : null; update.suspension_reason = status === 'suspended' ? (typeof body.reason === 'string' ? body.reason.trim().slice(0, 300) : 'Suspended by administrator') : null; }
  const { data, error } = await supabase.from('profiles').update(update).eq('id', id).select('id,name,role,status,created_at').single();
  if (error) return NextResponse.json({ error: 'The requested operation could not be completed.' }, { status: 400 });
  await supabase.from('activity_logs').insert({ user_id: user.id, event_type: 'ADMIN_USER_UPDATED', entity_type: 'profile', entity_id: id, metadata: update });
  return NextResponse.json({ user: data });
}
