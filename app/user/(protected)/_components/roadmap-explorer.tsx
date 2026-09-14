'use client';

import { Route, ArrowRight, BookOpen, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type ExploreRoadmap = {
  id: string;
  title: string;
  slug: string;
  description: string;
  categories: string[];
  topicCount: number;
};

export function RoadmapExplorer({ roadmaps }: { roadmaps: ExploreRoadmap[] }) {
  const [busyId, setBusyId] = useState('');
  const [startedIds, setStartedIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function start(courseId: string) {
    setBusyId(courseId);
    setMessage('');
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to start this roadmap.');
      setStartedIds((current) => [...current, courseId]);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to start this roadmap.');
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="space-y-4">
      {/* Roadmap Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roadmaps.map((roadmap) => {
          const isBusy = busyId === roadmap.id;
          const isStarted = startedIds.includes(roadmap.id);

          return (
            <div
              key={roadmap.id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#121824] p-5 shadow-xl transition hover:border-slate-700"
            >
              {/* Card Header */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10">
                    <Route size={13} />
                  </div>
                  <span>Roadmap</span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white transition group-hover:text-indigo-300">
                    {roadmap.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400 line-clamp-2">
                    {roadmap.description || 'A structured learning path across key technical categories.'}
                  </p>
                </div>

                {/* Categories Chips */}
                {roadmap.categories && roadmap.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {roadmap.categories.map((category) => (
                      <span
                        key={category}
                        className="rounded-lg border border-slate-700/60 bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4">
                <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                  <BookOpen size={13} className="text-slate-500" />
                  <span>{roadmap.topicCount} topics</span>
                </span>

                <button
                  type="button"
                  onClick={() => start(roadmap.id)}
                  disabled={isBusy || isStarted}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                    isStarted
                      ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50'
                  }`}
                >
                  {isBusy ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Starting...</span>
                    </>
                  ) : isStarted ? (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Started</span>
                    </>
                  ) : (
                    <>
                      <span>Start Roadmap</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Notice / Error State */}
      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-400">
          <AlertCircle size={16} className="shrink-0" />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}