import { Layers } from 'lucide-react';

export default function Loading() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-zinc-50 text-zinc-900 transition-colors duration-300 dark:bg-[#07090e] dark:text-white">
      {/* Dynamic Background Mesh / Glow Effects */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none dark:bg-indigo-600/15" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full bg-purple-500/10 blur-[80px] pointer-events-none dark:bg-purple-600/15" />

      {/* Main Loader Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Animated Icon & Dual Ring Container */}
        <div className="relative flex items-center justify-center">
          {/* Outer Pulsing Glow Ring */}
          <div className="absolute -inset-2 rounded-full bg-indigo-500/20 blur-md animate-pulse dark:bg-indigo-500/25" />

          {/* Dual Gradient Spinning Ring */}
          <div className="h-12 w-12 animate-spin rounded-full border-[2.5px] border-zinc-200 border-t-indigo-600 border-r-purple-500 dark:border-white/10 dark:border-t-indigo-400 dark:border-r-purple-400" />

          {/* Center Brand Icon */}
          <div className="absolute flex h-6 w-6 items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Layers size={16} className="animate-pulse" />
          </div>
        </div>

        {/* Text Label & Animated Dots */}
        <div className="mt-5 flex items-center gap-1.5">
          <span className="text-xs font-bold tracking-wide text-zinc-700 dark:text-zinc-200">
            Loading Depth Study
          </span>
          <span className="inline-flex gap-0.5">
            <span className="h-1 w-1 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s] dark:bg-indigo-400" />
            <span className="h-1 w-1 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s] dark:bg-indigo-400" />
            <span className="h-1 w-1 rounded-full bg-indigo-600 animate-bounce dark:bg-indigo-400" />
          </span>
        </div>

        <p className="mt-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
          Preparing your workspace
        </p>
      </div>
    </main>
  );
}