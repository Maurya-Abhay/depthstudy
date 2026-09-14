import { UserShell } from '@/app/user/(protected)/_components/user-shell';
import { RoadmapView } from '@/app/user/(protected)/_components/roadmap-view';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { Map as MapIcon, CheckCircle2, AlertCircle, BookOpen, ChevronRight, RefreshCw } from 'lucide-react';

type StudyCategoryRelation = { name: string } | Array<{ name: string }> | null;

type TopicRow = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category_id: string | null;
  study_categories?: StudyCategoryRelation;
};

type CourseTopicLink = { course_id: string; topic_id: string; sort_order: number };

export default async function RoadmapPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const contentClient = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminSupabaseClient()
    : supabase;

  const [
    { data: courses, error: coursesError },
    { data: enrollments, error: enrollmentsError },
    { data: categoryLinks, error: categoryLinksError },
  ] = await Promise.all([
    contentClient
      .from('courses')
      .select('id,title,slug,description,content')
      .eq('published', true)
      .order('title'),
    supabase.from('enrollments').select('course_id').eq('user_id', user.id),
    contentClient
      .from('course_categories')
      .select('course_id,category_id,sort_order')
      .order('sort_order'),
  ]);

  const courseIds = (courses ?? []).map((course) => course.id);
  const { data: links, error: linksError } = courseIds.length
    ? await contentClient
        .from('course_topics')
        .select('course_id,topic_id,sort_order')
        .in('course_id', courseIds)
        .order('sort_order')
    : { data: [] as CourseTopicLink[], error: null };

  const categoryIds = [
    ...new Set((categoryLinks ?? []).map((link) => link.category_id).filter(Boolean)),
  ];

  const [{ data: topicRows, error: topicsError }, { data: categoryRows, error: categoriesError }] =
    await Promise.all([
      contentClient
        .from('study_topics')
        .select('id,title,slug,summary,category_id,study_categories(name)')
        .eq('published', true)
        .order('sort_order')
        .order('title'),
      categoryIds.length
        ? contentClient.from('study_categories').select('id,name').in('id', categoryIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  // Modern Native JS Map correctly works now
  const topicMap = new Map((topicRows ?? []).map((topic) => [topic.id, topic as TopicRow]));
  const categoryMap = new Map((categoryRows ?? []).map((category) => [category.id, category.name]));

  const queryError =
    coursesError ?? enrollmentsError ?? categoryLinksError ?? linksError ?? topicsError ?? categoriesError;

  if (queryError) {
    return (
      <UserShell>
        <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/50 p-6 text-center shadow-2xs dark:border-rose-900/40 dark:bg-rose-950/20">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg border border-rose-300 bg-rose-100 text-rose-600 dark:border-rose-800 dark:bg-rose-900/40 dark:text-rose-400">
            <AlertCircle size={18} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Roadmap Unavailable</h2>
          <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">{queryError.message}</p>
          <a
            href="/dashboard/roadmap"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            <RefreshCw size={12} />
            <span>Try Again</span>
          </a>
        </div>
      </UserShell>
    );
  }

  const resolvedTopicIds = (topicRows ?? []).map((topic) => topic.id);
  const { data: progressRows } = resolvedTopicIds.length
    ? await supabase
        .from('topic_progress')
        .select('topic_id,progress')
        .eq('user_id', user.id)
        .in('topic_id', resolvedTopicIds)
    : { data: [] };

  const progress = new Map((progressRows ?? []).map((item) => [item.topic_id, item.progress ?? 0]));
  const enrolledIds = new Set((enrollments ?? []).map((item) => item.course_id));

  function getCategoryName(categoryRelation: StudyCategoryRelation): string | null {
    if (!categoryRelation) return null;
    if (Array.isArray(categoryRelation)) {
      return categoryRelation[0]?.name ?? null;
    }
    return categoryRelation.name ?? null;
  }

  function buildTopics(courseId: string) {
    const directLinks = (links ?? []).filter((link) => link.course_id === courseId);
    const courseCategoryIds = (categoryLinks ?? [])
      .filter((link) => link.course_id === courseId)
      .map((link) => link.category_id);

    const sourceTopics = directLinks.length
      ? directLinks.map((link) => topicMap.get(link.topic_id)).filter(Boolean)
      : (topicRows ?? []).filter((topic) => courseCategoryIds.includes(topic.category_id ?? ''));

    return sourceTopics
      .map((topic) => {
        if (!topic) return null;

        const categoryName =
          getCategoryName(topic.study_categories ?? null) ??
          categoryMap.get(topic.category_id ?? '') ??
          'General';

        return {
          id: topic.id,
          title: topic.title,
          slug: topic.slug,
          summary: topic.summary,
          categoryName,
          progress: progress.get(topic.id) ?? 0,
        };
      })
      .filter((topic): topic is NonNullable<typeof topic> => Boolean(topic));
  }

  const allRoadmaps = (courses ?? [])
    .map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description ?? '',
      content: course.content ?? '',
      topics: buildTopics(course.id),
    }))
    .filter((course) => course.topics.length > 0);

  const myRoadmaps = allRoadmaps.filter((course) => enrolledIds.has(course.id));
  const totalTopics = new Set([
    ...myRoadmaps.flatMap((course) => course.topics.map((topic) => topic.id)),
  ]).size;
  const completedTopics = myRoadmaps
    .flatMap((course) => course.topics)
    .filter((topic) => topic.progress === 100).length;

  return (
    <UserShell>
      <div className="mx-auto max-w-7xl space-y-3 text-slate-900 dark:text-slate-100">
        {/* Compact Header */}
        <div className="border-b border-slate-200/80 pb-2 dark:border-slate-800/80">
          <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Learning Roadmap
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Track your milestone progression and continue your enrolled learning paths.
          </p>
        </div>

        {/* Compact KPI Metrics Cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {/* Card 1: Active Roadmaps */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
              <MapIcon size={16} />
            </span>
            <div>
              <div className="text-sm font-bold leading-none text-slate-900 dark:text-white">
                {myRoadmaps.length}
              </div>
              <div className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Roadmaps in progress
              </div>
            </div>
          </div>

          {/* Card 2: Completed Topics */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 size={16} />
            </span>
            <div>
              <div className="text-sm font-bold leading-none text-slate-900 dark:text-white">
                {completedTopics} <span className="text-xs font-normal text-slate-400">/ {totalTopics}</span>
              </div>
              <div className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Topics completed
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap View Section */}
        <div className="space-y-2 pt-1">
          {myRoadmaps.length ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 dark:border-slate-800/60">
                <div>
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white">Your Roadmaps</h2>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Continue learning from where you left off.</p>
                </div>
              </div>
              <RoadmapView courses={myRoadmaps} />
            </>
          ) : (
            /* Compact Empty State Box */
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white py-8 px-4 text-center shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500">
                <BookOpen size={18} />
              </span>
              <strong className="text-xs font-bold text-slate-900 dark:text-white">No roadmap started yet</strong>
              <p className="mt-0.5 max-w-xs text-[11px] text-slate-500 dark:text-slate-400">
                Choose a course first to start your custom path.
              </p>
              <a
                href="/dashboard/courses"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-indigo-500"
              >
                <span>Browse Courses</span>
                <ChevronRight size={12} />
              </a>
            </div>
          )}
        </div>
      </div>
    </UserShell>
  );
}