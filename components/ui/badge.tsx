import type { HTMLAttributes } from 'react';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

const tones: Record<Tone, string> = {
  default:
    'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-white/10',
  success:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  warning:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  danger:
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  info:
    'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
  purple:
    'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
};

export function Badge({
  tone = 'default',
  className = '',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wide transition-colors ${tones[tone]} ${className}`}
      {...props}
    />
  );
}