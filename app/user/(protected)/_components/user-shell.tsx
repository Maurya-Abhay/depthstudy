'use client';

import Link from 'next/link';
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  LayoutDashboard,
  ListChecks,
  LogOut,
  BrainCircuit,
  Award,
  FolderKanban,
  Sparkles,
  Route,
  UserRound,
  ShieldCheck,
  RotateCcw,
  X,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Topbar } from '@/components/ui/topbar';
import { createBrowserSupabaseClient } from '@/services/supabase-browser';
import { useConfirm } from '@/components/ui/confirm-dialog';

const userLinks = [
  ['/dashboard', 'Dashboard', LayoutDashboard],
  ['/dashboard/courses', 'My Courses', FolderKanban],
  ['/dashboard/notes', 'Notes', Sparkles],
  ['/dashboard/dsa', 'DSA', BrainCircuit],
  ['/dashboard/tests', 'Tests', ListChecks],
  ['/dashboard/bookmarks', 'Bookmarks', BookOpen],
  ['/dashboard/schedule', 'Schedule', CalendarDays],
  ['/dashboard/notifications', 'Notifications', Bell],
  ['/dashboard/progress', 'Progress', BarChart3],
  ['/dashboard/roadmap', 'Roadmap', Route],
  ['/dashboard/certificates', 'Certificates', Award],
  ['/dashboard/reviews', 'Reviews', RotateCcw],
  ['/dashboard/projects', 'Projects', FolderKanban],
  ['/dashboard/interview', 'Interview', ShieldCheck],
] as const;

