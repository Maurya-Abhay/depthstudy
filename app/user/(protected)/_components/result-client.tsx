'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  LayoutDashboard,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

type Result = {
  score: number;
  passed: boolean;
  title: string;
  passing: number;
  certificateCode: string | null;
};

function ResultInner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();

  const attemptId = search.get('attemptId') || '';
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!attemptId || !params?.id) {
      router.replace('/dashboard/tests');
      return;
    }

    fetch(
      `/api/tests/result?id=${encodeURIComponent(params.id)}&attemptId=${encodeURIComponent(attemptId)}`,
      { cache: 'no-store' }
    )
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Unable to load result.');
        setResult(d);
      })
      .catch((e) =>
        setMessage(e instanceof Error ? e.message : 'Unable to load result.')
      );
  }, [attemptId, params?.id, router]);

  async function issueCertificate() {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ attemptId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Unable to issue certificate.');
      } else {
        setResult((current) =>
          current ? { ...current, certificateCode: data.certificateCode } : current
        );
      }
    } catch {
      setMessage('Network error while issuing certificate.');
    } finally {
      setBusy(false);
    }
  }

  /* Loading State */
  if (!result) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0f17] px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#121824] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
            <Sparkles className="animate-spin" size={24} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Assessment Status
          </span>
          <h1 className="mt-1 text-xl font-black text-white">Loading result…</h1>

          {message && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-400">
              <AlertCircle size={16} className="shrink-0" />
              <span>{message}</span>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0f17] px-4 py-12 text-slate-200">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-[#121824] p-6 shadow-2xl sm:p-8">
        {/* Eyebrow & Status Header */}
        <div className="text-center">
          <div
            className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border ${
              result.passed
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
            }`}
          >
            {result.passed ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
          </div>

          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              result.passed ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            Assessment Result
          </span>

          <h1 className="mt-1 text-2xl font-black text-white">
            {result.passed ? 'Passed!' : 'Needs More Practice'}
          </h1>
          <p className="mt-1 text-xs text-slate-400">{result.title}</p>
        </div>

        {/* Score Metric Display */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 text-center shadow-inner">
          <div
            className={`text-4xl font-black font-mono ${
              result.passed ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {result.score}%
          </div>
          <div className="mt-1 text-xs font-medium text-slate-400">
            Passing threshold: <span className="text-slate-200">{result.passing}%</span>
          </div>
        </div>

        {/* Information Notice */}
        <div
          className={`rounded-xl border p-4 text-xs font-medium leading-relaxed ${
            result.passed
              ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
              : 'border-slate-800 bg-slate-900/50 text-slate-400'
          }`}
        >
          {result.passed
            ? 'Your assessment result is saved. Certificate eligibility is checked against your course settings.'
            : 'Review the missed topics and try taking the assessment again when your next attempt becomes available.'}
        </div>

        {/* Error / Feedback Message */}
        {message && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {result.certificateCode ? (
            <Link
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
              href={`/dashboard/certificates/${result.certificateCode}`}
            >
              <Award size={16} />
              <span>View Certificate</span>
            </Link>
          ) : result.passed ? (
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-50"
              onClick={issueCertificate}
              disabled={busy}
            >
              <Award size={16} />
              <span>{busy ? 'Issuing…' : 'Issue Certificate'}</span>
            </button>
          ) : null}

          <div className="grid grid-cols-2 gap-2.5">
            <Link
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
              href="/dashboard/tests"
            >
              <RotateCcw size={14} />
              <span>Back to Tests</span>
            </Link>

            <Link
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
              href="/dashboard"
            >
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResultClient() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#0b0f17] px-4 py-12">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#121824] p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
              <Sparkles className="animate-spin" size={24} />
            </div>
            <h1 className="text-xl font-black text-white">Loading result…</h1>
          </div>
        </main>
      }
    >
      <ResultInner />
    </Suspense>
  );
}