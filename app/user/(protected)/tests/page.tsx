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
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
              Assessments
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Practice with focused tests and track your attempt history.
            </p>
          </div>
          <div className="self-start sm:self-auto rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
            {tests?.length ?? 0} tests available
          </div>
        </div>

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#121824] p-3.5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-medium uppercase tracking-wide">Available</span>
              <ClipboardCheck size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="mt-2 font-mono text-xl font-extrabold text-slate-900 dark:text-white">{tests?.length ?? 0}</div>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#121824] p-3.5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-medium uppercase tracking-wide">Attempts</span>
              <Target size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="mt-2 font-mono text-xl font-extrabold text-slate-900 dark:text-white">{attempts.length}</div>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#121824] p-3.5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-medium uppercase tracking-wide">Passed</span>
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 font-mono text-xl font-extrabold text-slate-900 dark:text-white">{passed}</div>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#121824] p-3.5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-medium uppercase tracking-wide">Avg Score</span>
              <Award size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-2 font-mono text-xl font-extrabold text-slate-900 dark:text-white">{average}%</div>
          </div>
        </div>

        {/* Content Section: Tests & Attempts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left Column: Assessment Library */}
          <section className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#121824] p-4 shadow-xs lg:col-span-7 flex flex-col">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Assessment Library
              </h2>
            </div>

            {tests?.length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[380px] overflow-y-auto pr-1">
                {tests.map((test) => {
                  const courseRelation = test.courses as CourseRelation;
                  const course = Array.isArray(courseRelation) ? courseRelation[0] : courseRelation;

                  return (
                    <Link
                      key={test.id}
                      href={`/tests/${test.id}`}
                      className="group flex items-center justify-between gap-3 rounded-lg px-2.5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:border-indigo-500/40 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          <ClipboardCheck size={15} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {test.title}
                          </h3>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="truncate max-w-[140px]">{course?.title || 'General Assessment'}</span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{test.passing_score}% pass</span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock3 size={11} />
                              {test.duration_minutes}m
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
                        <span>Start</span>
                        <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">No published tests available yet</div>
            )}
          </section>

          {/* Right Column: Recent Activity */}
          <section className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#121824] p-4 shadow-xs lg:col-span-5 flex flex-col">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Recent Attempts
              </h2>
            </div>

            {attempts.length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[380px] overflow-y-auto pr-1">
                {attempts.map((attempt) => {
                  const testRelation = attempt.tests as TestRelation;
                  const test = Array.isArray(testRelation) ? testRelation[0] : testRelation;

                  return (
                    <div key={attempt.id} className="flex items-center justify-between gap-3 py-2.5 px-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                            attempt.passed
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {attempt.passed ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                            {test?.title || 'Assessment attempt'}
                          </h3>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : 'In progress'}
                          </p>
                        </div>
                      </div>

                      <div className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${attempt.passed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {attempt.score ?? 0}%
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">No attempts recorded yet</div>
            )}
          </section>
        </div>
      </div>
    </UserShell>
  );
}