export function UserShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const confirm = useConfirm();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isLinkActive = (href: string) =>
    href === '/dashboard'
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const [dsaOpen, setDsaOpen] = useState(pathname.startsWith('/dashboard/dsa'));
  const [expandedDsaTopic, setExpandedDsaTopic] = useState('');
  const [dsaTopics, setDsaTopics] = useState<Array<{ id: string; name: string }>>([]);
  const [dsaProblems, setDsaProblems] = useState<
    Array<{ id: string; topicId?: string; title: string; slug: string }>
  >([]);
  const [profileName, setProfileName] = useState('Learner');

  useEffect(() => {
    let mounted = true;
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!mounted || !user) return;
      supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          if (!mounted) return;
          setProfileName(profile?.name?.trim() || user.email?.split('@')[0] || 'Learner');
        });
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function logout() {
    if (
      !(await confirm({
        title: 'Log out?',
        message: 'Your current session will be ended.',
        confirmLabel: 'Log out',
        danger: true,
      }))
    )
      return;
    await createBrowserSupabaseClient().auth.signOut();
    router.push('/login');
    router.refresh();
  }

  useEffect(() => {
    setMobileNavOpen(false);
    setDsaOpen(pathname.startsWith('/dashboard/dsa'));
  }, [pathname]);

  useEffect(() => {
    if (!dsaOpen || dsaTopics.length) return;
    fetch('/api/dsa-library')
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        const rawTopics: Array<{ id: string; name: string }> = data.topics ?? [];
        const uniqueTopics = Array.from(
          new Map(rawTopics.map((item) => [item.id, item])).values()
        );
        setDsaTopics(uniqueTopics);
        setDsaProblems(data.problems ?? []);
      })
      .catch(() => undefined);
  }, [dsaOpen, dsaTopics.length]);

  const sidebarNavContent = (
    <div className="flex flex-col justify-between h-full space-y-1">
      {/* Brand Header & Main Nav Links */}
      <div className="space-y-1 min-h-0 flex flex-col flex-1">
        {/* Brand Section */}
        <div className="pb-1 border-b border-zinc-200/80 dark:border-white/10 shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-2 py-1 group rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm shadow-indigo-600/30 shrink-0 group-hover:scale-105 transition-transform">
              <LayoutDashboard className="w-4 h-4" />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                Depth Study
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                Learning Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800">
          {userLinks.map(([href, label, Icon]) => {
            const active = isLinkActive(href);
            return (
              <div key={href} className="space-y-1">
                <div className="relative flex items-center">
                  <Link
                    href={href}
                    className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11px] font-medium transition-all group flex-1 ${
                      active
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r-full" />
                    )}
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110 ${
                        active ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'
                      }`}
                    />
                    <span className="truncate min-w-0 flex-1">{label}</span>
                  </Link>

                  {label === 'DSA' && (
                    <button
                      type="button"
                      className={`p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors ml-1 ${
                        dsaOpen ? 'text-indigo-600 dark:text-indigo-400' : ''
                      }`}
                      onClick={() => setDsaOpen((value) => !value)}
                      aria-label={`${dsaOpen ? 'Collapse' : 'Expand'} DSA topics`}
                      aria-expanded={dsaOpen}
                    >
                      <ChevronRight
                        size={13}
                        className={`transition-transform duration-200 ${dsaOpen ? 'rotate-90' : ''}`}
                      />
                    </button>
                  )}
                </div>

                {/* Collapsible Sub-menu for DSA */}
                {label === 'DSA' && dsaOpen && (
                  <div className="pl-3 mt-1.5 space-y-1.5 border-l border-zinc-200 dark:border-white/10 ml-3">
                    {dsaTopics.map((dsaTopic) => {
                      const topicProblems = dsaProblems.filter(
                        (problem) => problem.topicId === dsaTopic.id
                      );
                      const expanded = expandedDsaTopic === dsaTopic.id;

                      return (
                        <div className="space-y-1" key={dsaTopic.id}>
                          <button
                            type="button"
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            onClick={() =>
                              setExpandedDsaTopic(expanded ? '' : dsaTopic.id)
                            }
                          >
                            <span className="flex-1 truncate text-left font-medium">
                              {dsaTopic.name}
                            </span>
                            <span className="rounded-full bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-600 dark:text-zinc-400 mx-1">
                              {topicProblems.length}
                            </span>
                            <ChevronRight
                              size={11}
                              className={`transition-transform duration-200 ${
                                expanded
                                  ? 'rotate-90 text-indigo-600 dark:text-indigo-400'
                                  : 'text-zinc-400 dark:text-zinc-500'
                              }`}
                            />
                          </button>

                          {expanded && (
                            <div className="pl-2.5 space-y-1 mt-1">
                              {topicProblems.map((problem) => (
                                <Link
                                  href={`/dashboard/dsa?problem=${encodeURIComponent(
                                    problem.slug
                                  )}`}
                                  key={problem.id}
                                  className="block px-2 py-1 rounded text-[10px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors truncate"
                                >
                                  {problem.title}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Sign Out Actions */}
      <div className="pt-3 border-t border-zinc-200/80 dark:border-white/10 space-y-2 shrink-0 bg-white dark:bg-[#0d111c]">
        <Link
          href="/profile"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
            pathname === '/profile'
              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[9px] font-bold shadow-2xs">
            <UserRound className="w-3 h-3" />
          </span>
          <span className="truncate flex-1 font-medium">Profile Settings</span>
        </Link>

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200 dark:hover:border-rose-500/20 text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 transition-all text-left group shadow-2xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase shadow-2xs">
              {(profileName[0] ?? 'L').toUpperCase()}
            </span>
            <div className="min-w-0 truncate">
              <span className="block truncate text-[11px] font-semibold text-zinc-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 leading-tight">
                {profileName}
              </span>
              <span className="block text-[9px] font-medium text-zinc-400 uppercase tracking-wide leading-none mt-0.5">
                Student
              </span>
            </div>
          </div>
          <LogOut className="w-3.5 h-3.5 text-zinc-400 group-hover:text-rose-500 shrink-0 transition-colors" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-[#07090e] text-zinc-900 dark:text-zinc-100 font-sans text-xs antialiased flex flex-col">
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-30 border-r border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#0d111c] p-3.5 shadow-2xs"
        aria-label="Learning navigation"
      >
        {sidebarNavContent}
      </aside>

      {/* Main Container Area */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-64 min-h-screen">
        <Topbar
          variant="app"
          onMenuClick={() => setMobileNavOpen((value) => !value)}
          mobileMenuOpen={mobileNavOpen}
        />

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-2xs transition-opacity"
              onClick={() => setMobileNavOpen(false)}
              aria-hidden="true"
            />
            <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#0d111c] border-r border-zinc-200 dark:border-white/10 p-4 shadow-2xl z-50 flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-200 dark:border-white/10">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Menu
                </span>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0">{sidebarNavContent}</div>
            </aside>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-3 md:p-4 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#0d111c] py-3.5 px-4 md:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Depth Study Learning</span>
            </div>
            <span>© 2026 Depth Study. All rights reserved.</span>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              <span>Dashboard</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}