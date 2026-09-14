export default function Loading() {
  return (
    <main className="flex h-screen overflow-hidden font-sans bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex-col transition-colors">
      {/* Top Header Skeleton */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 bg-white dark:border-white/10 dark:bg-[#07090e] px-4">
        <div className="flex items-center gap-3">
          <div className="h-7 w-20 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-32 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-14 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-6 w-12 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-6 w-16 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </header>

      {/* Main Workspace Skeleton */}
      <div className="flex flex-1 gap-2 p-2 overflow-hidden">
        {/* Sidebar Skeleton */}
        <aside className="flex w-72 shrink-0 flex-col rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#07090e] shadow-sm">
          <div className="flex h-11 items-center border-b border-zinc-200 dark:border-white/10 px-3">
            <div className="h-3.5 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-2.5">
            {/* Progress Card Skeleton */}
            <div className="h-20 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5" />
            {/* Category Accordions Skeleton */}
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-zinc-200 dark:border-white/5 p-2 space-y-2">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="space-y-1 pt-1">
                    <div className="h-7 w-full animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-900" />
                    <div className="h-7 w-full animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-900" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Content Body Skeleton */}
        <main className="flex flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#07090e] shadow-sm">
          {/* Workspace Action Bar */}
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50/80 dark:border-white/10 dark:bg-zinc-900/40 px-4">
            <div className="h-4 w-52 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-8 w-16 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-8 w-24 animate-pulse rounded-md bg-indigo-500/30 dark:bg-indigo-600/30" />
            </div>
          </div>

          {/* Body Content Blocks */}
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {/* Quick jump tags placeholder */}
            <div className="flex gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-6 w-16 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
              ))}
            </div>

            {/* Content Sections Placeholder */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3 pt-2">
                <div className="h-5 w-36 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
                  <div className="h-4 w-11/12 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </main>
  );
}