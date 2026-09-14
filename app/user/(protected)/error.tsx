'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    // Console error logging for debugging
    console.error('Dashboard Route Error:', error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] w-full items-center justify-center p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#121824] p-8 text-center shadow-2xl backdrop-blur-xl">
        {/* Top Decorative Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl" />

        <div className="relative space-y-6">
          {/* Error Icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400 shadow-inner">
            <AlertTriangle size={26} />
          </div>

          {/* Heading & Context */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-[10px] font-semibold text-slate-400">
              <LayoutDashboard size={11} />
              <span>Dashboard Boundary</span>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">
              Dashboard Unavailable
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              We could not load your learning data right now. Please try again or refresh the page.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}