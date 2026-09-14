'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Sparkles, CheckCircle, Clock, X } from 'lucide-react';
import { UserShell } from '@/app/user/(protected)/_components/user-shell';

type Review = {
  id: string;
  source_type: string;
  interval_days: number;
  repetitions: number;
  skills?: { name?: string } | null;
  study_topics?: { title?: string } | null;
  dsa_problems?: { title?: string } | null;
};

const GRADE_OPTIONS = [
  { grade: 0, label: 'Again', color: 'hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400' },
  { grade: 1, label: 'Hard', color: 'hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-500 dark:hover:text-orange-400' },
  { grade: 2, label: 'Low', color: 'hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-500 dark:hover:text-amber-400' },
  { grade: 3, label: 'Good', color: 'hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-500 dark:hover:text-blue-400' },
  { grade: 4, label: 'Easy', color: 'hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-500 dark:hover:text-emerald-400' },
  { grade: 5, label: 'Perfect', color: 'hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-500 dark:hover:text-indigo-400' },
];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const r = await fetch('/api/reviews', { cache: 'no-store' });
      const d = await r.json();
      setReviews(d.reviews ?? []);
    } catch {
      setReviews([]);
      setError('Failed to load spaced reviews.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleGrade(id: string, g: number) {
    setBusy(id);
    setError(null);

    // Optimistically remove the graded review card from the view
    const previousReviews = [...reviews];
    setReviews((prev) => prev.filter((item) => item.id !== id));

    try {
      const r = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reviewId: id, grade: g }),
      });

      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error ?? 'Failed to submit grade.');
      }
    } catch (err: unknown) {
      // Rollback UI on failure
      setReviews(previousReviews);
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <UserShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800/80">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Spaced Review
            </h1>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Recall first, then grade how hard the recall felt.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <Sparkles size={13} /> {reviews.length} Pending
          </span>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs font-semibold text-red-700 dark:text-red-400">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Content View */}
        {loading ? (
          <div className="flex h-48 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-[#121824] dark:text-slate-400">
            <RefreshCw size={14} className="animate-spin text-indigo-500" />
            Loading reviews…
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((r) => {
              const label =
                r.dsa_problems?.title ??
                r.study_topics?.title ??
                r.skills?.name ??
                r.source_type;

              const isProcessing = busy === r.id;

              return (
                <article
                  key={r.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all dark:border-slate-800/80 dark:bg-[#121824] dark:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {r.source_type}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <Clock size={12} /> {r.interval_days}d interval · {r.repetitions} reps
                    </span>
                  </div>

                  <h2 className="mt-2.5 text-base font-bold text-slate-900 dark:text-white">
                    {label}
                  </h2>

                  <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {GRADE_OPTIONS.map(({ grade: g, label: l, color }) => (
                      <button
                        key={g}
                        disabled={isProcessing}
                        onClick={() => handleGrade(r.id, g)}
                        className={`rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-700 transition-all dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 ${color} disabled:opacity-40`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-[#121824]/50 dark:text-slate-400">
            <CheckCircle size={24} className="text-emerald-500" />
            You are all caught up! New reviews will appear automatically based on your learning activity.
          </div>
        )}
      </div>
    </UserShell>
  );
}