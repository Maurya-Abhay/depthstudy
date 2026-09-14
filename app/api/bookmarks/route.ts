import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';

async function getUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function POST(request: Request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to save bookmarks.' }, { status: 401 });
  let body: { topicId?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  const topicId = typeof body.topicId === 'string' ? body.topicId : '';
  if (!topicId) return NextResponse.json({ error: 'Topic is required.' }, { status: 400 });
  const { error } = await supabase.from('bookmarks').upsert({ user_id: user.id, topic_id: topicId }, { onConflict: 'user_id,topic_id' });
  if (error) return NextResponse.json({ error: 'Unable to save bookmark.' }, { status: 400 });
  return NextResponse.json({ bookmarked: true });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const topicId = new URL(request.url).searchParams.get('topicId');
  if (!topicId) return NextResponse.json({ error: 'Topic is required.' }, { status: 400 });
  const { error } = await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('topic_id', topicId);
  if (error) return NextResponse.json({ error: 'Unable to remove bookmark.' }, { status: 400 });
  return NextResponse.json({ bookmarked: false });
}
