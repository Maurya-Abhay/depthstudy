import Link from 'next/link';
import { Layers, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 text-center text-zinc-900 overflow-hidden transition-colors duration-300 dark:bg-[#07090e] dark:text-white">
      {/* Background Radial Glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none dark:bg-indigo-600/15" />

      <div className="relative z-10 mx-auto w-full max-w-md rounded-3xl border border-zinc-200/80 bg-white/80 p-8 shadow-xl backdrop-blur-xl sm:p-10 dark:border-white/10 dark:bg-[#0d111c]/80 dark:shadow-2xl">
        {/* Brand Icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-600 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400">
          <Layers size={24} />
        </div>

        {/* 404 Badge */}
        <span className="mt-5 inline-block rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
          404 Error
        </span>

        {/* Title & Description */}
        <h1 className="mt-3 text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
          Page not found
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          The page or learning module you are looking for does not exist or has been moved.
        </p>

        {/* Back Button */}
        <div className="mt-7">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
          >
            <ArrowLeft size={15} /> Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}