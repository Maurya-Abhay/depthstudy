'use client';

import Link from 'next/link';
import { WifiOff, RefreshCw, Home } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900 dark:bg-[#0d1117] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#161b22] sm:p-8">
        
        {/* Warning Icon Badge */}
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/50">
          <WifiOff size={22} />
        </div>

        {/* Content */}
        <div className="mt-4">
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Connection Unavailable
          </span>
          <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            You&apos;re Offline
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Depth Study can still open cached public pages. Reconnect to internet to load fresh lessons, progress, and account data.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-500 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 sm:w-auto dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white sm:w-auto"
          >
            <Home size={14} />
            <span>Back Home</span>
          </Link>
        </div>

      </div>
    </main>
  );
}