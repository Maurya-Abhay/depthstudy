'use client';

import { useEffect, useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Trophy,
  Code2,
  FolderGit2,
  MessagesSquare,
  AlertCircle,
  Loader2,
  Send,
  CheckCircle2,
  Award,
  Play,
  RotateCcw,
} from 'lucide-react';
import { UserShell } from '@/app/user/(protected)/_components/user-shell';

type Track = { id: string; name: string; description: string };
type Question = {
  id: string;
  category: string;
  prompt: string;
  difficulty: number;
};
type Session = { id: string; score?: number | null };

export default function InterviewPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [readiness, setReadiness] = useState<any>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [mode, setMode] = useState<'practice' | 'mock'>('practice');

  async function load() {
    try {
      const [a, b] = await Promise.all([
        fetch('/api/interview').then((r) => r.json()),
        fetch('/api/interview', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'readiness' }),
        }).then((r) => r.json()),
      ]);
      setTracks(a.tracks ?? []);
      setReadiness(b.readiness ?? null);
    } catch {
      setTracks([]);
      setReadiness(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function start(trackId: string, selectedMode: 'practice' | 'mock') {
    setWorking(true);
    setFeedback('');
    setMode(selectedMode);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'start', trackId, mode: selectedMode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error ?? 'Could not start interview');
        return;
      }
      setSession(data.session);
      await next(data.session.id);
    } finally {
      setWorking(false);
    }
  }

  async function next(sessionId: string) {
    const res = await fetch(
      `/api/interview?sessionId=${encodeURIComponent(sessionId)}`
    );
    const data = await res.json();
    setQuestion(data.question ?? null);
    setAnswer('');
    if (!data.question) {
      setFeedback('No more questions. Finish the session when you are ready.');
    }
  }

  async function submit() {
    if (!session || !question || answer.trim().length < 5) return;
    setWorking(true);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'answer',
          sessionId: session.id,
          questionId: question.id,
          answer,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error ?? 'Could not submit answer');
        return;
      }
      setFeedback(`Score ${data.answer.score}% — ${data.answer.feedback}`);
      setTimeout(() => next(session.id), 900);
    } finally {
      setWorking(false);
    }
  }

  async function finish() {
    if (!session) return;
    setWorking(true);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'finish', sessionId: session.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(`Interview complete: ${data.session.score}%`);
        setSession(null);
        setQuestion(null);
        await load();
      } else {
        setFeedback(data.error ?? 'Could not finish interview');
      }
    } finally {
      setWorking(false);
    }
  }

  return (
    <UserShell>
      <div className="mx-auto max-w-7xl space-y-3 text-slate-900 dark:text-slate-100">
        {/* Compact Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2 dark:border-slate-800/80">
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Interview Prep Workspace
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Technical practice directly impacts your overall placement readiness score.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
            <Sparkles size={11} /> {tracks.length} Tracks
          </span>
        </div>

        {/* High-Density Readiness Dashboard Metrics Grid */}
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-2.5 shadow-2xs dark:bg-indigo-950/20">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Overall Readiness
              </span>
              <Trophy size={14} className="text-amber-500" />
            </div>
            <div className="mt-1 text-base font-bold text-indigo-600 dark:text-indigo-400">
              {readiness?.overall_score ?? 0}%
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                DSA Score
              </span>
              <Code2 size={14} className="text-indigo-500" />
            </div>
            <div className="mt-1 text-base font-bold text-slate-900 dark:text-white">
              {readiness?.dsa_score ?? 0}%
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Projects Score
              </span>
              <FolderGit2 size={14} className="text-emerald-500" />
            </div>
            <div className="mt-1 text-base font-bold text-slate-900 dark:text-white">
              {readiness?.projects_score ?? 0}%
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Interview Score
              </span>
              <MessagesSquare size={14} className="text-purple-500" />
            </div>
            <div className="mt-1 text-base font-bold text-slate-900 dark:text-white">
              {readiness?.interview_score ?? 0}%
            </div>
          </div>
        </section>

        {/* Priority Gaps Alert Bar */}
        {!session && readiness?.gaps?.length ? (
          <section className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-2.5 dark:bg-rose-950/20">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
              <AlertCircle size={13} /> Priority Gaps Identified
            </div>
            <div className="flex flex-wrap gap-1">
              {readiness.gaps.map((g: string) => (
                <span
                  key={g}
                  className="inline-flex items-center rounded-md border border-rose-500/20 bg-white px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-slate-900 dark:text-rose-300"
                >
                  {g}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {/* Main Interactive Practice Section */}
        {loading ? (
          <div className="flex h-36 w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white p-4 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <Loader2 size={14} className="animate-spin text-indigo-500" />
            Loading workspace…
          </div>
        ) : session && question ? (
          /* Active Question Session Window */
          <section className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 shadow-2xs dark:bg-indigo-950/20">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/10 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {question.category}
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  · Diff {question.difficulty}/5
                </span>
              </div>
              <button
                disabled={working}
                onClick={finish}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                Finish Session
              </button>
            </div>

            <h2 className="mt-2 text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
              {question.prompt}
            </h2>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              placeholder="Explain your reasoning, trade-offs, edge cases, and code examples..."
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-normal text-slate-900 placeholder-slate-400 outline-none ring-0 focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />

            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                disabled={working || answer.trim().length < 5}
                onClick={submit}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {working ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                Submit Answer
              </button>

              {feedback && (
                <div className="truncate text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                  {feedback}
                </div>
              )}
            </div>
          </section>
        ) : (
          /* Track Selection Section */
          <section className="space-y-2">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              Available Practice Tracks
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {tracks.map((t) => (
                <article
                  key={t.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      {t.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">
                      {t.description}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <button
                      disabled={working}
                      onClick={() => start(t.id, 'practice')}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-indigo-600 py-1.5 text-[11px] font-semibold text-white shadow-2xs transition hover:bg-indigo-500 disabled:opacity-50"
                    >
                      <Play size={10} /> Practice (5Q)
                    </button>
                    <button
                      disabled={working}
                      onClick={() => start(t.id, 'mock')}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                      Mock (10Q)
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </UserShell>
  );
}