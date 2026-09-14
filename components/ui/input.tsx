import type { InputHTMLAttributes } from 'react';

export function Input({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-zinc-200/80 bg-zinc-50/50 px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900/50 dark:text-white dark:placeholder-zinc-500 dark:focus:border-indigo-500/50 dark:focus:bg-zinc-900 ${className}`}
      {...props}
    />
  );
}