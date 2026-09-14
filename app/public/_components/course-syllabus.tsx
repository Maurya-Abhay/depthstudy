'use client';

import { ChevronRight, Clock, BookOpen } from 'lucide-react';
import { useState } from 'react';

type SyllabusTopic = {
  id: string;
  title: string;
  summary: string;
  estimated_minutes: number;
};

type SyllabusGroup = {
  name: string;
  topics: SyllabusTopic[];
};

export function CourseSyllabus({ groups }: { groups: SyllabusGroup[] }) {
  const [expanded, setExpanded] = useState<string>(groups[0]?.name ?? '');

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => {
        const isOpen = expanded === group.name;

        return (
          <section
            key={group.name}
            className={`overflow-hidden rounded-xl border transition-all duration-200 ${
              isOpen
                ? 'border-indigo-500/40 bg-white shadow-sm dark:border-indigo-500/40 dark:bg-slate-900/80'
                : 'border-slate-200/80 bg-white/60 hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/40 dark:hover:border-slate-700'
            }`}
          >
            {/* Header Accordion Button */}
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
              onClick={() => setExpanded(isOpen ? '' : group.name)}
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isOpen
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                  }`}
                >
                  <BookOpen size={16} />
                </div>
                <div>
                  <strong className="block text-xs font-bold text-slate-900 dark:text-white">
                    {group.name}
                  </strong>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {group.topics.length} {group.topics.length === 1 ? 'topic' : 'topics'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span>{isOpen ? 'Hide topics' : 'Explore'}</span>
                <ChevronRight
                  size={14}
                  className={`transition-transform duration-200 ${
                    isOpen ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </button>

            {/* Topic List Content */}
            {isOpen && (
              <div className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800/60 dark:border-slate-800/80">
                {group.topics.map((topic, index) => (
                  <div
                    key={topic.id}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                  >
                    <span className="mt-0.5 w-5 shrink-0 font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <div className="flex-1">
                      <strong className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                        {topic.title}
                      </strong>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                        {topic.summary || 'Course topic preview.'}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
                        <Clock size={10} className="text-slate-400" />
                        {topic.estimated_minutes} min
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}