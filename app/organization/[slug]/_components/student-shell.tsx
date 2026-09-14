'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  GitBranch, 
  LogOut, 
  X, 
  ChevronsUpDown, 
  Check 
} from 'lucide-react';
import { Topbar } from '@/components/ui/topbar';
import { createBrowserSupabaseClient } from '@/services/supabase-browser';

export type StudentShellMembership = { 
  organization_id: string; 
  slug: string; 
  name: string; 
  kind: string; 
  role: string; 
  member_status: string; 
  org_status: string 
};

export type StudentShellOrg = { 
  id: string; 
  name: string; 
  slug: string; 
  kind: string; 
  plan: string; 
  status: string 
};

const studentLinks = [
  ['', 'Dashboard', LayoutDashboard],
  ['/assignments', 'My Assignments', ClipboardList],
  ['/batches', 'My Batches', GitBranch],
] as const;

export default function StudentShell({ 
  org, 
  role, 
  memberships, 
  children 
}: { 
  org: StudentShellOrg; 
  role: string; 
  memberships: StudentShellMembership[]; 
  children: React.ReactNode 
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [profileName, setProfileName] = useState('Student');

  useEffect(() => {
    let mounted = true;
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted || !data.user) return;
      supabase
        .from('profiles')
        .select('name')
        .eq('id', data.user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          if (!mounted) return;
          setProfileName(profile?.name?.trim() || data.user?.email?.split('@')[0] || 'Student');
        });
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => setMobileNavOpen(false), [pathname]);

  async function logout() {
    await createBrowserSupabaseClient().auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const base = `/organization/${org.slug}`;

  const isActive = (href: string) => {
    const target = href === '' ? base : `${base}${href}`;
    if (href === '') return pathname === base;
    return pathname.startsWith(target);
  };

  const userInitials = profileName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const brand = (
    <div className="relative shrink-0 border-b border-zinc-200/80 pb-3 dark:border-white/10">
      <button 
        onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
        className="group flex w-full items-center justify-between rounded-xl border border-zinc-200/70 bg-zinc-50/50 p-2 text-left transition-all hover:bg-zinc-100 dark:border-white/5 dark:bg-zinc-900/40 dark:hover:bg-zinc-800/60"
      >
        <div className="min-w-0 flex-1 pr-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
            Depth Study
          </div>
          <div className="mt-0.5 truncate text-xs font-bold text-zinc-900 dark:text-white">
            {org.name}
          </div>
        </div>
        <ChevronsUpDown size={14} className="shrink-0 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200" />
      </button>

      {orgDropdownOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Your Organizations</p>
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {memberships.map((m) => (
              <Link
                key={m.organization_id}
                href={`/organization/${m.slug}`}
                onClick={() => setOrgDropdownOpen(false)}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  m.slug === org.slug 
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400' 
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="truncate">
                  <p className="truncate font-semibold">{m.name}</p>
                  <p className="text-[10px] text-zinc-400 capitalize">{m.kind}</p>
                </div>
                {m.slug === org.slug && <Check size={13} className="shrink-0 text-indigo-600 dark:text-indigo-400" />}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-2 flex items-center gap-1.5">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400">
          Student Portal
        </span>
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
          {org.kind}
        </span>
      </div>
    </div>
  );

  const nav = (
    <nav className="flex-1 overflow-y-auto space-y-1">
      {studentLinks.map(([href, label, Icon]) => {
        const target = href === '' ? base : `${base}${href}`;
        const active = isActive(href);
        
        return (
          <Link 
            key={href || 'dashboard'} 
            href={target}
            className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              active 
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400' 
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/70'
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-indigo-600 dark:bg-indigo-400" />
            )}
            <Icon size={16} className={`shrink-0 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="shrink-0 border-t border-zinc-200/80 pt-2 dark:border-white/10">
      <div className="flex items-center gap-2.5 px-2 py-1.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
          {userInitials || 'ST'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100">{profileName}</div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">{role}</div>
        </div>
      </div>

      <button 
        type="button" 
        onClick={logout} 
        className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-rose-600 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-rose-400 transition-colors"
      >
        <LogOut size={14} className="shrink-0" /> 
        <span>Log Out</span>
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50/50 font-sans text-xs antialiased text-zinc-900 dark:bg-[#07090e] dark:text-zinc-100">
      {/* Fixed Layout Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-hidden border-r border-zinc-200/80 bg-white p-3.5 dark:border-white/10 dark:bg-[#0d111c] md:flex">
        <div className="flex h-full flex-col justify-between overflow-hidden">
          {brand}
          <div className="my-3 min-h-0 flex-1 overflow-y-auto">{nav}</div>
          {footer}
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:pl-64">
        <Topbar 
          variant="app" 
          onMenuClick={() => setMobileNavOpen((v) => !v)} 
          mobileMenuOpen={mobileNavOpen} 
          userName={profileName} 
          userRole={org.name} 
          homeHref={base} 
          profileHref="/user/profile" 
          notificationsHref="/user/notifications" 
        />

        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
              onClick={() => setMobileNavOpen(false)} 
              aria-hidden="true" 
            />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-hidden border-r border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-[#0d111c]">
              <div className="mb-2 flex items-center justify-between pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Organization Navigation</span>
                <button 
                  type="button" 
                  onClick={() => setMobileNavOpen(false)} 
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex h-full flex-col justify-between overflow-hidden">
                {brand}
                <div className="my-3 min-h-0 flex-1 overflow-y-auto">{nav}</div>
                {footer}
              </div>
            </aside>
          </div>
        )}

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}