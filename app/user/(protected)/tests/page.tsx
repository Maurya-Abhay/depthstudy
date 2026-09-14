import Link from 'next/link';
import {
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Target,
  Award,
  AlertCircle,
} from 'lucide-react';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { UserShell } from '@/app/user/(protected)/_components/user-shell';

type CourseRelation = { title: string; slug: string } | Array<{ title: string; slug: string }> | null;
type TestRelation = { title: string } | Array<{ title: string }> | null;

export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: tests }, { data: attemptRows }] = await Promise.all([
    supabase
      .from('tests')
      .select('id,title,duration_minutes,passing_score,unlock_days,required_progress,published,course_id,courses(title,slug)')
      .eq('published', true)
      .order('title'),
    supabase
      .from('test_attempts')
      .select('id,test_id,score,passed,submitted_at,tests(title)')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(8),
  ]);

  const attempts = attemptRows ?? [];
  const passed = attempts.filter((attempt) => attempt.passed).length;
  const scored = attempts.filter((attempt) => typeof attempt.score === 'number');
  const average = scored.length
    ? Math.round(scored.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) / scored.length)
    : 0;

  return (
    <UserShell>
      <div className="mx-auto max-w-7xl space-y-3">
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white sm:text-lg">
              Assessments
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Practice with focused tests and track your attempt history.
            </p>
          </div>
          <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
            {tests?.length ?? 0} tests available
          </span>
        </div>

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] p-3 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[10px] font-medium">Available</span>
              <ClipboardCheck size={14} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="mt-1 font-mono text-base font-black text-slate-900 dark:text-white">{tests?.length ?? 0}</div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] p-3 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[10px] font-medium">Attempts</span>
              <Target size={14} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="mt-1 font-mono text-base font-black text-slate-900 dark:text-white">{attempts.length}</div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] p-3 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[10px] font-medium">Passed</span>
              <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-1 font-mono text-base font-black text-slate-900 dark:text-white">{passed}</div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] p-3 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[10px] font-medium">Avg Score</span>
              <Award size={14} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-1 font-mono text-base font-black text-slate-900 dark:text-white">{average}%</div>
          </div>
        </div>

        {/* Content Section: Tests & Attempts */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          {/* Left Column: Assessment Library */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] p-3.5 shadow-sm lg:col-span-7">
            <div className="mb-2.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Assessment Library
              </span>
            </div>

            {tests?.length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[350px] overflow-y-auto pr-1">
                {tests.map((test) => {
                  const courseRelation = test.courses as CourseRelation;
                  const course = Array.isArray(courseRelation) ? courseRelation[0] : courseRelation;

                  return (
                    <Link
                      key={test.id}
                      href={`/tests/${test.id}`}
                      className="group flex items-center justify-between gap-2.5 rounded-lg px-2 py-2.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 group-hover:border-indigo-500/40 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          <ClipboardCheck size={13} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <strong className="block truncate text-xs font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {test.title}
                          </strong>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="truncate">{course?.title || 'Assessment'}</span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400">{test.passing_score}% pass</span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-0.5">
                              <Clock3 size={10} />
                              {test.duration_minutes}m
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                        <span>Start</span>
                        <ChevronRight size={13} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">No published tests yet</div>
            )}
          </section>

          {/* Right Column: Recent Activity */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] p-3.5 shadow-sm lg:col-span-5">
            <div className="mb-2.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Recent Attempts
              </span>
            </div>

            {attempts.length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[350px] overflow-y-auto pr-1">
                {attempts.map((attempt) => {
                  const testRelation = attempt.tests as TestRelation;
                  const test = Array.isArray(testRelation) ? testRelation[0] : testRelation;

                  return (
                    <div key={attempt.id} className="flex items-center justify-between gap-2 py-2 px-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                            attempt.passed
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {attempt.passed ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                        </span>

                        <div className="min-w-0">
                          <strong className="block truncate text-[11px] font-semibold text-slate-800 dark:text-white">
                            {test?.title || 'Assessment attempt'}
                          </strong>
                          <span className="text-[9px] text-slate-400">
                            {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : 'In progress'}
                          </span>
                        </div>
                      </div>

                      <b className={`text-xs font-black ${attempt.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                        {attempt.score ?? 0}%
                      </b>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">No attempts yet</div>
            )}
          </section>
        </div>
      </div>
    </UserShell>
  );
}