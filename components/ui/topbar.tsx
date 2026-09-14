'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Layers,
  Search,
  Sun,
  Moon,
  LogIn,
  LogOut,
  UserRound,
  Menu,
  X,
  Bell,
  ChevronDown,
  Sparkles,
  BookOpen,
  Code2,
  Home,
  Info,
  CheckCheck,
} from 'lucide-react';
import { createBrowserSupabaseClient } from '@/services/supabase-browser';
import { useToast } from '@/components/ui/toast-provider';
import { useTheme } from '@/components/ui/theme-provider';
import { useConfirm } from '@/components/ui/confirm-dialog';

// Helper component for Avatar Badge
function UserAvatar({ initials, name }: { initials: string; name: string }) {
  return (
    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-[11px] font-extrabold text-white shadow-md shadow-indigo-500/20 ring-2 ring-white/20 dark:ring-white/10">
      {initials}
      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-950" />
    </div>
  );
}

function AppTopbarRight(props: {
  theme: 'light' | 'dark';
  onTheme: () => void;
  notifOpen: boolean;
  onNotif: () => void;
  onCloseNotif: () => void;
  count: number;
  items: Array<{ id: string; title: string; message: string }>;
  initials: string;
  userName: string;
  userRole: string;
  onLogout: () => void;
  profileHref: string;
  notificationsHref: string;
}) {
  const {
    theme,
    onTheme,
    notifOpen,
    onNotif,
    onCloseNotif,
    count,
    items,
    initials,
    userName,
    userRole,
    onLogout,
    profileHref,
    notificationsHref,
  } = props;

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Theme Toggle */}
      <button
        type="button"
        onClick={onTheme}
        title="Toggle Theme"
        className="group flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50/50 text-zinc-600 backdrop-blur-md transition-all duration-200 hover:border-indigo-300 hover:bg-white hover:text-indigo-600 hover:shadow-sm dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:border-indigo-500/30 dark:hover:bg-zinc-800 dark:hover:text-indigo-400"
      >
        {theme === 'dark' ? (
          <Sun size={16} className="transition-transform duration-300 group-hover:rotate-45" />
        ) : (
          <Moon size={16} className="transition-transform duration-300 group-hover:-rotate-12" />
        )}
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          type="button"
          onClick={onNotif}
          title="Notifications"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50/50 text-zinc-600 backdrop-blur-md transition-all duration-200 hover:border-indigo-300 hover:bg-white hover:text-indigo-600 hover:shadow-sm dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:border-indigo-500/30 dark:hover:bg-zinc-800 dark:hover:text-indigo-400"
        >
          <Bell size={16} />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-extrabold text-white shadow-md shadow-rose-500/30 ring-2 ring-white dark:ring-zinc-950">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </button>

        {notifOpen && (
          <>
            <div
              onClick={onCloseNotif}
              className="fixed inset-0 z-40 bg-transparent"
              aria-hidden="true"
            />
            <div className="absolute right-0 z-50 mt-3 w-80 animate-in fade-in slide-in-from-top-2 duration-200 rounded-2xl border border-zinc-200/80 bg-white/95 p-3 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0f19]/95">
              <div className="mb-2 flex items-center justify-between border-b border-zinc-100 pb-2.5 px-1 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">Notifications</span>
                  {count > 0 && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                      {count} new
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onCloseNotif}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X size={13} />
                </button>
              </div>

              <div className="max-h-[280px] space-y-1 overflow-y-auto pr-0.5">
                {items.length ? (
                  items.map((n) => (
                    <Link
                      key={n.id}
                      href={notificationsHref}
                      onClick={onCloseNotif}
                      className="group flex items-start gap-3 rounded-xl p-2.5 transition-all hover:bg-indigo-50/50 dark:hover:bg-white/5"
                    >
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600 ring-4 ring-indigo-100 dark:ring-indigo-950" />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-zinc-800 group-hover:text-indigo-600 dark:text-zinc-200 dark:group-hover:text-indigo-400">
                          {n.title}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-relaxed text-zinc-500 line-clamp-2 dark:text-zinc-400">
                          {n.message}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCheck size={28} className="mb-2 text-zinc-300 dark:text-zinc-600" />
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">You're all caught up!</p>
                  </div>
                )}
              </div>

              <Link
                href={notificationsHref}
                onClick={onCloseNotif}
                className="mt-2 block w-full rounded-xl bg-zinc-900 py-2 text-center text-xs font-semibold text-white transition-all hover:bg-indigo-600 dark:bg-white dark:text-zinc-900 dark:hover:bg-indigo-500 dark:hover:text-white"
              >
                View all notifications
              </Link>
            </div>
          </>
        )}
      </div>

      <div className="h-4 w-[1px] bg-zinc-200 dark:bg-white/10" />

      {/* User Menu */}
      <div className="relative" ref={userMenuRef}>
        <button
          type="button"
          onClick={() => setUserDropdownOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-1.5 pr-3 backdrop-blur-md transition-all duration-200 hover:border-zinc-300 hover:bg-white dark:border-white/10 dark:bg-zinc-900/50 dark:hover:bg-zinc-800"
        >
          <UserAvatar initials={initials} name={userName} />
          <div className="hidden min-w-0 text-left leading-tight sm:block">
            <span className="block max-w-[120px] truncate text-xs font-bold text-zinc-800 dark:text-zinc-100">
              {userName}
            </span>
            <span className="block text-[10px] font-medium capitalize text-zinc-400 dark:text-zinc-500">
              {userRole}
            </span>
          </div>
          <ChevronDown
            size={13}
            className={`text-zinc-400 transition-transform duration-200 ${
              userDropdownOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </button>

        {userDropdownOpen && (
          <div className="absolute right-0 z-50 mt-2 w-52 animate-in fade-in slide-in-from-top-2 duration-150 rounded-2xl border border-zinc-200/80 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0f19]/95">
            <div className="mb-1 rounded-xl bg-zinc-50 p-2.5 dark:bg-white/5 sm:hidden">
              <p className="truncate text-xs font-bold text-zinc-900 dark:text-white">{userName}</p>
              <p className="text-[10px] capitalize text-zinc-400">{userRole}</p>
            </div>

            <Link
              href={profileHref}
              onClick={() => setUserDropdownOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-zinc-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
            >
              <UserRound size={15} /> Profile Settings
            </Link>

            <button
              type="button"
              onClick={() => {
                setUserDropdownOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type TopbarProps = {
  onMenuClick?: () => void;
  mobileMenuOpen?: boolean;
  variant?: 'public' | 'app';
  userName?: string;
  userRole?: string;
  homeHref?: string;
  profileHref?: string;
  notificationsHref?: string;
};

export function Topbar({
  onMenuClick,
  mobileMenuOpen = false,
  variant = 'public',
  userName = 'Learner',
  userRole = 'Student',
  homeHref = '/dashboard',
  profileHref = '/profile',
  notificationsHref = '/dashboard/notifications',
}: TopbarProps) {
  const confirm = useConfirm();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifItems, setNotifItems] = useState<Array<{ id: string; title: string; message: string }>>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [profileName, setProfileName] = useState(userName);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    setProfileName(userName);
  }, [userName]);

  useEffect(() => {
    if (variant !== 'app') return;
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
          const name = profile?.name?.trim() || user.email?.split('@')[0] || 'Learner';
          setProfileName(name);
        });
    });

    fetch('/api/notifications')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (!mounted) return;
        setNotifItems((d.notifications ?? []).slice(0, 5));
        setNotifCount(d.unread ?? 0);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [variant]);

  useEffect(() => {
    let mounted = true;
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setIsAuthenticated(Boolean(data.session));
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setIsAuthenticated(Boolean(session));
    });
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    if (
      !(await confirm({
        title: 'Log out?',
        message: 'Are you sure you want to end your current session?',
        confirmLabel: 'Log out',
        danger: true,
      }))
    )
      return;
    await createBrowserSupabaseClient().auth.signOut();
    setIsAuthenticated(false);
    router.push('/login');
    router.refresh();
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    if (query.trim()) {
      router.push(`/study?q=${encodeURIComponent(query.trim())}`);
    }
  }

  const navLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Courses', href: '/study/courses', icon: BookOpen },
    { name: 'Notes', href: '/study', icon: Sparkles },
    { name: 'DSA', href: '/dsa', icon: Code2 },
    { name: 'About', href: '/about', icon: Info },
  ];

  const initials =
    profileName
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'L';

  // -------------------------------------------------------------
  // App Topbar Layout
  // -------------------------------------------------------------
  if (variant === 'app') {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-[#07090e]/70">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 text-zinc-600 transition hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 md:hidden"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {/* Search Input Field */}
            <form onSubmit={submitSearch} className="relative min-w-0 flex-1 sm:max-w-md">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors focus-within:text-indigo-600"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search topics, notes or algorithms..."
                className="h-9 w-full rounded-xl border border-zinc-200/80 bg-zinc-100/60 pl-10 pr-14 text-xs font-medium text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-zinc-900/60 dark:text-white dark:placeholder-zinc-500 dark:focus:border-indigo-500/50 dark:focus:bg-zinc-900"
              />
              <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-zinc-400 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500 sm:inline-flex">
                ⌘K
              </kbd>
            </form>
          </div>

          <AppTopbarRight
            theme={theme}
            onTheme={toggle}
            notifOpen={notifOpen}
            onNotif={() => setNotifOpen((v) => !v)}
            onCloseNotif={() => setNotifOpen(false)}
            count={notifCount}
            items={notifItems}
            initials={initials}
            userName={profileName}
            userRole={userRole}
            onLogout={logout}
            profileHref={profileHref}
            notificationsHref={notificationsHref}
          />
        </div>
      </header>
    );
  }

  // -------------------------------------------------------------
  // Public Topbar Layout
  // -------------------------------------------------------------
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-[#07090e]/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        
        {/* Brand Logo & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 text-zinc-600 transition hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 md:hidden"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20 transition-transform duration-300 group-hover:scale-105">
              <Layers size={18} />
            </span>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-zinc-900 dark:text-white">
                Depth Study
              </span>
              <span className="hidden text-[9px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 sm:inline-block">
                Learning Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden items-center gap-1 rounded-full border border-zinc-200/60 bg-zinc-50/50 p-1 backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/40 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-800 dark:text-white'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'opacity-70'} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search */}
          <form onSubmit={submitSearch} className="relative hidden lg:block">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Quick search..."
              className="h-9 w-40 rounded-full border border-zinc-200/80 bg-zinc-100/60 pl-8 pr-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:w-56 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-zinc-900/50 dark:text-white dark:focus:border-indigo-500/50 dark:focus:bg-zinc-900"
            />
          </form>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50/50 text-zinc-600 backdrop-blur-md transition-all duration-200 hover:border-indigo-300 hover:bg-white hover:text-indigo-600 hover:shadow-sm dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:border-indigo-500/30 dark:hover:bg-zinc-800 dark:hover:text-indigo-400"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Auth State Actions */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="hidden items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-zinc-50/50 px-3.5 py-2 text-xs font-semibold text-zinc-700 transition-all hover:bg-white hover:shadow-xs dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:inline-flex"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200/80 bg-rose-50/50 px-3.5 py-2 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
              >
                <LogOut size={14} /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-zinc-50/50 px-3.5 py-2 text-xs font-semibold text-zinc-700 backdrop-blur-md transition-all hover:border-zinc-300 hover:bg-white dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <LogIn size={14} /> Login
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:opacity-95 hover:shadow-lg hover:shadow-indigo-500/30"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}