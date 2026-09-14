import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, LockKeyhole, ShieldCheck, Clock, BookOpen, ChevronRight } from 'lucide-react';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { EnrollButton } from '@/app/public/_components/enroll-button';
import { CourseSyllabus } from '@/app/public/_components/course-syllabus';

type Topic = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  estimated_minutes: number;
  category_id: string | null;
  study_categories?: { name: string } | { name: string }[] | null;
};

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: course } = await supabase
    .from('courses')
    .select('id,title,slug,description,access_type,price,unlock_days,required_progress,passing_score,certificate_enabled,published')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (!course) notFound();

  const { data: links } = await supabase
    .from('course_topics')
    .select('sort_order,study_topics(id,title,slug,summary,estimated_minutes,category_id,study_categories(name))')
    .eq('course_id', course.id)
    .order('sort_order');

  const topics = (links ?? []).map((link) => (Array.isArray(link.study_topics) ? link.study_topics[0] : link.study_topics) as Topic).filter(Boolean);

  const topicGroups = Object.values(
    topics.reduce<Record<string, { name: string; topics: Topic[] }>>((groups, topic) => {
      const category = Array.isArray(topic.study_categories) ? topic.study_categories[0] : topic.study_categories;
      const key = topic.category_id ?? 'uncategorized';
      groups[key] ??= { name: category?.name ?? 'Other topics', topics: [] };
      groups[key].topics.push(topic);
      return groups;
    }, {})
  ).map((group) => ({
    name: group.name,
    topics: group.topics.map(({ id, title, summary, estimated_minutes }) => ({ id, title, summary, estimated_minutes })),
  }));

  const totalMinutes = topics.reduce((total, topic) => total + (topic.estimated_minutes || 0), 0);
  const { data: { user } } = await supabase.auth.getUser();

  const { data: enrollment } = user
    ? await supabase.from('enrollments').select('started_at').eq('user_id', user.id).eq('course_id', course.id).maybeSingle()
    : { data: null };

  const topicIds = topics.map((topic) => topic.id);
  const { data: progressRows } = user && topicIds.length
    ? await supabase.from('topic_progress').select('topic_id,progress').eq('user_id', user.id).in('topic_id', topicIds)
    : { data: [] };

  const progressPercent = topicIds.length
    ? Math.round(topicIds.reduce((sum, id) => sum + (progressRows?.find((row) => row.topic_id === id)?.progress ?? 0), 0) / topicIds.length)
    : 0;

  const unlockAt = enrollment ? new Date(new Date(enrollment.started_at).getTime() + course.unlock_days * 86400000) : null;
  const eligible = Boolean(enrollment && progressPercent >= course.required_progress && (!unlockAt || Date.now() >= unlockAt.getTime()));
  const { data: test } = user ? await supabase.from('tests').select('id,title').eq('course_id', course.id).eq('published', true).order('title').limit(1).maybeSingle() : { data: null };

  const courseTerms = [
    `Complete at least ${course.required_progress}% of the course to unlock the final assessment.`,
    `The final assessment unlocks after ${course.unlock_days} day(s) from enrollment.`,
    `Pass the final assessment with a score of ${course.passing_score}% or higher.`,
    course.certificate_enabled ? 'A certificate is issued after completing the course requirements.' : 'This course does not include a certificate.',
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0d1117] dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link href="/courses" className="hover:text-indigo-600 dark:hover:text-indigo-400">Courses</Link>
          <ChevronRight size={12} />
          <span className="text-slate-900 dark:text-white truncate">{course.title}</span>
        </nav>

        {/* Hero Banner Section */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-[#161b22]">
          <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between">
            
            {/* Left Content */}
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                {course.access_type === 'free' ? 'Free Course' : `Paid · ₹${course.price}`}
              </span>

              <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                {course.title}
              </h1>

              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {course.description}
              </p>

              {/* Meta Chips */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <BookOpen size={14} className="text-indigo-500" />
                  {topics.length} {topics.length === 1 ? 'Topic' : 'Topics'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Clock size={14} className="text-indigo-500" />
                  {Math.max(1, Math.ceil(totalMinutes / 60))} Hours Estimated
                </span>
                {course.certificate_enabled && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    Certificate Included
                  </span>
                )}
              </div>
            </div>

            {/* Right Action / Enrollment Card */}
            <div className="w-full max-w-sm shrink-0 rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/60">
              {enrollment ? (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Your Progress
                  </span>
                  <strong className="mt-1 block text-3xl font-black text-slate-900 dark:text-white">
                    {progressPercent}%
                  </strong>
                  
                  <div className="relative my-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                    />
                  </div>

                  {test ? (
                    eligible ? (
                      <Link
                        href={`/tests/${test.id}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-500 active:scale-95"
                      >
                        <CheckCircle2 size={14} /> Start Final Test
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50">
                        <LockKeyhole size={14} className="shrink-0" />
                        <span>
                          {progressPercent < course.required_progress
                            ? `Complete ${course.required_progress}% of the course.`
                            : `Final test unlocks on ${unlockAt?.toLocaleDateString() ?? 'soon'}.`}
                        </span>
                      </div>
                    )
                  ) : (
                    <div className="rounded-xl bg-slate-200/60 p-3 text-center text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      No final test is published yet.
                    </div>
                  )}
                </div>
              ) : course.access_type === 'paid' ? (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50">
                  <LockKeyhole size={14} className="shrink-0" />
                  <span>Paid enrollment requires checkout. Payment is not configured yet.</span>
                </div>
              ) : (
                <EnrollButton
                  courseId={course.id}
                  courseTitle={course.title}
                  terms={courseTerms}
                  redirectPath={`/dashboard/courses?course=${encodeURIComponent(course.slug)}`}
                />
              )}
            </div>
          </div>
        </section>

        {/* Syllabus Section */}
        <section className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#161b22] sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Course Syllabus
              </span>
              <h2 className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white">
                Topics by Category
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {topicGroups.length} {topicGroups.length === 1 ? 'Category' : 'Categories'}
            </span>
          </div>

          {topicGroups.length > 0 ? (
            <CourseSyllabus groups={topicGroups} />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-400">
              No topics are assigned to this course yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}