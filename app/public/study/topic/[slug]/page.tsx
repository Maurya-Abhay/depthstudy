import { notFound } from 'next/navigation';
import { getTopicBySlug } from '@/services/study';
import { TopicWorkspace } from '@/app/public/_components/topic-workspace';
import { TopicHeader } from '@/app/public/_components/topic-header';
import { createServerSupabaseClient } from '@/services/supabase-server';

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { topic, category, library } = await getTopicBySlug(slug);

  if (!topic) notFound();

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all progress, notes, and bookmark concurrently
  const [{ data: userProgressList }, { data: savedNote }, { data: bookmark }] = user
    ? await Promise.all([
        supabase
          .from('topic_progress')
          .select('topic_id, progress')
          .eq('user_id', user.id),
        supabase
          .from('personal_notes')
          .select('content')
          .eq('user_id', user.id)
          .eq('topic_id', topic.id)
          .maybeSingle(),
        supabase
          .from('bookmarks')
          .select('topic_id')
          .eq('user_id', user.id)
          .eq('topic_id', topic.id)
          .maybeSingle(),
      ])
    : [{ data: [] }, { data: null }, { data: null }];

  // Map progress array to lookup object for quick access
  const progressMap = new Map<string, number>();
  (userProgressList || []).forEach((item) => {
    progressMap.set(item.topic_id, item.progress);
  });

  // Build global learning sequence across all categories
  const categories = library?.categories ?? [];
  const allTopics = library?.topics ?? [];
  const orderedTopics = categories.flatMap((cat) => allTopics.filter((t) => t.categoryId === cat.id));
  const orderedIds = new Set(orderedTopics.map((t) => t.id));
  const sequence = [...orderedTopics, ...allTopics.filter((t) => !orderedIds.has(t.id))];

  const index = sequence.findIndex((item) => item.id === topic.id);
  const prevTopic = index > 0 ? sequence[index - 1] : undefined;
  const nextTopic = index >= 0 && index < sequence.length - 1 ? sequence[index + 1] : undefined;

  const currentProgress = progressMap.get(topic.id) ?? 0;

  // Normalize topics for Workspace Sidebar
  const categoryNameById = new Map(categories.map((cat) => [cat.id, cat.name]));
  const courseTopics = sequence.map((t) => ({
    id: t.id,
    title: t.title,
    slug: t.slug,
    categoryName: (t.categoryId ? categoryNameById.get(t.categoryId) : undefined) ?? category?.name ?? 'Curriculum',
    progress: progressMap.get(t.id) ?? 0,
  }));

  return (
    <main className="h-screen overflow-hidden bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* COMPACT TOP NAVIGATION BAR */}
      <TopicHeader
        topic={topic}
        category={category}
        progress={currentProgress}
        signedIn={Boolean(user)}
      />

      {/* WORKSPACE CONTAINER */}
      <div className="flex-1 overflow-hidden p-2">
        <TopicWorkspace
          topic={topic}
          prev={prevTopic}
          next={nextTopic}
          initialProgress={currentProgress}
          initialNote={savedNote?.content ?? ''}
          initialBookmarked={Boolean(bookmark)}
          category={category}
          courseTitle={category?.name || 'Course Content'}
          courseTopics={courseTopics}
          library={library}
        />
      </div>
    </main>
  );
}