'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BookOpen, CheckCircle2, ChevronDown, LockKeyhole } from 'lucide-react';

type ExplorerTopic = {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  categoryName: string;
  progress: number;
};

type Props = {
  topics: ExplorerTopic[];
  enrolled: boolean;
};

export function CourseTopicExplorer({ topics, enrolled }: Props) {
  const categories = [...new Set(topics.map((topic) => topic.categoryName))];
  const [openCategories, setOpenCategories] = useState<string[]>(() => categories.slice(0, 1));

  function toggleCategory(cat: string) {
    setOpenCategories((current) =>
      current.includes(cat) ? current.filter((item) => item !== cat) : [...current, cat]
    );
  }

  if (!topics.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 py-10 text-center">
        <BookOpen size={22} className="text-slate-300 dark:text-slate-600" />
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">No topics in this course yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {categories.map((cat) => {
        const categoryTopics = topics.filter((topic) => topic.categoryName === cat);
        const done = categoryTopics.filter((topic) => topic.progress === 100).length;
        const isOpen = openCategories.includes(cat);

        return (
          <div key={cat} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => toggleCategory(cat)}
              className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-800/50"
            >
              <div className="min-w-0 pr-3">
                <strong className="block truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                  {cat}
                </strong>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {done}/{categoryTopics.length} completed
                </span>
              </div>
              <ChevronDown
                size={15}
                className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <div className="space-y-1.5 border-t border-slate-100 p-2 dark:border-slate-800/80 dark:bg-slate-950/60">
                {categoryTopics.map((topic) => {
                  const completed = topic.progress === 100;
                  const inner = (
                    <>
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          completed
                            ? 'border-emerald-400 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {completed ? <CheckCircle2 size={11} /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-xs font-semibold ${enrolled ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-500'}`}>
                          {topic.title}
                        </span>
                        {topic.summary && (
                          <span className="block truncate text-[11px] text-slate-400 dark:text-slate-500">
                            {topic.summary}
                          </span>
                        )}
                      </span>
                      {enrolled ? (
                        <span className="shrink-0 text-[10px] font-bold text-indigo-500 dark:text-indigo-400">
                          {topic.progress}%
                        </span>
                      ) : (
                        <LockKeyhole size={12} className="shrink-0 text-slate-300 dark:text-slate-600" />
                      )}
                    </>
                  );

                  return enrolled ? (
                    <Link
                      key={topic.id}
                      href={`/study/topic/${topic.slug}`}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div
                      key={topic.id}
                      className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-2.5 py-2"
                      title="Enroll to unlock this topic"
                    >
                      {inner}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
