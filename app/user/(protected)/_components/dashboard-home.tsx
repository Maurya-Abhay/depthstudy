import Link from 'next/link';
import {
  Award,
  BarChart3,
  Check,
  ChevronRight,
  Flame,
  PlayCircle,
  Sparkles,
  Target,
  AlertTriangle,
} from 'lucide-react';
import { getDashboardData } from '@/services/dashboard';
import {
  btnPrimary,
  btnSecondary,
  btnSecondarySmall,
  card,
  chip,
  chipActive,
  eyebrow,
  listRow,
  muted,
  surface,
} from '@/components/ui/tokens';

export async function DashboardHome() {
  const data = await getDashboardData();

  if (!data || 'error' in data) {
    return (
      <div className={`${surface} p-6 text-center max-w-sm mx-auto my-10 rounded-2xl`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 mx-auto mb-3">
          <AlertTriangle size={18} />
        </div>
        <strong className="text-sm font-bold text-slate-900 dark:text-white block">
          Dashboard unavailable
        </strong>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          {data?.error || 'Unable to load your dashboard workspace.'}
        </p>
        <Link href="/dashboard" className={btnSecondarySmall}>
          Try again
        </Link>
      </div>
    );
  }

  const activeTopics = data.activeTopics ?? [];
  const courses = data.courses ?? [];
  const tests = data.tests ?? [];

  const current = activeTopics[0];
  const courseCards = courses.slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Hero Section */}
      <section className={`${surface} relative overflow-hidden p-5 sm:p-6 bg-gradient-to-r from-indigo-50/50 via-slate-50 to-indigo-50/50 dark:from-[#121824] dark:via-[#161e2e] dark:to-[#121824] rounded-2xl`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="max-w-xl">
            <div className={eyebrow}>
              <Sparkles size={12} className="inline mr-1 -mt-0.5 text-indigo-500" /> Learning Workspace
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back, {data.name}
            </h1>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-normal">
              Track your progress, next lesson, and study rhythm.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <Link
                href={
                  current?.topic?.slug
                    ? `/study/topic/${current.topic.slug}`
                    : '/study'
                }
                className={btnPrimary}
              >
                {current ? 'Resume learning' : 'Explore library'} <ChevronRight size={14} />
              </Link>
              <Link href="/dsa" className={btnSecondary}>
                Practice DSA
              </Link>
            </div>
          </div>

          {/* Hero Orbit Badge */}
          <div className="relative flex items-center justify-center shrink-0 self-center sm:self-auto mt-2 sm:mt-0">
            <div className="absolute -inset-1.5 rounded-full bg-indigo-500/20 blur-md animate-pulse" />
            <div className="relative flex h-20 w-20 flex-col items-center justify-center rounded-full border border-indigo-500/30 bg-white/90 dark:bg-[#121824]/90 p-2 shadow-lg text-center backdrop-blur-sm">
              <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
                {data.averageProgress}%
              </span>
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-0.5">
                Overall
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {[
          { label: 'Day streak', val: data.streakDays, icon: Flame, color: 'amber' },
          { label: 'Enrolled', val: courses.length, icon: Target, color: 'indigo' },
          { label: 'Topics done', val: data.completedTopics, icon: Check, color: 'emerald' },
          { label: 'DSA solved', val: data.solved, icon: PlayCircle, color: 'purple' },
          { label: 'Avg progress', val: `${data.averageProgress}%`, icon: BarChart3, color: 'cyan', span: 'col-span-2 sm:col-span-1' },
        ].map((kpi, idx) => (
          <div key={idx} className={`${surface} p-3 flex items-center gap-3 ${kpi.span || ''}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-${kpi.color}-500/10 text-${kpi.color}-600 dark:text-${kpi.color}-400 border border-${kpi.color}-500/20`}>
              <kpi.icon size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-base font-black text-slate-900 dark:text-white leading-none truncate">
                {kpi.val}
              </div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {kpi.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Courses Grid */}
      <section className={`${card} p-4`}>
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className={eyebrow}>My courses</div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">Active Paths</h2>
          </div>
          <Link href="/dashboard/courses" className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            Browse all
          </Link>
        </div>

        {courseCards.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {courseCards.map((item) => {
              const c = Array.isArray(item.courses) ? item.courses[0] : item.courses;
              return (
                <Link
                  href={c?.slug ? `/dashboard/courses?course=${encodeURIComponent(c.slug)}` : '/dashboard/courses'}
                  key={item.id}
                  className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40 p-2.5 transition-all duration-150 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/60 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      <Target size={13} />
                    </span>
                    <div className="min-w-0">
                      <strong className="block text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {c?.title || 'Course'}
                      </strong>
                      <small className="text-[10px] text-slate-500 block truncate mt-0.5">
                        Started {new Date(item.started_at).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white shrink-0 transition-colors" />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/30">
            Enroll in a course to build a guided learning path.
          </div>
        )}
      </section>

      {/* Lower Grid: Assessment History & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Tests */}
        <section className={`${card} p-4`}>
          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className={eyebrow}>Assessment History</div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">Recent Tests</h2>
            </div>
            <Link href="/dashboard/tests" className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              All tests
            </Link>
          </div>

          {tests.length ? (
            <div className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {tests.slice(0, 4).map((item) => {
                const test = Array.isArray(item.tests) ? item.tests[0] : item.tests;
                return (
                  <div className={`${listRow} py-2`} key={item.id}>
                    <div className="min-w-0">
                      <strong className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                        {test?.title || 'Assessment'}
                      </strong>
                      <div className={`${muted} text-[10px] mt-0.5`}>
                        {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : 'In progress'}
                      </div>
                    </div>
                    <span className={`${chip} ${item.passed ? chipActive : ''} text-[10px] px-2 py-0.5`}>
                      {item.score ?? 0}% · {item.passed ? 'Passed' : 'Review'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/30">
              <strong className="text-xs text-slate-900 dark:text-white block">No attempts yet</strong>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 mb-2">
                Scores appear here after an assessment.
              </p>
              <Link className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400" href="/dashboard/tests">
                Browse tests
              </Link>
            </div>
          )}
        </section>

        {/* Milestones & Achievements */}
        <section className={`${card} p-4`}>
          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className={eyebrow}>Achievements</div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">Milestones</h2>
            </div>
            <Link href="/dashboard/certificates" className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Certificates
            </Link>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Award size={16} />
              </span>
              <div>
                <strong className="text-xs font-bold text-slate-900 dark:text-white block">
                  {data.certificates} certificates
                </strong>
                <small className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Issued after eligible course completion.
                </small>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Sparkles size={16} />
              </span>
              <div>
                <strong className="text-xs font-bold text-slate-900 dark:text-white block">
                  {data.bookmarks} saved topics
                </strong>
                <small className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Keep useful lessons one click away.
                </small>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}