'use client';

import Link from 'next/link';
import { ReactNode, Suspense, useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronRight,
  Code2,
  Compass,
  Home,
  Layers3,
  LogIn,
  LogOut,
  Moon,
  Search,
  Sparkles,
  Sun,
  Tags,
  UserRound,
  X,
  Zap,
} from 'lucide-react';

import { Topbar } from '@/components/ui/topbar';
import { Footer } from '@/components/ui/footer';
import { createBrowserSupabaseClient } from '@/services/supabase-browser';
import { useConfirm } from '@/components/ui/confirm-dialog';
import type { Category, DsaProblem, Topic } from '@/types';

const links = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
    exact: true,
  },
  {
    href: '/study',
    label: 'Explore Library',
    icon: Compass,
    exact: true,
  },
] as const;

type PublicShellProps = {
  children: ReactNode;
  categories?: Category[];
  topics?: Topic[];
  dsaTopics?: Array<{ id: string; name: string; slug: string }>;
  dsaProblems?: Array<Pick<DsaProblem, 'id' | 'topicId' | 'title' | 'slug' | 'difficulty'>>;
};

export function PublicShell(props: PublicShellProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      }
    >
      <PublicShellInner {...props} />
    </Suspense>
  );
}

const navLinkBase =
  'group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-300';
const navLinkActive =
  'bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 font-bold shadow-sm backdrop-blur-md';
const navLinkIdle =
  'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100';

