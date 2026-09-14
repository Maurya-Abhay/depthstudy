import { NextRequest, NextResponse } from 'next/server';
import { getTopicContent } from '@/services/study';
import { createServerSupabaseClient } from '@/services/supabase-server';

// Lightweight endpoint used by the topic workspace to switch topics
// client-side (only the reading content updates, no full page reload).
export async function GET(request: NextRequest) {
  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug is required.' }, { status: 400 });

  const { topic, category, error } = await getTopicContent(slug);
  if (!topic) return NextResponse.json({ error: error ?? 'Topic not found.' }, { status: 404 });

  let progress = 0;
  let note = '';
  let bookmarked = false;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const [{ data: progressRows }, { data: noteRow }, { data: bookmarkRow }] = await Promise.all([
        supabase.from('topic_progress').select('progress').eq('user_id', user.id).eq('topic_id', topic.id).maybeSingle(),
        supabase.from('personal_notes').select('content').eq('user_id', user.id).eq('topic_id', topic.id).maybeSingle(),
        supabase.from('bookmarks').select('topic_id').eq('user_id', user.id).eq('topic_id', topic.id).maybeSingle(),
      ]);
      progress = progressRows?.progress ?? 0;
      note = noteRow?.content ?? '';
      bookmarked = Boolean(bookmarkRow);
    }
  } catch {
    // Anonymous users just get the topic content.
  }

  return NextResponse.json({ topic, category, progress, note, bookmarked });
}
