// Shared Tailwind class strings for Light & Dark mode support
// Clean, scalable, compact and modern design token structure.

export const eyebrow =
  'text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400';
export const title =
  'mt-1 text-xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-2xl';
export const subtitle =
  'mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400';
export const small = 'text-[11px] text-zinc-500 dark:text-zinc-400';
export const muted = 'text-zinc-400 dark:text-zinc-500';

export const surface =
  'rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0d111c] shadow-sm';
export const card = `${surface} p-4`;
export const chip =
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300';
export const chipActive =
  'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20';

export const btn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all duration-150 cursor-pointer select-none whitespace-nowrap active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40';
export const btnPrimary = `${btn} bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500`;
export const btnSecondary = `${btn} border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700`;
export const btnDanger = `${btn} border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20`;
export const btnSmall = 'px-2.5 py-1 text-[10px] rounded-md';
export const btnPrimarySmall = `${btnPrimary} ${btnSmall}`;
export const btnSecondarySmall = `${btnSecondary} ${btnSmall}`;
export const iconBtn =
  'inline-flex items-center justify-center h-8 w-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40';
export const textLink =
  'inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold text-xs hover:underline';
export const link =
  'text-indigo-600 dark:text-indigo-400 font-medium hover:underline';

export const notice =
  'flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-[11px] font-medium text-amber-800 dark:text-amber-300';
export const callout =
  'rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/10 p-3.5 text-xs leading-relaxed text-indigo-900 dark:text-indigo-200';
export const emptyBox =
  'rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/30';
export const emptyIcon = 'mb-2 text-zinc-400 dark:text-zinc-500 mx-auto';

export const progressTrack =
  'relative h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200/50 dark:border-white/5';
export const progressBar =
  'block h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300';

export const field = 'flex flex-col gap-1 text-xs font-medium';
export const label =
  'text-[11px] font-semibold text-zinc-700 dark:text-zinc-300';
export const input =
  'rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-900 dark:text-white outline-none transition-all placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50';
export const textarea = `${input} w-full min-h-[100px] leading-relaxed resize-y`;
export const formGrid = 'grid grid-cols-1 sm:grid-cols-2 gap-3';
export const formActions = 'mt-4 flex justify-end gap-2';

export const tableWrap =
  'overflow-x-auto rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0d111c] shadow-sm';
export const th =
  'px-3.5 py-2.5 text-left whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-white/5';
export const td =
  'px-3.5 py-2.5 text-left whitespace-nowrap border-b border-zinc-100 dark:border-white/5 text-xs text-zinc-700 dark:text-zinc-300';
export const listRow =
  'flex items-center justify-between gap-3 border-b border-zinc-100 dark:border-white/5 py-2 text-xs text-zinc-700 dark:text-zinc-300';

export const grid3 = 'grid grid-cols-1 md:grid-cols-3 gap-3';
export const twoCol = 'grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4';
export const statsGrid =
  'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3';
export const stat = `${surface} flex items-center gap-3 p-3.5`;
export const statIcon =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
export const statNum =
  'text-lg font-bold leading-none text-zinc-900 dark:text-white';
export const statLabel =
  'text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5';
export const sectionHead =
  'mb-4 flex flex-wrap items-end justify-between gap-3';
export const dashboardPageTitle = 'mb-4';
export const dashboardPageTitleH1 =
  'm-0 text-lg font-bold text-zinc-900 dark:text-white';
export const dashboardSectionHeading =
  'mb-3 flex items-center justify-between';
export const dashboardSectionHeadingH2 =
  'm-0 text-sm font-bold text-zinc-900 dark:text-white';
export const breadcrumbs =
  'mb-3 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5';
export const metaRow = 'flex flex-wrap items-center gap-2';
export const avatarSm =
  'flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold';

// Dashboard / Shell Layout Tokens
export const dashboardFrame =
  'min-h-screen bg-zinc-50 dark:bg-[#07090e] text-zinc-900 dark:text-zinc-100 flex';
export const dashboardShell = 'flex min-h-screen w-full flex-1';
export const dashboardNavBase =
  'flex w-60 shrink-0 flex-col justify-between overflow-y-auto border-r border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0d111c] p-3.5';
export const dashboardNavDesktop =
  'max-lg:hidden lg:sticky lg:top-0 lg:h-screen';
export const dashboardNavMobile =
  'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#0d111c] shadow-xl';
export const dashboardNav = `${dashboardNavBase} ${dashboardNavDesktop}`;
export const mobileNavBackdrop =
  'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden';
export const dashboardNavTitle =
  'px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400';
export const sideList = 'flex flex-1 flex-col gap-0.5';
export const sideEntry = 'flex flex-col';
export const sideRow = 'flex items-center gap-1';
export const sideLink =
  'flex flex-1 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 transition-all hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40';
export const sideLinkActive =
  'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold';
export const sideToggle =
  'border-none bg-transparent p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-transform';
export const sideToggleExpanded = 'rotate-90';
export const libraryNav = 'flex flex-col gap-0.5 py-1 pl-2';
export const libraryCategory = 'flex flex-col';
export const categoryRow =
  'flex w-full items-center gap-2 rounded-lg p-1.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white';
export const topicItems =
  'flex flex-col pl-3 border-l border-zinc-200 dark:border-zinc-800 ml-2 my-1 gap-0.5';
export const topicLink =
  'rounded-md px-2 py-1 text-[11px] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors';
export const sidebarProfile =
  'flex items-center gap-2.5 rounded-lg border border-zinc-200/80 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 px-2.5 py-1.5 text-[11px] font-medium text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80';
export const sidebarProfileActive =
  'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20';
export const sidebarLogout =
  'flex items-center gap-2 rounded-lg border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors mt-2';
export const dashboardMain =
  'min-w-0 w-full flex-1 px-4 py-5 sm:px-6 lg:px-8 pb-12';
export const adminFooter =
  'border-t border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0d111c] px-6 py-3.5';
export const adminFooterInner =
  'mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400';
export const adminFooterBrand =
  'flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200';
export const adminFooterLink =
  'flex items-center gap-0.5 font-medium text-indigo-600 dark:text-indigo-400 hover:underline';