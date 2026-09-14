'use client';

import Link from 'next/link';
import {
  Check,
  ChevronRight,
  Circle,
  AlertCircle,
  Loader2,
  BookOpen,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

type RoadmapTopic = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  categoryName: string;
  progress: number;
};

type RoadmapCourse = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  content?: string;
  topics: RoadmapTopic[];
};

export function RoadmapView({ courses }: { courses: RoadmapCourse[] }) {
  const [items, setItems] = useState(courses);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  async function complete(topicId: string) {
    setBusy(topicId);
    setMessage('');
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topicId, progress: 100 }),
      });
      if (response.ok) {
        setItems((current) =>
          current.map((course) => ({
            ...course,
            topics: course.topics.map((topic) =>
              topic.id === topicId ? { ...topic, progress: 100 } : topic
            ),
          }))
        );
      } else {
        const data = await response.json().catch(() => ({}));
        setMessage(data.error || 'Unable to update progress.');
      }
    } catch {
      setMessage('Network error. Try again.');
    } finally {
      setBusy('');
    }
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
          <BookOpen size={24} />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          No active roadmaps
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Enroll in a course to start building your learning roadmap.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* Global Error Notice */}
      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          <AlertCircle size={16} className="shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {items.map((course) => {
        const categories = [...new Set(course.topics.map((topic) => topic.categoryName))];
        const completed = course.topics.filter((topic) => topic.progress === 100).length;
        const totalTopics = course.topics.length;
        const progressPercentage = totalTopics
          ? Math.round((completed / totalTopics) * 100)
          : 0;

        return (
          <section
            key={course.id}
            className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-colors dark:border-slate-800/80 dark:bg-slate-900 sm:p-6"
          >
            {/* Header with Title & Overall Progress */}
            <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {course.title}
                  </h2>
                  {progressPercentage === 100 && (
                    <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                      <Sparkles size={12} /> Completed
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {completed} of {totalTopics} topics complete
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  {progressPercentage}%
                </span>
              </div>
            </div>

            {/* Course Description */}
            {course.description && (
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {course.description}
              </p>
            )}

            {/* Expandable Course Content Details */}
            {course.content && (
              <details className="group rounded-xl border border-slate-200 bg-slate-50 text-xs dark:border-slate-800 dark:bg-slate-950/50">
                <summary className="flex cursor-pointer select-none items-center justify-between p-3 font-semibold text-slate-700 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                  <span>Roadmap Details</span>
                  <ChevronDown
                    size={16}
                    className="text-slate-500 transition-transform duration-200 group-open:rotate-180 dark:text-slate-400"
                  />
                </summary>
                <div className="border-t border-slate-200 p-3 leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-400">
                  {course.content}
                </div>
              </details>
            )}

            {/* Overall Progress Bar */}
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full bg-indigo-600 transition-all duration-500 dark:bg-indigo-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Categories & Topics Grid */}
            <div className="space-y-5 pt-1">
              {categories.map((category) => {
                const categoryTopics = course.topics.filter(
                  (topic) => topic.categoryName === category
                );

                return (
                  <div key={category} className="space-y-2.5">
                    {/* Category Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 dark:border-slate-800/60">
                      <strong className="text-xs font-bold tracking-wide text-slate-800 dark:text-slate-200">
                        {category}
                      </strong>
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        {categoryTopics.length} topics
                      </span>
                    </div>

                    {/* Topics List */}
                    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/60 divide-y divide-slate-100 dark:border-slate-800/80 dark:bg-slate-950/40 dark:divide-slate-800/60">
                      {categoryTopics.map((topic) => {
                        const isDone = topic.progress === 100;
                        const isBusy = busy === topic.id;

                        return (
                          <div
                            key={topic.id}
                            className="flex items-center justify-between gap-3 p-3 transition hover:bg-slate-100/80 dark:hover:bg-slate-800/40"
                          >
                            {/* Checkbox & Topic Details */}
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                                  isDone
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400'
                                    : 'border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800'
                                }`}
                              >
                                {isDone ? <Check size={13} /> : <Circle size={10} />}
                              </span>

                              <Link
                                href={`/dashboard/notes?topic=${encodeURIComponent(topic.slug)}`}
                                className="group min-w-0 flex-1"
                              >
                                <strong className="block truncate text-xs font-semibold text-slate-900 transition group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                                  {topic.title}
                                </strong>
                                <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                                  {topic.progress}% complete · {topic.summary || 'Open topic'}
                                </span>
                              </Link>
                            </div>

                            {/* Mark Complete Action Button */}
                            <div className="flex shrink-0 items-center gap-2">
                              {!isDone && (
                                <button
                                  type="button"
                                  onClick={() => complete(topic.id)}
                                  disabled={isBusy}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-xs transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white"
                                >
                                  {isBusy ? (
                                    <>
                                      <Loader2 size={12} className="animate-spin" />
                                      <span>Saving…</span>
                                    </>
                                  ) : (
                                    <span>Mark complete</span>
                                  )}
                                </button>
                              )}

                              <ChevronRight
                                size={14}
                                className="text-slate-400 dark:text-slate-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}