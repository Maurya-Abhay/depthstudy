'use client';

import Link from 'next/link';
import {
  Award,
  BarChart3,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  DatabaseBackup,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Route,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
  Building2,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Topbar } from '@/components/ui/topbar';
import { createBrowserSupabaseClient } from '@/services/supabase-browser';
import { useConfirm } from '@/components/ui/confirm-dialog';

const adminLinks = [
  ['/admin', 'Dashboard', LayoutDashboard],
  ['/admin/categories', 'Categories', FolderKanban],
  ['/admin/topics', 'Topics', BookOpen],
  ['/admin/courses', 'Courses', FolderKanban],
  ['/admin/roadmaps', 'Roadmaps', Route],
  ['/admin/questions', 'Questions', ListChecks],
  ['/admin/tests', 'Tests', ListChecks],
  ['/admin/dsa', 'DSA Problems', BrainCircuit],
  ['/admin/users', 'Users', Users],
  ['/admin/certificates', 'Certificates', Award],
  ['/admin/backup', 'Database Backup', DatabaseBackup],
  ['/admin/ai', 'AI Studio', Sparkles],
  ['/admin/analytics', 'Analytics', BarChart3],
  ['/admin/audit', 'Audit Log', ScrollText],
  ['/admin/settings', 'Settings', Settings],
  ['/admin/organizations', 'Organizations', Building2],
  ['/admin/content-quality', 'Content Quality', ShieldCheck],
  ['/admin/product-health', 'Product Health', ShieldCheck],
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const confirm = useConfirm();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileName, setProfileName] = useState('Admin');

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
          setProfileName(profile?.name?.trim() || user.email?.split('@')[0] || 'Admin');
        });
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const isLinkActive = (href: string) =>
    href === '/admin'
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  async function logout() {
    if (
      !(await confirm({
        title: 'Log out?',
        message: 'Your current session will be ended.',
        confirmLabel: 'Log out',
        danger: true,
      }))
    ) {
      return;
    }

    await createBrowserSupabaseClient().auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const sidebarNavContent = (
    <div className="flex flex-col justify-between h-full space-y-3">
      {/* Brand Header & Main Nav Links */}
      <div className="space-y-3 min-h-0 flex flex-col">
        {/* Brand Section */}
        <div className="pb-1 border-b border-zinc-200/80 dark:border-white/10 shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5 px-2 py-1 group rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm shadow-indigo-500/30 shrink-0 group-hover:scale-105 transition-transform">
              <LayoutDashboard className="w-4 h-4" />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                Depth Study
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                Admin Control
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800">
          {adminLinks.map(([href, label, Icon]) => {
            const active = isLinkActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-medium transition-all group ${
                  active
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r-full" />
                )}
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'}`} />
                <span className="truncate min-w-0">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Sign Out Actions */}
      <div className="pt-1 border-t border-zinc-200/80 dark:border-white/10 space-y-1 shrink-0 bg-white dark:bg-[#0d111c]">
        <Link
          href="/admin/profile"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
            pathname === '/admin/profile'
              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-[9px] font-bold shadow-xs">
            <UserRound className="w-3 h-3" />
          </span>
          <span className="truncate flex-1 font-medium">Profile Settings</span>
        </Link>

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-between gap-2 px-3 py-1 rounded-lg bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200 dark:hover:border-rose-500/20 text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 transition-all text-left group shadow-2xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase shadow-xs">
              {(profileName[0] ?? 'A').toUpperCase()}
            </span>
            <div className="min-w-0 truncate">
              <span className="block truncate text-[11px] font-semibold text-zinc-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 leading-tight">
                {profileName}
              </span>
              <span className="block text-[9px] font-medium text-zinc-400 uppercase tracking-wide leading-none mt-0.5">
                Administrator
              </span>
            </div>
          </div>
          <LogOut className="w-3.5 h-3.5 text-zinc-400 group-hover:text-rose-500 shrink-0 transition-colors" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-[#07090e] text-zinc-900 dark:text-zinc-100 font-sans text-xs antialiased">
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-30 border-r border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#0d111c] p-3.5 shadow-xs"
        aria-label="Admin navigation"
      >
        {sidebarNavContent}
      </aside>

      {/* Main Container */}
      <div className="flex flex-col md:pl-64 min-h-screen">
        <Topbar
          variant="app"
          onMenuClick={() => setMobileNavOpen((value) => !value)}
          mobileMenuOpen={mobileNavOpen}
          userName={profileName}
          userRole="Admin"
          homeHref="/admin"
          profileHref="/admin/profile"
          notificationsHref="/admin/audit"
        />

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileNavOpen(false)}
              aria-hidden="true"
            />
            <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#0d111c] border-r border-zinc-200 dark:border-white/10 p-4 shadow-2xl z-50 flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-200 dark:border-white/10">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Admin Navigation
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

        {/* Admin Footer */}
        <footer className="mt-auto border-t border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#0d111c] py-3.5 px-4 md:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Depth Study Admin Control</span>
            </div>
            <span>© 2026 Depth Study. All rights reserved.</span>
            <Link
              href="/admin"
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