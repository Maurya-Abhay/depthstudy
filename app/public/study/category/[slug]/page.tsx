import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { getStudyLibrary } from '@/services/study';

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const library = await getStudyLibrary();

  const categories = library?.categories ?? [];
  const topics = library?.topics ?? [];
  const error = library?.error;

  const category = categories.find((item) => item.slug === slug);

  if (!category || slug === 'dsa') {
    notFound();
  }

  const categoryTopics = topics.filter(
    (topic) => topic.categoryId === category.id,
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-[#0b101d] dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link
            href="/study"
            className="transition hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            Study Library
          </Link>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="text-slate-900 dark:text-slate-200">
            {category.name}
          </span>
        </nav>

        {/* Page Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/80 pb-6 dark:border-slate-800/80">
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-4xl text-slate-900 dark:text-white">
              {category.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {category.description ||
                `Explore ${category.name} through focused learning topics.`}
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-50/60 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400">
            {categoryTopics.length}{' '}
            {categoryTopics.length === 1 ? 'topic' : 'topics'}
          </span>
        </div>

        {/* Topic Grid Section */}
        {error ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <AlertCircle size={28} className="mx-auto mb-2 text-rose-500" />
            <strong className="block text-slate-900 dark:text-white">
              Category content unavailable
            </strong>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              This category is temporarily unavailable. Please try again later.
            </p>
          </div>
        ) : categoryTopics.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categoryTopics.map((topic, index) => {
              const difficulty = topic.difficulty?.toLowerCase();
              const isEasy = difficulty === 'easy';
              const isMedium = difficulty === 'medium';
              const duration = topic.estimatedMinutes ?? (topic as { estimated_minutes?: number }).estimated_minutes ?? 0;

              return (
                <Link
                  key={topic.id}
                  href={`/study/topic/${topic.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-indigo-500/50"
                >
                  <div>
                    {/* Top Row: Counter & Arrow */}
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <ArrowRight
                        size={16}
                        className="text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                      />
                    </div>

                    {/* Metadata Badges */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {topic.difficulty && (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                            isEasy
                              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400'
                              : isMedium
                              ? 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400'
                              : 'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400'
                          }`}
                        >
                          {topic.difficulty}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
                        <Clock size={10} className="text-slate-400" />
                        {duration} min
                      </span>
                    </div>

                    {/* Title & Summary */}
                    <h2 className="mt-3.5 text-base font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                      {topic.title}
                    </h2>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {topic.summary || 'Open this topic to start learning.'}
                    </p>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="mt-5 border-t border-slate-100 pt-3 text-xs font-bold text-indigo-600 dark:border-slate-800/60 dark:text-indigo-400">
                    Start topic
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <BookOpen size={20} />
            </div>
            <div>
              <strong className="block text-sm font-bold text-slate-900 dark:text-white">
                No published topics yet
              </strong>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Published topics under {category.name} will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}