import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data, error } = await supabase
    .from('notifications')
    .select('id,title,message,kind,created_at,read_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) return NextResponse.json({ error: 'Unable to load notifications.' }, { status: 400 });
  const items = data ?? [];
  return NextResponse.json(
    { notifications: items, unread: items.filter((item) => !item.read_at).length },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  let body: { id?: unknown; all?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

  if (body.all === true) {
    const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
    if (error) return NextResponse.json({ error: 'Unable to update notifications.' }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (typeof body.id !== 'string' || !body.id) return NextResponse.json({ error: 'Notification id is required.' }, { status: 400 });
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', body.id).eq('user_id', user.id).is('read_at', null);
  if (error) return NextResponse.json({ error: 'Unable to update notification.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
