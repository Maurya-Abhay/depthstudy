import { Layers } from 'lucide-react';

export function Loading({ label = 'Loading workspace…' }: { label?: string }) {
  return (
    <div className="flex min-h-[180px] w-full flex-col items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400">
      {/* Spinner Container */}
      <div className="relative flex items-center justify-center">
        {/* Glow Accent */}
        <div className="absolute -inset-1.5 rounded-full bg-indigo-500/15 blur-sm dark:bg-indigo-500/20" />

        {/* Outer Spinning Ring */}
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-500/20 border-t-indigo-600 dark:border-indigo-500/30 dark:border-t-indigo-400" />

        {/* Center Icon */}
        <div className="absolute flex h-5 w-5 items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Layers size={13} className="animate-pulse" />
        </div>
      </div>

      {/* Label */}
      <span className="text-[11px] font-medium tracking-wide text-zinc-600 dark:text-zinc-300">
        {label}
      </span>
    </div>
  );
}