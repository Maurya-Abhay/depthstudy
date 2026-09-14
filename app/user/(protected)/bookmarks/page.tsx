import Link from 'next/link';
import { Bookmark, ChevronRight, Clock3, Sparkles, BookOpen } from 'lucide-react';
import { UserShell } from '@/app/user/(protected)/_components/user-shell';
import { createServerSupabaseClient } from '@/services/supabase-server';

export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('bookmarks')
    .select('created_at,study_topics(title,slug,summary,estimated_minutes)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const bookmarks = (data ?? [])
    .map((item) => {
      const topic = Array.isArray(item.study_topics)
        ? item.study_topics[0]
        : item.study_topics;
      return { ...item, topic };
    })
    .filter((item) => item.topic?.slug);

  return (
    <UserShell>
      <div className="mx-auto max-w-7xl space-y-3 text-slate-900 dark:text-slate-100">
        {/* Compact Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 dark:border-slate-800/80">
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Bookmarks
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Saved topics for your next focused study session.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
            <Sparkles size={10} /> {bookmarks.length} Total
          </span>
        </div>

        {/* Compact Record Summary Cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
              <Bookmark size={15} />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-bold leading-none text-slate-900 dark:text-white">
                {bookmarks.length}
              </div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Saved Topics
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Clock3 size={15} />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-bold leading-none text-slate-900 dark:text-white">
                Ready
              </div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Next Session
              </div>
            </div>
          </div>
        </div>

        {/* Bookmarks List Container */}
        <section className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800/60">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              Topics to Revisit
            </h2>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              Saved Library
            </span>
          </div>

          {bookmarks.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {bookmarks.map((item) => {
                const topic = item.topic!;
                return (
                  <Link
                    href={`/study/topic/${topic.slug}`}
                    key={topic.slug}
                    className="group flex items-center justify-between gap-2 rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
                        <Bookmark size={13} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <strong className="truncate text-xs font-semibold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                            {topic.title}
                          </strong>
                          {topic.estimated_minutes && (
                            <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                              <Clock3 size={10} />
                              <span>{topic.estimated_minutes}m</span>
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {topic.summary || 'Open this topic to continue learning.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 pl-2">
                      <span className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700 transition-colors group-hover:border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <span>Open</span>
                        <ChevronRight size={11} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* Compact Empty State */
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-500">
                <BookOpen size={18} />
              </span>
              <strong className="text-xs font-bold text-slate-900 dark:text-white">
                No bookmarks saved
              </strong>
              <p className="mt-0.5 max-w-xs text-[11px] text-slate-500 dark:text-slate-400">
                Bookmark topics from the library to quickly find them here.
              </p>
              <Link
                href="/study"
                className="mt-3 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs transition hover:bg-indigo-500"
              >
                Browse Topics
              </Link>
            </div>
          )}
        </section>
      </div>
    </UserShell>
  );
}