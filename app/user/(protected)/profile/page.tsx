import Link from 'next/link';
import {
  Award,
  BookOpen,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Code2,
  FileText,
  Layers3,
  Mail,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { UserShell } from '@/app/user/(protected)/_components/user-shell';
import { ProfileEdit } from '@/app/user/(protected)/_components/profile-edit';
import { requireLearner } from '@/services/auth';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import QRCode from 'qrcode';

type TopicRelation =
  | { title: string; slug: string }
  | Array<{ title: string; slug: string }>
  | null;
type ProblemRelation =
  | { title: string; slug: string }
  | Array<{ title: string; slug: string }>
  | null;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function formatDate(value: string | null | undefined) {
  return value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Not available';
}

export async function ProfilePage() {
  const user = await requireLearner();
  const supabase = createAdminSupabaseClient();

  const profileResult = await supabase
    .from('profiles')
    .select('name,role,created_at')
    .eq('id', user.id)
    .maybeSingle();

  const [
    progressResult,
    enrollmentsResult,
    submissionsResult,
    attemptsResult,
    certificatesResult,
    notesResult,
    bookmarksResult,
  ] = await Promise.all([
    supabase
      .from('topic_progress')
      .select(
        'progress,status,completed_at,last_studied_at,topic_id,study_topics(title,slug)'
      )
      .eq('user_id', user.id)
      .order('last_studied_at', { ascending: false }),
    supabase
      .from('enrollments')
      .select('id,started_at,completed_at,courses(title,slug)')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false }),
    supabase
      .from('dsa_submissions')
      .select(
        'id,status,problem_id,created_at,language,dsa_problems(title,slug)'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('test_attempts')
      .select('id,score,passed,submitted_at,tests(title)')
      .eq('user_id', user.id)
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: false }),
    supabase
      .from('certificates')
      .select('id,score,issued_at,courses(title,slug)')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false }),
    supabase
      .from('personal_notes')
      .select('id,updated_at,study_topics(title,slug)')
      .eq('user_id', user.id),
    supabase
      .from('bookmarks')
      .select('topic_id')
      .eq('user_id', user.id),
  ]);

  const profile = profileResult.data;
  const role: string = profile?.role || 'user';
  const progress = progressResult.data ?? [];
  const enrollments = enrollmentsResult.data ?? [];
  const submissions = submissionsResult.data ?? [];
  const attempts = attemptsResult.data ?? [];
  const certificates = certificatesResult.data ?? [];

  const topicsCompleted = progress.filter(
    (item) => (item.progress ?? 0) >= 100
  ).length;
  const topicsInProgress = progress.filter(
    (item) => (item.progress ?? 0) > 0 && (item.progress ?? 0) < 100
  ).length;
  const averageProgress = progress.length
    ? Math.round(
        progress.reduce((sum, item) => sum + clamp(item.progress ?? 0), 0) /
          progress.length
      )
    : 0;

  const solvedIds = new Set(
    submissions
      .filter((item) => item.status === 'accepted')
      .map((item) => item.problem_id)
  );
  const passedTests = attempts.filter((item) => item.passed).length;
  const learningPoints = topicsCompleted * 2 + solvedIds.size + passedTests;
  const level = Math.max(1, Math.min(20, 1 + Math.floor(learningPoints / 5)));
  const levelProgress = Math.round(((learningPoints % 5) / 5) * 100);

  const displayName = profile?.name || user.email?.split('@')[0] || 'Learner';
  const initials = displayName
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const recentProgress = progress
    .filter((item) => item.last_studied_at)
    .slice(0, 4);
  const recentDsa = submissions.slice(0, 3);
  const notesCount = notesResult.data?.length ?? 0;
  const bookmarksCount = bookmarksResult.data?.length ?? 0;
  const profileId = user.id.slice(0, 8).toUpperCase();

  const qrDataUrl = await QRCode.toDataURL(`depthstudy://profile/${user.id}`, {
    width: 100,
    margin: 1,
    errorCorrectionLevel: 'M',
  });

  return (
    <UserShell>
      <div className="mx-auto max-w-7xl space-y-3 text-slate-900 dark:text-slate-100">
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 dark:border-slate-800/80">
          <ProfileEdit currentName={displayName} />
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <CircleUserRound size={13} />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Profile Hero Card */}
        <section className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-12 lg:items-center">
          {/* Identity Info */}
          <div className="flex items-center gap-3 lg:col-span-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg font-black text-white shadow-xs">
              {initials || 'L'}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                  {displayName}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={11} /> Active learner
                </span>
              </div>
              <p className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <Mail size={12} /> {user.email}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <CalendarDays size={11} /> Joined {formatDate(profile?.created_at)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck size={11} /> {role === 'admin' ? 'Admin' : 'Student'} account
                </span>
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-800/40 lg:col-span-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Current Level
              </span>
              <strong className="text-xs text-indigo-600 dark:text-indigo-400">
                Level {level}
              </strong>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-500"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <small className="mt-1 block text-[10px] text-slate-500 dark:text-slate-400">
              {5 - Math.floor(learningPoints % 5)} points to next level
            </small>
          </div>

          {/* QR Code Identification */}
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-800/40 lg:col-span-3">
            <div className="shrink-0 overflow-hidden rounded-md bg-white p-0.5 border border-slate-200 dark:border-slate-700">
              <img src={qrDataUrl} alt="Profile QR code" className="h-12 w-12" />
            </div>
            <div className="min-w-0">
              <strong className="block text-[11px] font-bold text-slate-900 dark:text-white">
                Depth Study ID
              </strong>
              <small className="block text-[10px] text-slate-500 dark:text-slate-400">
                Scan for identification
              </small>
              <code className="mt-0.5 block rounded bg-slate-200/60 px-1 py-0.5 text-center text-[10px] font-mono font-bold text-indigo-600 dark:bg-slate-800 dark:text-indigo-400">
                {profileId}
              </code>
            </div>
          </div>
        </section>

        {/* Learning Statistics Metrics Grid */}
        <section
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
          aria-label="Learning statistics"
        >
          <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BookOpen size={14} />
            </div>
            <strong className="text-base font-bold text-slate-900 dark:text-white">
              {topicsCompleted}
            </strong>
            <small className="block text-[10px] text-slate-500 dark:text-slate-400">
              Topics completed
            </small>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Code2 size={14} />
            </div>
            <strong className="text-base font-bold text-slate-900 dark:text-white">
              {solvedIds.size}
            </strong>
            <small className="block text-[10px] text-slate-500 dark:text-slate-400">
              DSA solved
            </small>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Target size={14} />
            </div>
            <strong className="text-base font-bold text-slate-900 dark:text-white">
              {averageProgress}%
            </strong>
            <small className="block text-[10px] text-slate-500 dark:text-slate-400">
              Avg. progress
            </small>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Trophy size={14} />
            </div>
            <strong className="text-base font-bold text-slate-900 dark:text-white">
              {passedTests}
            </strong>
            <small className="block text-[10px] text-slate-500 dark:text-slate-400">
              Tests passed
            </small>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
              <Award size={14} />
            </div>
            <strong className="text-base font-bold text-slate-900 dark:text-white">
              {certificates.length}
            </strong>
            <small className="block text-[10px] text-slate-500 dark:text-slate-400">
              Certificates
            </small>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Layers3 size={14} />
            </div>
            <strong className="text-base font-bold text-slate-900 dark:text-white">
              {enrollments.length}
            </strong>
            <small className="block text-[10px] text-slate-500 dark:text-slate-400">
              Courses joined
            </small>
          </div>
        </section>

        {/* Middle Section: Progress & Milestones */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          {/* Progress Section */}
          <section className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-7">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200/80 pb-2 dark:border-slate-800/80">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Learning Pulse
                </span>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                  Your Progress
                </h2>
              </div>
              <span className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                {averageProgress}% overall
              </span>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40 sm:flex-row">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-indigo-600 bg-white text-xs font-black text-indigo-600 dark:border-indigo-500 dark:bg-slate-900 dark:text-indigo-400">
                {averageProgress}%
              </div>
              <div className="min-w-0 flex-1 space-y-1 text-center sm:text-left">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Keep your momentum
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {topicsInProgress
                    ? `${topicsInProgress} topic${topicsInProgress === 1 ? '' : 's'} currently in progress.`
                    : 'Start a topic to begin building your learning streak.'}
                </p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-500"
                    style={{ width: `${averageProgress}%` }}
                  />
                </div>
                <small className="block text-[10px] text-slate-400">
                  {topicsCompleted} complete · {topicsInProgress} active ·{' '}
                  {progress.length} tracked
                </small>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5 dark:border-slate-800/80">
                <strong className="text-xs font-bold text-slate-900 dark:text-white">
                  Recent Activity
                </strong>
                <Link
                  href="/dashboard/progress"
                  className="flex items-center gap-0.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  View all <ChevronRight size={12} />
                </Link>
              </div>

              {recentProgress.length ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {recentProgress.map((item) => {
                    const topicRelation = item.study_topics as TopicRelation;
                    const topic = Array.isArray(topicRelation)
                      ? topicRelation[0]
                      : topicRelation;
                    const value = clamp(item.progress ?? 0);

                    return (
                      <Link
                        key={item.topic_id}
                        href={
                          topic?.slug
                            ? `/study/topic/${topic.slug}`
                            : '/dashboard/progress'
                        }
                        className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-xs transition hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                            <BookOpen size={12} />
                          </span>
                          <div className="min-w-0">
                            <strong className="block truncate text-[11px] font-semibold text-slate-900 dark:text-white">
                              {topic?.title || 'Study topic'}
                            </strong>
                            <small className="text-[10px] text-slate-400">
                              {formatDate(item.last_studied_at)}
                            </small>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <b className="text-[11px] text-indigo-600 dark:text-indigo-400">
                            {value}%
                          </b>
                          <ChevronRight size={12} className="text-slate-400" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="py-4 text-center text-[11px] text-slate-400">
                  Your study activity will appear here.
                </p>
              )}
            </div>
          </section>

          {/* Achievements Section */}
          <section className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200/80 pb-2 dark:border-slate-800/80">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Milestones
                </span>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                  Achievements
                </h2>
              </div>
              <Sparkles size={15} className="text-indigo-500" />
            </div>

            <div className="space-y-1.5">
              {/* Achievement 1 */}
              <div
                className={`flex items-center gap-2.5 rounded-lg border p-2 text-xs ${
                  topicsCompleted >= 1
                    ? 'border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-950/20'
                    : 'border-slate-200/80 bg-slate-50/50 opacity-60 dark:border-slate-800 dark:bg-slate-800/20'
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <BookOpen size={13} />
                </span>
                <div>
                  <strong className="block text-[11px] font-bold text-slate-900 dark:text-white">
                    First Topic
                  </strong>
                  <small className="text-[10px] text-slate-500 dark:text-slate-400">
                    {topicsCompleted >= 1
                      ? 'Started your learning journey'
                      : 'Complete your first topic'}
                  </small>
                </div>
              </div>

              {/* Achievement 2 */}
              <div
                className={`flex items-center gap-2.5 rounded-lg border p-2 text-xs ${
                  solvedIds.size >= 1
                    ? 'border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-950/20'
                    : 'border-slate-200/80 bg-slate-50/50 opacity-60 dark:border-slate-800 dark:bg-slate-800/20'
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Code2 size={13} />
                </span>
                <div>
                  <strong className="block text-[11px] font-bold text-slate-900 dark:text-white">
                    Problem Solver
                  </strong>
                  <small className="text-[10px] text-slate-500 dark:text-slate-400">
                    {solvedIds.size >= 1
                      ? 'First DSA problem solved'
                      : 'Solve your first DSA problem'}
                  </small>
                </div>
              </div>

              {/* Achievement 3 */}
              <div
                className={`flex items-center gap-2.5 rounded-lg border p-2 text-xs ${
                  passedTests >= 1
                    ? 'border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-950/20'
                    : 'border-slate-200/80 bg-slate-50/50 opacity-60 dark:border-slate-800 dark:bg-slate-800/20'
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Trophy size={13} />
                </span>
                <div>
                  <strong className="block text-[11px] font-bold text-slate-900 dark:text-white">
                    Test Ready
                  </strong>
                  <small className="text-[10px] text-slate-500 dark:text-slate-400">
                    {passedTests >= 1
                      ? 'Passed an assessment'
                      : 'Pass your first assessment'}
                  </small>
                </div>
              </div>

              {/* Achievement 4 */}
              <div
                className={`flex items-center gap-2.5 rounded-lg border p-2 text-xs ${
                  certificates.length >= 1
                    ? 'border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-950/20'
                    : 'border-slate-200/80 bg-slate-50/50 opacity-60 dark:border-slate-800 dark:bg-slate-800/20'
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Award size={13} />
                </span>
                <div>
                  <strong className="block text-[11px] font-bold text-slate-900 dark:text-white">
                    Certified
                  </strong>
                  <small className="text-[10px] text-slate-500 dark:text-slate-400">
                    {certificates.length >= 1
                      ? 'Earned a certificate'
                      : 'Earn a course certificate'}
                  </small>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Grid: DSA Activity & Saved Library */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          {/* DSA Activity */}
          <section className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-7">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200/80 pb-2 dark:border-slate-800/80">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Practice History
                </span>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                  DSA Activity
                </h2>
              </div>
              <Link
                href="/dashboard/dsa"
                className="flex items-center gap-0.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                Open DSA <ChevronRight size={12} />
              </Link>
            </div>

            {recentDsa.length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentDsa.map((item) => {
                  const problemRelation = item.dsa_problems as ProblemRelation;
                  const problem = Array.isArray(problemRelation)
                    ? problemRelation[0]
                    : problemRelation;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 px-1 py-1.5 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                            item.status === 'accepted'
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <Code2 size={12} />
                        </span>
                        <div className="min-w-0">
                          <strong className="block truncate text-[11px] font-semibold text-slate-900 dark:text-white">
                            {problem?.title || 'DSA problem'}
                          </strong>
                          <small className="text-[10px] text-slate-400">
                            {item.language?.toUpperCase() || 'JAVA'} •{' '}
                            {formatDate(item.created_at)}
                          </small>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold capitalize ${
                          item.status === 'accepted'
                            ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'border border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-4 text-center text-[11px] text-slate-400">
                No DSA submissions yet. Your solved problems will show here.
              </p>
            )}
          </section>

          {/* Saved Library */}
          <section className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
            <div>
              <div className="mb-3 border-b border-slate-200/80 pb-2 dark:border-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Your Library
                </span>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                  Saved Learning
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-800/40">
                  <Bookmark size={14} className="mx-auto mb-0.5 text-indigo-500" />
                  <strong className="block text-sm font-bold text-slate-900 dark:text-white">
                    {bookmarksCount}
                  </strong>
                  <small className="text-[10px] text-slate-500 dark:text-slate-400">
                    Bookmarks
                  </small>
                </div>

                <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-800/40">
                  <FileText size={14} className="mx-auto mb-0.5 text-emerald-500" />
                  <strong className="block text-sm font-bold text-slate-900 dark:text-white">
                    {notesCount}
                  </strong>
                  <small className="text-[10px] text-slate-500 dark:text-slate-400">
                    Notes written
                  </small>
                </div>

                <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-800/40">
                  <Award size={14} className="mx-auto mb-0.5 text-amber-500" />
                  <strong className="block text-sm font-bold text-slate-900 dark:text-white">
                    {certificates.length}
                  </strong>
                  <small className="text-[10px] text-slate-500 dark:text-slate-400">
                    Certificates
                  </small>
                </div>
              </div>
            </div>

            <Link
              href="/dashboard/notes"
              className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <span>Open your notes</span>
              <ChevronRight size={13} />
            </Link>
          </section>
        </div>
      </div>
    </UserShell>
  );
}

export default function ProfilePageRoute() {
  return <ProfilePage />;
}