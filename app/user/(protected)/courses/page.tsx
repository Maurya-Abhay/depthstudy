import Link from 'next/link';
import { BookOpen, CheckCircle2, LockKeyhole, ShieldCheck, ArrowLeft, GraduationCap, Sparkles } from 'lucide-react';
import { UserShell } from '@/app/user/(protected)/_components/user-shell';
import { CourseTopicExplorer } from '@/app/user/(protected)/_components/course-topic-explorer';
import { EnrollButton } from '@/app/user/(protected)/_components/enroll-button';
import { createServerSupabaseClient } from '@/services/supabase-server';

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string | null;
  access_type: string;
  price: number;
  unlock_days: number;
  required_progress: number;
  passing_score: number;
  certificate_enabled: boolean;
};

type Topic = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category_id: string | null;
  study_categories?: { name: string } | Array<{ name: string }> | null;
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course: selectedSlug } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: courses }, { data: enrollments }] = await Promise.all([
    supabase.from('courses').select('id,title,slug,description,content,access_type,price,unlock_days,required_progress,passing_score,certificate_enabled').eq('published', true).order('title'),
    supabase.from('enrollments').select('course_id').eq('user_id', user.id),
  ]);

  const enrolledIds = new Set((enrollments ?? []).map((i) => i.course_id));
  const selectedCourse = (courses ?? []).find((c) => c.slug === selectedSlug);

  const { data: links } = selectedCourse
    ? await supabase.from('course_topics').select('course_id,sort_order,study_topics(id,title,slug,summary,category_id,study_categories(name))').eq('course_id', selectedCourse.id).order('sort_order')
    : { data: [] };

  const topics = (links ?? []).map((l) => (Array.isArray(l.study_topics) ? l.study_topics[0] : l.study_topics) as Topic).filter(Boolean);

  const { data: progressRows } = selectedCourse && topics.length
    ? await supabase.from('topic_progress').select('topic_id,progress').eq('user_id', user.id).in('topic_id', topics.map((t) => t.id))
    : { data: [] };

  const progress = new Map((progressRows ?? []).map((i) => [i.topic_id, i.progress ?? 0]));

  const explorerTopics = topics.map((t) => {
    const cat = Array.isArray(t.study_categories) ? t.study_categories[0] : t.study_categories;
    return { id: t.id, title: t.title, slug: t.slug, summary: t.summary, categoryName: cat?.name ?? 'General', progress: progress.get(t.id) ?? 0 };
  });

  const isEnrolled = selectedCourse ? enrolledIds.has(selectedCourse.id) : false;
  const courseTerms = (c: Course) => [
    `Complete at least ${c.required_progress}% to unlock assessment.`,
    `Assessment unlocks after ${c.unlock_days} day(s).`,
    `Pass assessment with ${c.passing_score}% or higher.`,
    c.certificate_enabled ? 'Certificate included.' : 'No certificate included.',
  ];

  return (
    <UserShell>
      {selectedCourse ? (
        /* ================= COURSE DETAIL VIEW ================= */
        <div className="space-y-4">
          <Link href="/dashboard/courses" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">
            <ArrowLeft size={13} /> Back to all courses
          </Link>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] p-5 shadow-sm dark:shadow-xl space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${isEnrolled ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {isEnrolled ? 'Enrolled' : 'Not enrolled'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    <ShieldCheck size={11} /> {topics.length} topics
                  </span>
                  {selectedCourse.certificate_enabled && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                      <GraduationCap size={11} /> Certificate
                    </span>
                  )}
                </div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{selectedCourse.title}</h1>
                {selectedCourse.description && <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">{selectedCourse.description}</p>}
              </div>
              <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <BookOpen size={20} />
              </div>
            </div>

            <CourseTopicExplorer topics={explorerTopics} enrolled={isEnrolled} />

            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80 pt-3">
              <Link className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" href="/dashboard/courses">
                &larr; All Courses
              </Link>
              {!isEnrolled && selectedCourse.access_type !== 'paid' && (
                <EnrollButton courseId={selectedCourse.id} courseTitle={selectedCourse.title} terms={courseTerms(selectedCourse)} redirectPath={`/dashboard/courses?course=${encodeURIComponent(selectedCourse.slug)}`} />
              )}
            </div>
          </section>
        </div>
      ) : (
        /* ================= COURSES GRID VIEW ================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Courses</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              <Sparkles size={12} /> {courses?.length ?? 0} Available
            </span>
          </div>

          {courses?.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => {
                const enrolled = enrolledIds.has(c.id);
                return (
                  <article key={c.id} className="group flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121824] p-4 shadow-sm hover:shadow-md transition">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${c.access_type === 'paid' ? 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>
                            {c.access_type === 'paid' ? <><LockKeyhole size={10} /> INR {c.price ?? 0}</> : 'Open Access'}
                          </span>
                          {enrolled && (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 size={10} /> Enrolled
                            </span>
                          )}
                        </div>
                        <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">
                          {c.access_type === 'paid' ? 'PRO' : 'FREE'}
                        </span>
                      </div>

                      <h2 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{c.title}</h2>
                      <p className="line-clamp-2 text-xs text-slate-600 dark:text-slate-400">{c.description || 'Structured learning path.'}</p>
                    </div>

                    <div className="mt-4 border-t border-slate-200 dark:border-slate-800/80 pt-3">
                      {enrolled ? (
                        <Link className="flex w-full items-center justify-center rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition" href={`/dashboard/courses?course=${encodeURIComponent(c.slug)}`}>
                          Continue Learning
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Link className="flex-1 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition" href={`/dashboard/courses?course=${encodeURIComponent(c.slug)}`}>
                            View Topics
                          </Link>
                          {c.access_type !== 'paid' && (
                            <div className="flex-1">
                              <EnrollButton courseId={c.id} courseTitle={c.title} terms={courseTerms(c)} redirectPath={`/dashboard/courses?course=${encodeURIComponent(c.slug)}`} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-[#121824]/50 text-xs font-semibold text-slate-500">
              No published courses available yet.
            </div>
          )}
        </div>
      )}
    </UserShell>
  );
}