function PublicShellInner({
  children,
  categories = [],
  topics = [],
  dsaTopics = [],
  dsaProblems = [],
}: PublicShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const confirm = useConfirm();
  const [, startTransition] = useTransition();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [searchQuery, setSearchQuery] = useState('');

  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [dsaOpen, setDsaOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string>('');
  const [expandedDsaTopic, setExpandedDsaTopic] = useState<string>('');

  useEffect(() => {
    const matchedCategory = categories.find((cat) => {
      const catTopics = topics.filter((t) => t.categoryId === cat.id);
      return (
        pathname === `/study/category/${cat.slug}` ||
        catTopics.some((t) => pathname === `/study/topic/${t.slug}`)
      );
    });

    if (matchedCategory) {
      setExpandedCategory(matchedCategory.id);
      setCategoriesOpen(true);
    }

    if (pathname.startsWith('/dsa')) {
      setDsaOpen(true);
    }
  }, [pathname, categories, topics]);

  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  useEffect(() => {
    let isSubscribed = true;
    const supabase = createBrowserSupabaseClient();

    supabase.auth.getSession().then(({ data }) => {
      if (isSubscribed) setIsAuthenticated(Boolean(data.session));
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isSubscribed) setIsAuthenticated(Boolean(session));
    });

    return () => {
      isSubscribed = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const closeMobileMenu = () => setMobileOpen(false);

  async function handleLogout() {
    const isConfirmed = await confirm({
      title: 'Sign out of your account?',
      message: 'You will need to log back in to access your saved progress.',
      confirmLabel: 'Sign Out',
      danger: true,
    });

    if (!isConfirmed) return;

    await createBrowserSupabaseClient().auth.signOut();
    setIsAuthenticated(false);
    closeMobileMenu();
    startTransition(() => {
      router.push('/login');
      router.refresh();
    });
  }

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#080d1a] dark:text-slate-100">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />

      <Topbar
        onMenuClick={() => setMobileOpen((prev) => !prev)}
        mobileMenuOpen={mobileOpen}
      />

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-md transition-all duration-300 lg:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-in-out dark:border-slate-800/80 dark:bg-[#0f172a]/95 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile Navigation Sidebar"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0f172a]/90">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/30">
              <Zap size={18} />
            </div>
            <span className="text-sm font-black tracking-wider text-slate-900 dark:text-white">
              STUDY NAV
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-indigo-400 dark:hover:text-indigo-400"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={closeMobileMenu}
              aria-label="Close Sidebar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-4 pt-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200/80 bg-slate-50/80 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:bg-slate-900"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Navigation
            </span>
            {links.map(({ href, label, icon: Icon, exact }) => {
              const active = exact
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={label}
                  href={href}
                  className={`${navLinkBase} ${active ? navLinkActive : navLinkIdle}`}
                  onClick={closeMobileMenu}
                >
                  <span className="flex h-6 w-6 items-center justify-center">
                    <Icon size={16} />
                  </span>
                  <span>{label}</span>
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between px-3">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Categories
              </span>
              <button
                type="button"
                onClick={() => setCategoriesOpen((prev) => !prev)}
                className="text-slate-400 hover:text-indigo-500"
              >
                <ChevronRight
                  size={14}
                  className={`transition-transform duration-200 ${
                    categoriesOpen ? 'rotate-90' : ''
                  }`}
                />
              </button>
            </div>

            {categoriesOpen && (
              <div className="mt-2 space-y-1">
                {filteredCategories.map((category) => {
                  const categoryTopics = topics.filter((t) => t.categoryId === category.id);
                  const isExpanded = expandedCategory === category.id;
                  const isCategoryActive = pathname === `/study/category/${category.slug}`;

                  return (
                    <div key={category.id} className="rounded-xl transition-colors">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/study/category/${category.slug}`}
                          className={`flex-1 flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                            isCategoryActive
                              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                          }`}
                          onClick={closeMobileMenu}
                        >
                          <span className="flex items-center gap-2">
                            <Tags size={14} className="text-slate-400" />
                            <span className="truncate">{category.name}</span>
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {categoryTopics.length}
                          </span>
                        </Link>

                        {categoryTopics.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedCategory(isExpanded ? '' : category.id)
                            }
                            className={`rounded-lg p-1.5 text-slate-400 transition-transform duration-200 hover:text-slate-700 dark:hover:text-slate-200 ${
                              isExpanded ? 'rotate-90 text-indigo-500' : ''
                            }`}
                          >
                            <ChevronRight size={14} />
                          </button>
                        )}
                      </div>

                      {isExpanded && categoryTopics.length > 0 && (
                        <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 pl-3 dark:border-slate-800">
                          {categoryTopics.map((topic) => {
                            const isTopicActive =
                              pathname === `/study/topic/${topic.slug}`;
                            return (
                              <Link
                                key={topic.id}
                                href={`/study/topic/${topic.slug}`}
                                className={`block rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                                  isTopicActive
                                    ? 'bg-indigo-50/80 font-bold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400'
                                    : 'text-slate-500 hover:bg-slate-100/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200'
                                }`}
                                onClick={closeMobileMenu}
                              >
                                {topic.title}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {dsaTopics.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-3">
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  DSA Practice
                </span>
                <button
                  type="button"
                  onClick={() => setDsaOpen((prev) => !prev)}
                  className="text-slate-400 hover:text-indigo-500"
                >
                  <ChevronRight
                    size={14}
                    className={`transition-transform duration-200 ${
                      dsaOpen ? 'rotate-90' : ''
                    }`}
                  />
                </button>
              </div>

              {dsaOpen && (
                <div className="mt-2 space-y-1">
                  {dsaTopics.map((dsaTopic) => {
                    const matchedProblems = dsaProblems.filter(
                      (p) => p.topicId === dsaTopic.id
                    );
                    const isExpanded = expandedDsaTopic === dsaTopic.id;

                    return (
                      <div key={dsaTopic.id}>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedDsaTopic(isExpanded ? '' : dsaTopic.id)
                            }
                            className="flex flex-1 items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50"
                          >
                            <span className="flex items-center gap-2">
                              <Code2 size={14} className="text-indigo-500" />
                              <span className="truncate">{dsaTopic.name}</span>
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              {matchedProblems.length}
                            </span>
                          </button>
                        </div>

                        {isExpanded && matchedProblems.length > 0 && (
                          <div className="ml-4 mt-1 space-y-1 border-l-2 border-indigo-200/50 pl-3 dark:border-indigo-900/40">
                            {matchedProblems.map((problem) => (
                              <Link
                                key={problem.id}
                                href={`/dsa/${problem.slug}`}
                                className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200"
                                onClick={closeMobileMenu}
                              >
                                <span className="truncate">{problem.title}</span>
                                {problem.difficulty && (
                                  <span
                                    className={`text-[9px] font-bold uppercase ${
                                      problem.difficulty.toLowerCase() === 'easy'
                                        ? 'text-emerald-500'
                                        : problem.difficulty.toLowerCase() === 'medium'
                                        ? 'text-amber-500'
                                        : 'text-rose-500'
                                    }`}
                                  >
                                    {problem.difficulty[0]}
                                  </span>
                                )}
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
          )}

          <div className="space-y-1">
            <span className="px-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Curriculum
            </span>
            <Link
              href="/study/courses"
              className={`${navLinkBase} ${
                pathname.startsWith('/study/courses') ? navLinkActive : navLinkIdle
              }`}
              onClick={closeMobileMenu}
            >
              <span className="flex h-6 w-6 items-center justify-center">
                <Layers3 size={16} />
              </span>
              <span>Courses</span>
            </Link>
          </div>
        </div>

        <div className="mt-auto border-t border-slate-200/80 p-4 dark:border-slate-800/80 dark:bg-[#0c1322]">
          {isAuthenticated ? (
            <div className="space-y-1.5">
              <Link
                href="/profile"
                className={`${navLinkBase} border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800`}
                onClick={closeMobileMenu}
              >
                <UserRound size={16} className="text-indigo-500" />
                <span>My Profile</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className={`${navLinkBase} border border-rose-200/60 bg-rose-50/50 text-rose-600 hover:bg-rose-100 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/30`}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={closeMobileMenu}
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition hover:opacity-95"
                onClick={closeMobileMenu}
              >
                <Sparkles size={14} />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
}

export default PublicShell;