'use client';

import { AlertOctagon, RotateCcw } from 'lucide-react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <main className="relative grid min-h-screen place-items-center overflow-hidden bg-zinc-50 p-4 text-zinc-900 transition-colors duration-300 dark:bg-[#07090e] dark:text-white">
          {/* Ambient Glow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-rose-500/10 blur-[120px] pointer-events-none dark:bg-rose-500/15" />

          {/* Main Error Container */}
          <div className="relative z-10 mx-auto w-full max-w-md rounded-3xl border border-zinc-200/80 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl sm:p-10 dark:border-white/10 dark:bg-[#0d111c]/80 dark:shadow-2xl">
            {/* Warning Icon Container */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
              <AlertOctagon size={24} />
            </div>

            {/* Error Subtitle Badge */}
            <span className="mt-5 inline-block rounded-md border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
              System Error
            </span>

            {/* Title & Body */}
            <h1 className="mt-3 text-xl font-extrabold tracking-tight text-zinc-900 sm:text-2xl dark:text-white">
              We couldn't load this page
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              Your learning data is completely safe. Something unexpected happened on our end while rendering this route.
            </p>

            {/* Action Button */}
            <div className="mt-7">
              <button
                type="button"
                onClick={() => reset()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
              >
                <RotateCcw size={14} /> Try again
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}