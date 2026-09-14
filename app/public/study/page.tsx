import Link from 'next/link';
import { BookOpen, Search, Clock, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { searchStudy, getStudyLibrary } from '@/services/study';
import { CategoryCard } from '@/app/public/_components/category-card';

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function StudyPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = (params.q ?? '').trim();

  // Search Results Layout
  if (query) {
    const results = await searchStudy(query);
    const hasResults =
      results.categories.length > 0 ||
      results.courses.length > 0 ||
      results.topics.length > 0;

    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b101d] dark:text-slate-100 transition-colors">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900 dark:text-white">
              Search results for “<span className="text-indigo-600 dark:text-indigo-400">{query}</span>”
            </h1>
          </div>

          {/* Search Bar */}
          <form method="get" className="mb-10 max-w-xl">
            <div className="group relative flex items-center">
              <Search
                size={18}
                className="absolute left-4 text-slate-400 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400"
              />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search topics, courses or anything..."
                aria-label="Search the learning library"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-28 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500"
              />
              <button
                type="submit"
                className="absolute right-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500 active:scale-95 shadow-sm"
              >
                Search
              </button>
            </div>
          </form>

          {/* Results Grid */}
          {hasResults ? (
            <div className="space-y-10">
              {/* Categories */}
              {results.categories.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Categories ({results.categories.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {results.categories.map((item) => (
                      <Link
                        key={item.id}
                        href={`/study/category/${item.slug}`}
                        className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/60"
                      >
                        <div>
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 transition-colors">
                            {item.name}
                          </h3>
                          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                            {item.description}
                          </p>
                        </div>
                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          Open category <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Courses */}
              {results.courses.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Courses ({results.courses.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {results.courses.map((item) => (
                      <Link
                        key={item.id}
                        href={`/study/courses/${item.slug}`}
                        className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/60"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 transition-colors">
                              {item.title}
                            </h3>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {item.access_type === 'free' ? 'Free' : 'Paid'}
                            </span>
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                            {item.description}
                          </p>
                        </div>
                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          View course <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Topics */}
              {results.topics.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Topics ({results.topics.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {results.topics.map((item) => (
                      <Link
                        key={item.id}
                        href={`/study/topic/${item.slug}`}
                        className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/60"
                      >
                        <div>
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 transition-colors">
                            {item.title}
                          </h3>
                          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                            {item.summary}
                          </p>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {item.difficulty}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <Clock size={10} />
                            {item.estimated_minutes} min
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <AlertCircle size={32} className="mx-auto text-slate-400" />
              <strong className="mt-3 block text-base font-bold text-slate-900 dark:text-white">
                No matches found
              </strong>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Nothing matched “{query}”. Try searching for another topic, course, or keyword.
              </p>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Default Study Library Index Layout
  const { categories = [], topics = [], error } = await getStudyLibrary();
  const hours = topics.length
    ? Math.max(
        1,
        Math.round(
          topics.reduce((sum, topic) => sum + (topic.estimatedMinutes || 0), 0) / 60,
        ),
      )
    : 0;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b101d] dark:text-slate-100 transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header Bar */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-4xl text-slate-900 dark:text-white">
              Explore every learning path.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Find a category or topic and start learning immediately. Public lessons stay readable without an account.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-50/60 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400">
            <Sparkles size={14} />
            <span>{hours}h indexed content</span>
          </div>
        </div>

        {/* Search Bar */}
        <form method="get" className="my-8 max-w-xl">
          <div className="group relative flex items-center">
            <Search
              size={18}
              className="absolute left-4 text-slate-400 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400"
            />
            <input
              name="q"
              placeholder="Search topics, courses or categories..."
              aria-label="Search the learning library"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-28 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500"
            />
            <button
              type="submit"
              className="absolute right-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500 active:scale-95 shadow-sm"
            >
              Search
            </button>
          </div>
        </form>

        {/* Main Content Area */}
        {error ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <AlertCircle size={28} className="mx-auto mb-2 text-slate-400" />
            <strong className="block text-slate-900 dark:text-white">
              Study library unavailable
            </strong>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{error}</p>
          </div>
        ) : categories.length ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} item={category} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <BookOpen size={28} className="mx-auto mb-2 text-slate-400" />
            <strong className="block text-slate-900 dark:text-white">
              No published categories yet
            </strong>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Categories created in the admin portal will appear here automatically.
            </p>
          </div>
        )}

        {/* Quick Stats Footer Section */}
        <div className="mt-12 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Library at a glance
          </span>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-800/40">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <BookOpen size={20} />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {categories.length}
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Total Categories
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/60 dark:bg-slate-800/40">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                <BookOpen size={20} />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {topics.length}
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Total Topics
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}