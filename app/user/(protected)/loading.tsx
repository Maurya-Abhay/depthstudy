export default function DashboardLoading() {
  return (
    <div
      className="w-full space-y-6 p-2 sm:p-4 animate-pulse"
      aria-label="Loading dashboard"
      role="status"
    >
      {/* Skeleton Hero Banner */}
      <div className="h-44 w-full rounded-2xl border border-slate-800/80 bg-gradient-to-r from-[#121824] via-slate-900/60 to-[#121824] p-6 shadow-xl flex flex-col justify-between">
        <div className="space-y-3">
          <div className="h-4 w-28 rounded-md bg-slate-800" />
          <div className="h-7 w-64 rounded-lg bg-slate-800/80" />
          <div className="h-3.5 w-96 max-w-full rounded-md bg-slate-800/50" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-28 rounded-xl bg-slate-800" />
          <div className="h-8 w-24 rounded-xl bg-slate-800/60" />
        </div>
      </div>

      {/* Skeleton KPI Cards (5 Cards Grid) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-2xl border border-slate-800/80 bg-[#121824] p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 rounded bg-slate-800" />
              <div className="h-7 w-7 rounded-xl bg-slate-800/80" />
            </div>
            <div className="h-6 w-12 rounded-md bg-slate-800" />
            <div className="h-2 w-20 rounded bg-slate-800/50" />
          </div>
        ))}
      </div>

      {/* Skeleton Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-8 space-y-4 rounded-2xl border border-slate-800/80 bg-[#121824] p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
            <div className="h-5 w-40 rounded-md bg-slate-800" />
            <div className="h-4 w-16 rounded bg-slate-800/60" />
          </div>
          <div className="space-y-3">
            <div className="h-16 w-full rounded-xl bg-slate-900/60 border border-slate-800/40" />
            <div className="h-16 w-full rounded-xl bg-slate-900/60 border border-slate-800/40" />
            <div className="h-16 w-full rounded-xl bg-slate-900/60 border border-slate-800/40" />
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:col-span-4 space-y-4 rounded-2xl border border-slate-800/80 bg-[#121824] p-6 shadow-xl">
          <div className="h-5 w-32 rounded-md bg-slate-800" />
          <div className="space-y-3">
            <div className="h-10 w-full rounded-xl bg-slate-900/60" />
            <div className="h-10 w-full rounded-xl bg-slate-900/60" />
            <div className="h-24 w-full rounded-xl bg-slate-900/60" />
          </div>
        </div>
      </div>
    </div>
  );
}