'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronRight, Clock, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Category, Topic } from '@/types';

export type TopicHeaderUpdate = {
  title?: string;
  categoryName?: string;
  categorySlug?: string;
  difficulty?: string;
  estimatedMinutes?: number;
  progress?: number;
};

type Props = {
  topic: Topic;
  category?: Category;
  progress: number;
  signedIn: boolean;
};

export function TopicHeader({ topic, category, progress: initialProgress, signedIn }: Props) {
  const [state, setState] = useState({
    title: topic.title,
    categoryName: category?.name,
    categorySlug: category?.slug,
    difficulty: topic.difficulty,
    estimatedMinutes: topic.estimatedMinutes,
    progress: initialProgress,
  });

  // Sync with prop changes
  useEffect(() => {
    setState({
      title: topic.title,
      categoryName: category?.name,
      categorySlug: category?.slug,
      difficulty: topic.difficulty,
      estimatedMinutes: topic.estimatedMinutes,
      progress: initialProgress,
    });
  }, [topic, category, initialProgress]);

  // Sync when workspace dispatches dynamic topic updates
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<TopicHeaderUpdate>).detail ?? {};
      setState((current) => ({ ...current, ...detail }));
    };
    window.addEventListener('study-topic-change', handler);
    return () => window.removeEventListener('study-topic-change', handler);
  }, []);

  const isEasy = state.difficulty?.toLowerCase() === 'easy';
  const isMedium = state.difficulty?.toLowerCase() === 'medium';

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 bg-white text-zinc-900 dark:border-white/10 dark:bg-[#07090e] dark:text-zinc-100 px-4 transition-colors">
      <div className="flex items-center gap-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        <Link
          href="/study"
          className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition px-2.5 py-1"
        >
          <ArrowLeft size={13} />
          <span>Library</span>
        </Link>

        <div className="h-4 w-[1px] bg-zinc-300 dark:bg-white/10" />

        <nav className="flex items-center gap-1.5 text-[11px] font-semibold">
          {state.categoryName && (
            <>
              <Link
                href={`/study/category/${state.categorySlug ?? ''}`}
                className="text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition"
              >
                {state.categoryName}
              </Link>
              <ChevronRight size={12} className="text-zinc-400 dark:text-zinc-600" />
            </>
          )}
          <span className="truncate max-w-[180px] sm:max-w-xs text-zinc-800 dark:text-zinc-200">
            {state.title}
          </span>
        </nav>
      </div>

      {/* METADATA & PROGRESS */}
      <div className="flex items-center gap-2.5">
        {state.difficulty && (
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${
              isEasy
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : isMedium
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
            }`}
          >
            {state.difficulty}
          </span>
        )}

        {state.estimatedMinutes ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 px-2 py-0.5 text-[10px] font-medium">
            <Clock size={11} className="text-zinc-400" />
            {state.estimatedMinutes}m
          </span>
        ) : null}

        {signedIn && (
          <div className="flex items-center gap-1.5 rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
            <Sparkles size={11} />
            <span>{state.progress}%</span>
          </div>
        )}
      </div>
    </header>
  );
}