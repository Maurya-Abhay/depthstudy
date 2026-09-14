import Link from 'next/link';
import { ArrowUpRight, BookOpen, LockKeyhole, ShieldCheck } from 'lucide-react';

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  access_type: 'free' | 'paid' | string;
  price?: number;
};

export function CourseCard({ course }: { course: Course }) {
  const isPaid = course.access_type === 'paid';

  return (
    <Link
      href={`/study/courses/${course.slug}`}
      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-indigo-500/50"
    >
      <div>
        {/* Banner Header */}
        <div className="flex h-24 items-center justify-between bg-gradient-to-br from-indigo-50 via-purple-50 to-transparent px-5 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-transparent">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <BookOpen size={20} />
          </span>

          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
              isPaid
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-emerald-500 text-white shadow-sm'
            }`}
          >
            {isPaid ? 'Pro' : 'Free'}
          </span>
        </div>

        {/* Card Content */}
        <div className="p-5">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isPaid
                  ? 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400'
                  : 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400'
              }`}
            >
              {isPaid ? (
                <>
                  <LockKeyhole size={11} /> ₹{course.price ?? 0}
                </>
              ) : (
                'Open access'
              )}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
              <ShieldCheck size={11} /> Guided path
            </span>
          </div>

          {/* Title & Description */}
          <h3 className="mt-3.5 text-base font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
            {course.title}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {course.description ||
              'A structured learning path built from published Depth Study topics.'}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 text-xs font-bold text-indigo-600 dark:border-slate-800/60 dark:text-indigo-400">
        <span>View course</span>
        <ArrowUpRight
          size={15}
          className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </div>
    </Link>
  );
}