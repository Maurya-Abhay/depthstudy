import Link from 'next/link';
import { CircleCheck, Filter, AlertCircle } from 'lucide-react';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { getDsaProblems, getDsaTopics } from '@/services/dsa';
import { ProblemList } from '@/app/user/(protected)/_components/problem-list';

export default async function DsaHome({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; difficulty?: string }>;
}) {
  const params = await searchParams;
  const { problems: allProblems, error } = await getDsaProblems();
  const topics = await getDsaTopics();

  let solvedRows: Array<{ problem_id: string; status: string }> = [];

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    const supabase = await createServerSupabaseClient();
    const auth = await supabase.auth.getUser();
    const user = auth.data.user;

    if (user) {
      const { data } = await supabase
        .from('dsa_submissions')
        .select('problem_id, status')
        .eq('user_id', user.id)
        .eq('status', 'accepted');
      solvedRows = data ?? [];
    }
  }

  const solvedIds = Array.from(new Set(solvedRows.map((row) => row.problem_id)));

  const selectedTopic = params.topic ?? '';
  const difficulty = params.difficulty ?? '';

  const selectedTopicId =
    topics.find((topic) => topic.slug === selectedTopic)?.id ?? '';

  const problems = (allProblems ?? []).filter(
    (problem) =>
      (!selectedTopicId || problem.topicId === selectedTopicId) &&
      (!difficulty || problem.difficulty === difficulty)
  );

  // Single-pass computation for KPI metrics
  let easy = 0;
  let medium = 0;
  let hard = 0;
  const patternSet = new Set<string>();

  for (const p of problems) {
    if (p.difficulty === 'Easy') easy++;
    else if (p.difficulty === 'Medium') medium++;
    else if (p.difficulty === 'Hard') hard++;

    if (p.pattern) patternSet.add(p.pattern);
  }

  const patterns = patternSet.size;

  return (
    <main className="min-h-screen bg-transparent text-slate-800 dark:text-zinc-100">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Hero Header Section */}
        <div className="space-y-1">
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Solve. Review. Improve.
          </h1>
          <p className="max-w-xl text-xs leading-relaxed text-slate-500 dark:text-zinc-400 sm:text-sm">
            A separate problem-solving workspace for patterns, hints, approaches,
            Java solutions, and real-time code submissions.
          </p>
        </div>

        {/* Filter Bar Controls */}
        <div className="space-y-2.5">
          {/* Topics Filter */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
            <span className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-zinc-900/60 px-2.5 py-1.5 text-slate-600 dark:text-zinc-400">
              <Filter size={12} />
              <span>Topics:</span>
            </span>

            <Link
              href={difficulty ? `/dsa?difficulty=${encodeURIComponent(difficulty)}` : '/dsa'}
              className={`rounded-xl px-3 py-1.5 transition ${
                !selectedTopic
                  ? 'border border-indigo-500/30 bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </Link>

            {topics.map((topic) => {
              const isSelected = selectedTopic === topic.slug;
              const topicParams = new URLSearchParams();
              if (!isSelected) topicParams.set('topic', topic.slug);
              if (difficulty) topicParams.set('difficulty', difficulty);

              const href = topicParams.toString() ? `/dsa?${topicParams.toString()}` : '/dsa';

              return (
                <Link
                  key={topic.id}
                  href={href}
                  className={`rounded-xl px-3 py-1.5 transition ${
                    isSelected
                      ? 'border border-indigo-500/30 bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                      : 'border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {topic.name}
                </Link>
              );
            })}
          </div>

          {/* Difficulty Filter */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
            <span className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-zinc-900/60 px-2.5 py-1.5 text-slate-600 dark:text-zinc-400">
              <span>Difficulty:</span>
            </span>

            {['Easy', 'Medium', 'Hard'].map((level) => {
              const isActive = difficulty === level;
              const diffParams = new URLSearchParams();
              if (selectedTopic) diffParams.set('topic', selectedTopic);
              if (!isActive) diffParams.set('difficulty', level);

              const href = diffParams.toString() ? `/dsa?${diffParams.toString()}` : '/dsa';

              return (
                <Link
                  key={level}
                  href={href}
                  className={`rounded-xl px-3 py-1.5 transition ${
                    isActive
                      ? 'border border-indigo-500/30 bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                      : 'border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {level}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Dash KPI Grid Metrics */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Solved Count KPI */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-500/20 bg-white dark:bg-zinc-900/50 p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CircleCheck size={20} />
            </div>
            <div>
              <div className="font-mono text-xl font-black text-slate-900 dark:text-white">
                {solvedIds.length}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                Solved for your account
              </div>
            </div>
          </div>

          {/* Easy KPI */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 p-4 shadow-sm">
            <div className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">
              {easy}
            </div>
            <div className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              Easy available
            </div>
          </div>

          {/* Medium KPI */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 p-4 shadow-sm">
            <div className="font-mono text-xl font-black text-amber-600 dark:text-amber-400">
              {medium}
            </div>
            <div className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              Medium available
            </div>
          </div>

          {/* Hard KPI */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 p-4 shadow-sm">
            <div className="font-mono text-xl font-black text-rose-600 dark:text-rose-400">
              {hard}
            </div>
            <div className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              Hard available · <span className="text-indigo-600 dark:text-indigo-400">{patterns} patterns</span>
            </div>
          </div>
        </div>

        {/* Problems List or Error State */}
        {error ? (
          <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-4 text-xs font-medium text-rose-600 dark:text-rose-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>DSA problems are unavailable right now. {error}</span>
          </div>
        ) : (
          <div className="pt-1">
            <ProblemList problems={problems} solvedIds={solvedIds} />
          </div>
        )}
      </div>
    </main>
  );
}