'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Search, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import type { DsaProblem } from '@/types';

export function ProblemList({
  problems,
  solvedIds = [],
}: {
  problems: DsaProblem[];
  solvedIds?: string[];
}) {
  const [difficulty, setDifficulty] = useState('All');
  const [pattern, setPattern] = useState('All');
  const [status, setStatus] = useState('All');
  const [query, setQuery] = useState('');

  const solved = useMemo(() => new Set(solvedIds), [solvedIds]);

  const patterns = useMemo(
    () =>
      Array.from(new Set(problems.map((p) => p.pattern).filter(Boolean))).sort() as string[],
    [problems]
  );

  const filtered = useMemo(
    () =>
      problems.filter((p) => {
        const matchesDifficulty = difficulty === 'All' || p.difficulty === difficulty;
        const matchesPattern = pattern === 'All' || p.pattern === pattern;
        const matchesStatus =
          status === 'All' ||
          (status === 'Solved' && solved.has(p.id)) ||
          (status === 'Unsolved' && !solved.has(p.id));
        const matchesQuery = `${p.title} ${p.summary}`
          .toLowerCase()
          .includes(query.toLowerCase());

        return matchesDifficulty && matchesPattern && matchesStatus && matchesQuery;
      }),
    [problems, difficulty, pattern, status, query, solved]
  );

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] p-5 shadow-lg dark:shadow-xl space-y-5">
      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search problems..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Difficulty Dropdown */}
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:border-indigo-500 focus:outline-none transition cursor-pointer"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          {/* Pattern Dropdown */}
          <select
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:border-indigo-500 focus:outline-none transition cursor-pointer"
          >
            <option value="All">All Patterns</option>
            {patterns.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:border-indigo-500 focus:outline-none transition cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Solved">Solved</option>
            <option value="Unsolved">Unsolved</option>
          </select>
        </div>
      </div>

      {/* Problems List */}
      {filtered.length ? (
        <div className="divide-y divide-slate-200 dark:divide-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40 overflow-hidden">
          {filtered.map((problem) => {
            const isSolved = solved.has(problem.id);

            return (
              <Link
                key={problem.id}
                href={`/dsa/problem/${problem.slug}`}
                className="group flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between transition hover:bg-slate-100 dark:hover:bg-slate-800/40"
              >
                {/* Title & Status */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className="mt-0.5 shrink-0">
                    {isSolved ? (
                      <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400" />
                    ) : (
                      <Circle size={16} className="text-slate-400 dark:text-slate-600" />
                    )}
                  </span>
                  <div className="space-y-0.5 min-w-0">
                    <strong className="block truncate text-xs font-bold text-slate-900 dark:text-white transition group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                      {problem.title}
                    </strong>
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {problem.summary}
                    </p>
                  </div>
                </div>

                {/* Metadata Badges & Action Arrow */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  {/* Difficulty Pill */}
                  <span
                    className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-bold ${
                      problem.difficulty === 'Easy'
                        ? 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : problem.difficulty === 'Medium'
                        ? 'border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {problem.difficulty}
                  </span>

                  {/* Pattern Badge */}
                  {problem.pattern && (
                    <span className="rounded-lg border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-300">
                      {problem.pattern}
                    </span>
                  )}

                  <ArrowRight
                    size={15}
                    className="text-slate-400 dark:text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty Filter State */
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 p-10 text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500">
            <AlertCircle size={20} />
          </div>
          <strong className="text-xs font-bold text-slate-900 dark:text-white">No matching problems</strong>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Try adjusting your search query or filter options.
          </p>
        </div>
      )}
    </div>
  );
}