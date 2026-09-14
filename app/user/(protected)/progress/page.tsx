import Link from 'next/link';
import {
  ChevronRight,
  CheckCircle2,
  Clock,
  BookOpen,
  BrainCircuit,
  AlertTriangle,
  RotateCcw,
  Check,
  ArrowRight,
} from 'lucide-react';
import { UserShell } from '@/app/user/(protected)/_components/user-shell';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { requireLearner } from '@/services/auth';
import { getUserSkillProfile } from '@/services/skills';
import { getUserSkillGaps } from '@/services/skill-gap';
import { getMistakeTrends } from '@/services/mistake-trends';
import { getDueReviews } from '@/services/reviews';

type StudyTopicRelation =
  | {
      title: string;
      slug: string;
      estimated_minutes: number;
    }
  | Array<{
      title: string;
      slug: string;
      estimated_minutes: number;
    }>
  | null;

export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const learner = await requireLearner();

  const [{ data }, skillProfile, skillGaps, mistakeTrends, dueReviews] =
    await Promise.all([
      supabase
        .from('topic_progress')
        .select(
          'progress, status, last_studied_at, study_topics(title, slug, estimated_minutes)'
        )
        .eq('user_id', learner.id)
        .order('last_studied_at', { ascending: false }),
      getUserSkillProfile(learner.id).catch(() => null),
      getUserSkillGaps(learner.id).catch(() => null),
      getMistakeTrends(learner.id).catch(() => []),
      getDueReviews(learner.id, 50).catch(() => []),
    ]);

  // Safe category & relation extraction
  const rows = (data ?? [])
    .map((item) => {
      const topicRelation = item.study_topics as StudyTopicRelation;
      const topic = Array.isArray(topicRelation)
        ? topicRelation[0]
        : topicRelation;
      return { ...item, topic };
    })
    .filter(
      (
        item
      ): item is typeof item & { topic: NonNullable<typeof item.topic> } =>
        Boolean(item.topic?.slug)
    );

  const total = rows.length;
  const completed = rows.filter((item) => (item.progress ?? 0) >= 100).length;
  const inProgress = rows.filter(
    (item) => (item.progress ?? 0) > 0 && (item.progress ?? 0) < 100
  ).length;
  const average = total
    ? Math.round(
        rows.reduce(
          (sum, item) =>
            sum + Math.max(0, Math.min(100, item.progress ?? 0)),
          0
        ) / total
      )
    : 0;

  return (
    <UserShell>
      <div className="mx-auto max-w-7xl space-y-3 text-slate-900 dark:text-slate-100">
        {/* Compact Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2 dark:border-slate-800/80">
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Progress Overview
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              See what you have completed, active topics, and skills progress.
            </p>
          </div>
        </div>

        {/* Compact Metrics Overview Grid */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          {/* Card 1: Overall Progress Ring & Stats */}
          <div className="col-span-1 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-2.5 shadow-2xs dark:bg-indigo-950/20 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-200 p-0.5 shadow-inner dark:bg-slate-800"
                style={{
                  background: `conic-gradient(#6366f1 ${average}%, #e2e8f0 0)`,
                }}
              >
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-xs font-bold text-slate-900 dark:bg-[#0d121f] dark:text-white">
                  {average}%
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  Overall Progress
                </span>
                <span className="text-sm font-bold leading-tight text-slate-900 dark:text-white">
                  {completed} / {total}
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  topics completed
                </p>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="mt-2.5 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <span
                className="bg-emerald-500 transition-all duration-500"
                style={{ width: `${total ? (completed / total) * 100 : 0}%` }}
                title="Completed"
              />
              <span
                className="bg-indigo-500 transition-all duration-500"
                style={{ width: `${total ? (inProgress / total) * 100 : 0}%` }}
                title="In Progress"
              />
            </div>
          </div>

          {/* Card 2: Topics Tracked */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Topics Tracked
              </span>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{total}</div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Across learning library</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
              <BookOpen size={16} />
            </div>
          </div>

          {/* Card 3: In Progress */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                In Progress
              </span>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{inProgress}</div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Ready to continue</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
              <Clock size={16} />
            </div>
          </div>

          {/* Card 4: Completed */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Completed
              </span>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{completed}</div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Finished topics</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
        </div>

        {/* Skill Mastery Section */}
        {skillProfile &&
          skillProfile.skills.filter((s) => s.mastery != null).length > 0 && (
            <section className="rounded-xl border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 p-2.5 pb-2 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <BrainCircuit size={14} />
                  </div>
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                    Skill Mastery
                  </h2>
                </div>
              </div>

              <div className="space-y-2 p-2.5">
                {/* Metric Strip */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-2 text-center dark:border-slate-800 dark:bg-slate-800/40">
                    <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      Average
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {skillProfile.averageMastery}%
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-2 text-center dark:border-slate-800 dark:bg-slate-800/40">
                    <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      Tracked
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {skillProfile.skills.filter((s) => s.mastery != null).length}
                    </span>
                  </div>
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-center dark:bg-emerald-950/20">
                    <span className="block text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      Strongest
                    </span>
                    <span className="block truncate text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      {skillProfile.strongestSkills[0]?.skill.name ?? '—'}
                    </span>
                  </div>
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-center dark:bg-amber-950/20">
                    <span className="block text-[10px] font-medium text-amber-600 dark:text-amber-400">
                      Needs Work
                    </span>
                    <span className="block truncate text-xs font-bold text-amber-700 dark:text-amber-300">
                      {skillProfile.weakestSkills[0]?.skill.name ?? '—'}
                    </span>
                  </div>
                </div>

                {/* Skill List Progress */}
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {skillProfile.skills
                    .filter((s) => s.mastery != null)
                    .sort(
                      (a, b) =>
                        (b.mastery?.masteryScore ?? 0) -
                        (a.mastery?.masteryScore ?? 0)
                    )
                    .slice(0, 6)
                    .map((item) => {
                      const score = item.mastery?.masteryScore ?? 0;
                      const conf = item.mastery?.confidenceScore ?? 0;
                      return (
                        <div
                          key={item.skill.id}
                          className="flex items-center gap-2 rounded-lg border border-slate-200/60 bg-slate-50/50 p-2 dark:border-slate-800/60 dark:bg-slate-800/30"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                                {item.skill.name}
                              </span>
                              <span className="ml-2 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                {score}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                <div
                                  className={`h-full rounded-full ${
                                    score >= 70
                                      ? 'bg-emerald-500'
                                      : score >= 40
                                      ? 'bg-indigo-500'
                                      : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                              <span className="w-14 text-right text-[9px] text-slate-500 dark:text-slate-400">
                                conf: {conf}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </section>
          )}

        {/* Priority Skill Gaps */}
        {skillGaps && skillGaps.highPriorityGaps.length > 0 && (
          <section className="rounded-xl border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 p-2.5 pb-2 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
                  <AlertTriangle size={14} />
                </div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                  Priority Skill Gaps
                </h2>
              </div>
            </div>
            <div className="space-y-1.5 p-2.5">
              {skillGaps.highPriorityGaps.slice(0, 4).map((gap) => (
                <div
                  key={gap.skill.id}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-200/60 bg-slate-50/50 p-2 dark:border-slate-800/60 dark:bg-slate-800/30"
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                      gap.priority === 'critical'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {gap.gapScore}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                        {gap.skill.name}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase ${
                          gap.priority === 'critical'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {gap.priority}
                      </span>
                    </div>
                    <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                      {gap.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Review & Mistakes Section */}
        <section className="grid gap-2 sm:gap-3 lg:grid-cols-2">
          {/* Review Queue Card */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                  Review Queue
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Spaced repetition keeps knowledge fresh.
                </p>
              </div>
              <Link
                href="/reviews"
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RotateCcw size={11} /> Review
              </Link>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {dueReviews.length}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">due items</span>
            </div>
          </div>

          {/* Recurring Mistakes Card */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              Recurring Mistakes
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Patterns deserving targeted practice.
            </p>
            <div className="mt-2 space-y-1">
              {mistakeTrends.slice(0, 3).map((item: any) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-800/40"
                >
                  <span className="truncate text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    {item.category.replaceAll('_', ' ')}
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    {item.occurrence_count}
                  </span>
                </div>
              ))}
              {!mistakeTrends.length && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  No recurring mistake pattern yet.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Topic Activity List Section */}
        <section className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800/80">
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                Continue Learning
              </h2>
            </div>
            <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
              {total} {total === 1 ? 'topic' : 'topics'}
            </span>
          </div>

          {rows.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {rows.map((item) => {
                const topic = item.topic;
                const value = Math.max(0, Math.min(100, item.progress ?? 0));
                const isDone = value >= 100;

                return (
                  <Link
                    key={topic.slug}
                    href={`/study/topic/${topic.slug}`}
                    className="group flex items-center justify-between gap-3 py-2 transition hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg px-1.5"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      {/* Status Indicator */}
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                          isDone
                            ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {isDone ? <Check size={12} /> : <ArrowRight size={12} />}
                      </span>

                      {/* Topic Metadata & Progress Bar */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <strong className="truncate text-xs font-semibold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                            {topic.title}
                          </strong>
                          <b className="ml-2 text-[10px] font-bold text-slate-700 dark:text-slate-300 sm:hidden">
                            {value}%
                          </b>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                          <span
                            className={
                              isDone
                                ? 'font-medium text-emerald-600 dark:text-emerald-400'
                                : item.status === 'not_started'
                                ? 'text-slate-400 dark:text-slate-500'
                                : 'font-medium text-indigo-600 dark:text-indigo-400'
                            }
                          >
                            {isDone
                              ? 'Completed'
                              : item.status === 'not_started'
                              ? 'Not started'
                              : 'In progress'}
                          </span>
                          <span>·</span>
                          <span>{topic.estimated_minutes} min</span>
                        </div>

                        {/* Thin Compact Progress Bar */}
                        <div className="mt-1 h-1 w-full max-w-xs overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isDone ? 'bg-emerald-500' : 'bg-indigo-600 dark:bg-indigo-500'
                            }`}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="hidden items-center gap-2 sm:flex">
                      <b className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {value}%
                      </b>
                      <ChevronRight
                        size={14}
                        className="text-slate-400 transition-colors group-hover:text-slate-900 dark:text-slate-500 dark:group-hover:text-white"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* Compact Empty State */
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500">
                <BookOpen size={16} />
              </div>
              <strong className="text-xs font-bold text-slate-900 dark:text-white">
                No progress yet
              </strong>
              <p className="mt-0.5 max-w-xs text-[11px] text-slate-500 dark:text-slate-400">
                Open a topic from the library to start tracking.
              </p>
              <Link
                href="/study"
                className="mt-3 inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-indigo-500"
              >
                Explore topics
              </Link>
            </div>
          )}
        </section>
      </div>
    </UserShell>
  );
}