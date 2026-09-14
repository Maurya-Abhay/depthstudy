'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Editor from '@monaco-editor/react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Play,
  Send,
  X,
  Loader2,
  Code2,
  FileText,
  Sparkles,
  RotateCcw,
  Terminal,
} from 'lucide-react';
import type { DsaProblem } from '@/types';
import { useTheme } from '@/components/ui/theme-provider';

type NavigationProblem = {
  id: string;
  topicId?: string;
  title: string;
  slug: string;
  difficulty: string;
};

type DsaTopic = {
  id: string;
  name: string;
  slug: string;
};

export function ProblemWorkspace({
  problem,
  topics = [],
  navigationProblems = [],
}: {
  problem: DsaProblem;
  topics?: DsaTopic[];
  navigationProblems?: NavigationProblem[];
}) {
  const { theme } = useTheme();
  const [code, setCode] = useState(problem.starterCode);
  const [output, setOutput] = useState('No execution output yet.');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // Auto-sync editor state when navigating to a new problem
  useEffect(() => {
    setCode(problem.starterCode);
    setOutput('No execution output yet.');
    setStatus('');
  }, [problem.id, problem.starterCode]);

  useEffect(() => {
    const handleFullscreenChange = () =>
      setFocusMode(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const outputState =
    status.toLowerCase().includes('accepted') || status.toLowerCase() === 'completed'
      ? 'success'
      : status.toLowerCase().includes('rejected') ||
        status.toLowerCase().includes('error') ||
        status.toLowerCase().includes('failed')
      ? 'error'
      : 'idle';

  async function execute(action: 'run' | 'submit') {
    setBusy(true);
    setStatus('');
    try {
      const response = await fetch('/api/dsa', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, problemId: problem.id, source: code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to execute code.');

      if (action === 'run') {
        setOutput(data.output || '(no stdout output)');
        setStatus(data.status || 'Completed');
      } else {
        setOutput(`Passed ${data.passed}/${data.total} test cases.`);
        setStatus(data.accepted ? 'Accepted' : 'Rejected');
      }
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Code runner server error.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleFocusMode() {
    if (focusMode) {
      if (document.fullscreenElement) await document.exitFullscreen();
      else setFocusMode(false);
      return;
    }
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      setFocusMode(true);
    }
  }

  const topicGroups = topics
    .map((topic) => ({
      topic,
      problems: navigationProblems.filter((item) => item.topicId === topic.id),
    }))
    .filter((group) => group.problems.length);

  const ungrouped = navigationProblems.filter(
    (item) => !topics.some((topic) => topic.id === item.topicId)
  );

  return (
    <div
      className={`grid grid-cols-1 gap-3 text-slate-900 dark:text-slate-100 ${
        focusMode
          ? 'fixed inset-0 z-50 h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0a0d14] p-3 lg:grid-cols-12'
          : 'lg:grid-cols-12'
      }`}
    >
      {/* 1. Left Sidebar: Navigator (Visible in Focus Mode) */}
      {focusMode && (
        <aside className="lg:col-span-2 flex flex-col h-[calc(100vh-1.5rem)] rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111622] p-3 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2 mb-2 flex-shrink-0">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Topics
              </span>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">All Problems</h3>
            </div>
            <button
              type="button"
              onClick={toggleFocusMode}
              className="rounded-lg p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
              aria-label="Exit focus mode"
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto text-xs pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {topicGroups.map(({ topic, problems }) => (
              <details
                key={topic.id}
                open={problems.some((item) => item.slug === problem.slug)}
                className="group rounded-lg border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/40 overflow-hidden"
              >
                <summary className="flex items-center justify-between p-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer select-none">
                  <span className="truncate">{topic.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="rounded bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-600 dark:text-slate-400 font-mono">
                      {problems.length}
                    </span>
                    <ChevronRight
                      size={12}
                      className="text-slate-400 dark:text-slate-500 transition-transform group-open:rotate-90"
                    />
                  </div>
                </summary>
                <div className="divide-y divide-slate-200 dark:divide-slate-800/40 border-t border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-950/40">
                  {problems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/dsa/${encodeURIComponent(item.slug)}`}
                      className={`flex items-center justify-between p-2 text-[11px] transition ${
                        item.slug === problem.slug
                          ? 'bg-indigo-50 dark:bg-indigo-600/25 text-indigo-600 dark:text-indigo-300 font-semibold border-l-2 border-indigo-500'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="truncate">{item.title}</span>
                    </Link>
                  ))}
                </div>
              </details>
            ))}

            {ungrouped.length > 0 && (
              <details open className="group rounded-lg border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/40 overflow-hidden">
                <summary className="flex items-center justify-between p-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer select-none">
                  <span>General</span>
                  <ChevronRight size={12} className="text-slate-400 dark:text-slate-500 transition-transform group-open:rotate-90" />
                </summary>
                <div className="divide-y divide-slate-200 dark:divide-slate-800/40 border-t border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-950/40">
                  {ungrouped.map((item) => (
                    <Link
                      key={item.id}
                      href={`/dsa/${encodeURIComponent(item.slug)}`}
                      className={`block p-2 text-[11px] truncate transition ${
                        item.slug === problem.slug
                          ? 'bg-indigo-50 dark:bg-indigo-600/25 text-indigo-600 dark:text-indigo-300 font-semibold border-l-2 border-indigo-500'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </details>
            )}
          </div>
        </aside>
      )}

      {/* 2. Middle Panel: Problem Statement & Notes (Fixed Scrolling) */}
      <div
        className={`flex flex-col rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111622] p-4 shadow-xl overflow-y-auto ${
          focusMode
            ? highlightFocusGrid(true, 5)
            : 'lg:col-span-6 h-[85vh]'
        }`}
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2 flex-shrink-0">
            <span
              className={`rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase ${
                problem.difficulty.toLowerCase() === 'easy'
                  ? 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : problem.difficulty.toLowerCase() === 'medium'
                  ? 'border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              {problem.difficulty}
            </span>
            {problem.pattern && (
              <span className="rounded-md border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 text-[9px] font-medium text-indigo-600 dark:text-indigo-300">
                {problem.pattern}
              </span>
            )}
          </div>

          <div className="mb-4 flex-shrink-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{problem.title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{problem.summary}</p>
          </div>

          <section className="space-y-3 border-t border-slate-200 dark:border-slate-800/80 pt-3 text-xs text-slate-700 dark:text-slate-300">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
              <FileText size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>Description</span>
            </h2>
            <p className="whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-300">{problem.problem}</p>

            {problem.examples && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Examples</span>
                <pre className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-2.5 font-mono text-[11px] text-slate-800 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {problem.examples}
                </pre>
              </div>
            )}

            {problem.constraints && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Constraints</span>
                <p className="rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 p-2 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  {problem.constraints}
                </p>
              </div>
            )}
          </section>

          <section className="space-y-2.5 border-t border-slate-200 dark:border-slate-800/80 pt-3 mt-4 text-xs text-slate-700 dark:text-slate-300">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles size={14} className="text-amber-500 dark:text-amber-400" />
              <span>Hints & Approach</span>
            </h2>

            <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-2.5 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
              <strong className="font-bold text-amber-700 dark:text-amber-400">Hint: </strong>
              {problem.hint || 'Analyze boundaries and invariants carefully.'}
            </div>

            <div className="grid gap-2 pt-1">
              {problem.bruteForce && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/30 p-2.5">
                  <span className="block font-bold text-slate-800 dark:text-slate-200 text-[11px] mb-0.5">Brute Force</span>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">{problem.bruteForce}</p>
                </div>
              )}

              {problem.optimized && (
                <div className="rounded-lg border border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/5 p-2.5">
                  <span className="block font-bold text-indigo-700 dark:text-indigo-300 text-[11px] mb-0.5">Optimized Approach</span>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">{problem.optimized}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                Time: {problem.timeComplexity || 'N/A'}
              </span>
              <span className="rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                Space: {problem.spaceComplexity || 'N/A'}
              </span>
            </div>
          </section>

          {problem.solution && (
            <details className="group rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40 text-xs mt-3 overflow-hidden mb-2">
              <summary className="flex items-center justify-between p-2.5 font-semibold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer select-none">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Reference Solution (Java)</span>
                <ChevronDown size={14} className="text-slate-400 dark:text-slate-500 transition-transform group-open:rotate-180" />
              </summary>
              <pre className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-900 dark:bg-slate-950 p-3 font-mono text-[11px] text-indigo-200 overflow-x-auto">
                <code>{problem.solution}</code>
              </pre>
            </details>
          )}
        </div>
      </div>

      {/* 3. Right Panel: Code Editor & Execution Output */}
      <div
        className={`flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111622] p-4 shadow-xl overflow-y-auto ${
          focusMode
            ? highlightFocusGrid(true, 5)
            : 'lg:col-span-6 h-[85vh]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Java Code Workspace</h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleFocusMode}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
              title={focusMode ? 'Exit Fullscreen Focus' : 'Fullscreen Focus'}
            >
              {focusMode ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              <span>{focusMode ? 'Exit' : 'Focus'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCode(problem.starterCode)}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition disabled:opacity-50"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={() => execute('run')}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition disabled:opacity-50"
            >
              {busy ? <Loader2 size={12} className="animate-spin text-indigo-600 dark:text-indigo-400" /> : <Play size={12} className="text-emerald-600 dark:text-emerald-400 fill-emerald-600/20 dark:fill-emerald-400/20" />}
              <span>Run</span>
            </button>

            <button
              type="button"
              onClick={() => execute('submit')}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              <span>Submit</span>
            </button>
          </div>
        </div>

        {/* Monaco Editor Frame */}
        <div className="flex-1 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-900 dark:bg-[#1e1e1e] min-h-[350px]">
          <Editor
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            language="java"
            value={code}
            onChange={(val) => setCode(val ?? '')}
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              padding: { top: 10, bottom: 10 },
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
            height="100%"
          />
        </div>

        {/* Terminal / Output Frame */}
        <div
          className={`rounded-lg border p-3 flex-shrink-0 transition ${
            outputState === 'success'
              ? 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20'
              : outputState === 'error'
              ? 'border-rose-500/30 bg-rose-50 dark:bg-rose-950/20'
              : 'border-slate-200 dark:border-slate-800/80 bg-slate-100 dark:bg-slate-950/60'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-300">
              <Terminal size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>Execution Output</span>
            </div>

            {status && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                  outputState === 'success'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : outputState === 'error'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {outputState === 'success' && <CheckCircle2 size={12} />}
                {outputState === 'error' && <AlertCircle size={12} />}
                {status}
              </span>
            )}
          </div>

          <pre className="font-mono text-[11px] text-slate-800 dark:text-slate-300 whitespace-pre-wrap max-h-24 overflow-y-auto leading-relaxed">
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
}

// Helper for dynamic focus span calculations
function highlightFocusGrid(isFocus: boolean, span: number) {
  return isFocus ? `lg:col-span-${span} h-[calc(100vh-1.5rem)]` : '';
}