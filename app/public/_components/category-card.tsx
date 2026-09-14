import Link from 'next/link';
import { ArrowUpRight, FolderOpen, Layers } from 'lucide-react';
import type { Category } from '@/types';

interface CategoryCardProps {
  item: Category & {
    topicCount?: number;
    _count?: {
      topics?: number;
    };
  };
}

export function CategoryCard({ item }: CategoryCardProps) {
  const isDsa = item.slug === 'dsa';
  const targetHref = isDsa ? '/dsa' : `/study/category/${item.slug}`;

  // Safe fallback for topic counts coming from different API payloads
  const count = item.topicCount ?? item._count?.topics ?? 0;

  return (
    <Link
      href={targetHref}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-slate-800/80 dark:bg-[#161b22] dark:hover:border-indigo-500/40 dark:hover:shadow-indigo-500/5"
    >
      {/* Top Subtle Gradient Glow Line */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div>
        {/* Header: Icon & Counter Badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/80 transition-colors duration-300 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-900/40 dark:group-hover:bg-indigo-600 dark:group-hover:text-white">
            {item.icon ? (
              <span className="text-2xl leading-none">{item.icon}</span>
            ) : (
              <FolderOpen size={22} />
            )}
          </div>

          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/60 bg-slate-100/80 px-3 py-1 text-[11px] font-bold text-slate-600 dark:border-slate-700/50 dark:bg-slate-800/80 dark:text-slate-300">
            <Layers size={12} className="text-indigo-500" />
            {count} {isDsa ? 'problems' : 'topics'}
          </span>
        </div>

        {/* Title & Description */}
        <div className="mt-5">
          <h3 className="text-lg font-bold text-slate-900 transition-colors duration-200 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
            {item.name}
          </h3>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {item.description || 'Explore structured learning topics, practice problems, and study notes.'}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-indigo-600 dark:border-slate-800/80 dark:text-indigo-400">
        <span>Start Learning</span>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-all duration-200 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/60 dark:text-indigo-400 dark:group-hover:bg-indigo-600 dark:group-hover:text-white">
          <ArrowUpRight
            size={14}
            className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </div>
      </div>
    </Link>
  );
}