import Link from 'next/link';
import { Sparkles, ChevronRight, BookOpen, StickyNote, Map as MapIcon, Compass } from 'lucide-react';
import { UserShell } from '@/app/user/(protected)/_components/user-shell';
import { NotesPanel } from '@/app/user/(protected)/_components/notes-panel';
import { RoadmapView } from '@/app/user/(protected)/_components/roadmap-view';
import { TopicWorkspace } from '@/app/public/_components/topic-workspace';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { getTopicBySlug } from '@/services/study';

type StudyCategoryRelation = { name: string } | Array<{ name: string }> | null;
type CourseTopic = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category_id: string | null;
  sort_order: number;
  study_categories?: StudyCategoryRelation;
};

function unwrapRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic: topicSlug } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id, courses(id, title, slug)')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false });

  const courseIds = (enrollments ?? []).map((i) => i.course_id);

  const { data: links } = courseIds.length
    ? await supabase.from('course_topics').select('course_id, sort_order, study_topics(id, title, slug, summary, category_id, study_categories(name))').in('course_id', courseIds).order('sort_order')
    : { data: [] };

  const topicIds = (links ?? []).map((l) => unwrapRelation(l.study_topics)?.id).filter(Boolean) as string[];

  const [{ data: noteRows }, { data: progressRows }] = await Promise.all([
    topicIds.length ? supabase.from('personal_notes').select('id, content, updated_at, study_topics(id, title, slug)').eq('user_id', user.id).in('topic_id', topicIds).order('updated_at', { ascending: false }) : Promise.resolve({ data: [] }),
    topicIds.length ? supabase.from('topic_progress').select('topic_id, progress').eq('user_id', user.id).in('topic_id', topicIds) : Promise.resolve({ data: [] }),
  ]);

  const notes = (noteRows ?? []).map((item) => {
    const topic = unwrapRelation(item.study_topics);
    return { id: item.id, content: item.content, updatedAt: item.updated_at, topicTitle: topic?.title ?? 'Untitled topic', topicSlug: topic?.slug, topicId: topic?.id };
  });

  const progress = new Map((progressRows ?? []).map((item) => [item.topic_id, item.progress ?? 0]));

  const roadmaps = (enrollments ?? []).map((e) => {
    const course = unwrapRelation(e.courses);
    const topics = (links ?? [])
      .filter((l) => l.course_id === e.course_id)
      .map((l) => {
        const t = unwrapRelation(l.study_topics) as CourseTopic | null;
        if (!t) return null;
        const cat = unwrapRelation(t.study_categories);
        return { id: t.id, title: t.title, slug: t.slug, summary: t.summary, categoryName: cat?.name ?? 'General', progress: progress.get(t.id) ?? 0 };
      })
      .filter((t): t is NonNullable<typeof t> => Boolean(t));

    return { id: course?.id ?? e.course_id, title: course?.title ?? 'Course Roadmap', slug: course?.slug ?? '', topics };
  }).filter((c) => c.topics.length > 0);

  let selectedTopic, selectedCategory, selectedLibrary;
  let selectedProgress = 0, selectedNote = '', selectedBookmarked = false;

  if (topicSlug) {
    const res = await getTopicBySlug(topicSlug);
    selectedTopic = res.topic;
    selectedCategory = res.category;
    selectedLibrary = res.library;

    if (selectedTopic && topicIds.includes(selectedTopic.id)) {
      const [{ data: pRow }, { data: nRow }, { data: bRow }] = await Promise.all([
        supabase.from('topic_progress').select('progress').eq('user_id', user.id).eq('topic_id', selectedTopic.id).maybeSingle(),
        supabase.from('personal_notes').select('content').eq('user_id', user.id).eq('topic_id', selectedTopic.id).maybeSingle(),
        supabase.from('bookmarks').select('topic_id').eq('user_id', user.id).eq('topic_id', selectedTopic.id).maybeSingle(),
      ]);
      selectedProgress = pRow?.progress ?? 0;
      selectedNote = nRow?.content ?? '';
      selectedBookmarked = Boolean(bRow);
    } else {
      selectedTopic = selectedCategory = selectedLibrary = undefined;
    }
  }

  const activeCourse = selectedTopic ? roadmaps.find((c) => c.topics.some((t) => t.id === selectedTopic.id)) : undefined;

  return (
    <UserShell>
      <div className="mx-auto max-w-7xl">
        {selectedTopic && selectedLibrary ? (
          <div className="min-h-[500px]">
            <TopicWorkspace
              topic={selectedTopic}
              category={selectedCategory}
              initialProgress={selectedProgress}
              initialNote={selectedNote}
              initialBookmarked={selectedBookmarked}
              portalPath="/dashboard/notes?topic="
              courseTitle={activeCourse?.title}
              courseTopics={activeCourse?.topics}
            />
          </div>
        ) : courseIds.length ? (
          <div className="space-y-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <MapIcon size={16} />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">Your Learning Path</h2>
                </div>
                <Link className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition" href="/dashboard/roadmap">
                  <span>Open full path</span> <ChevronRight size={13} />
                </Link>
              </div>
              <RoadmapView courses={roadmaps} />
            </section>

            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] p-5 shadow-sm dark:shadow-xl">
              <div className="mb-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <StickyNote size={16} />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">Topic Notes</h2>
                </div>
                <span className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                </span>
              </div>
              <NotesPanel notes={notes} />
            </section>
          </div>
        ) : (
          <section className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] py-14 px-4 text-center shadow-sm dark:shadow-xl">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <Compass size={24} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Start Learning</span>
            <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">No course enrolled yet</h2>
            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              Select a course to start. Your personalized learning roadmap, progress, and study notes will show here once you enroll.
            </p>
            <Link className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500" href="/dashboard/courses">
              <BookOpen size={13} /> <span>Browse courses</span>
            </Link>
          </section>
        )}
      </div>
    </UserShell>
  );
}