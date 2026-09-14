import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:
    'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 active:scale-[0.98] dark:bg-indigo-600 dark:hover:bg-indigo-500',
  gradient:
    'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 hover:opacity-90 active:scale-[0.98]',
  secondary:
    'border border-zinc-200 bg-white text-zinc-800 shadow-sm hover:bg-zinc-50 active:scale-[0.98] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/80',
  ghost:
    'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98] dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white',
  danger:
    'border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-[0.98] dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[11px] gap-1.5 rounded-lg',
  md: 'px-4 py-2 text-xs gap-2 rounded-xl',
  lg: 'px-5 py-2.5 text-sm gap-2.5 rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}