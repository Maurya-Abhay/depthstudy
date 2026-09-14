import type { HTMLAttributes } from 'react';

export function Card({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200/80 bg-white/70 p-5 shadow-xs backdrop-blur-md transition-all duration-300 hover:border-zinc-300 dark:border-white/10 dark:bg-[#0b0f19]/80 dark:shadow-2xl dark:hover:border-white/20 ${className}`}
      {...props}
    />
  );
}

export function CardHeader({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col space-y-1.5 pb-3 ${className}`} {...props} />;
}

export function CardTitle({
  className = '',
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-base font-bold tracking-tight text-zinc-900 dark:text-white ${className}`}
      {...props}
    />
  );
}

export function CardDescription({
  className = '',
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-xs text-zinc-500 dark:text-zinc-400 ${className}`}
      {...props}
    />
  );
}

export function CardContent({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`pt-1 ${className}`} {...props} />;
}

export function CardFooter({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center pt-4 border-t border-zinc-100 dark:border-white/5 ${className}`}
      {...props}
    />
  );
}