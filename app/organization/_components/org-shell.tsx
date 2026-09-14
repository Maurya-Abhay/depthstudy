'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Building2, 
  GitBranch, 
  ClipboardList, 
  UserCog, 
  CreditCard, 
  ScrollText, 
  Settings, 
  LogOut, 
  X, 
  ChevronDown, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { Topbar } from '@/components/ui/topbar';
import { createBrowserSupabaseClient } from '@/services/supabase-browser';
import { useConfirm } from '@/components/ui/confirm-dialog';

export type OrgShellMembership = { 
  organization_id: string; 
  slug: string; 
  name: string; 
  kind: string; 
  role: string; 
  member_status: string; 
  org_status: string 
};

export type OrgShellOrg = { 
  id: string; 
  name: string; 
  slug: string; 
  kind: string; 
  plan: string; 
  status: string 
};

const MANAGER_LINKS = [
  ['', 'Dashboard', LayoutDashboard],
  ['/students', 'Students', GraduationCap],
  ['/faculty', 'Faculty', Users],
  ['/members', 'Members', UserCog],
  ['/departments', 'Departments', Building2],
  ['/batches', 'Batches', GitBranch],
  ['/assignments', 'Assignments', ClipboardList],
  ['/billing', 'Billing & Usage', CreditCard],
  ['/audit', 'Audit Log', ScrollText],
  ['/settings', 'Settings', Settings],
] as const;

const MENTOR_LINKS = [
  ['', 'Dashboard', LayoutDashboard],
  ['/batches', 'My Batches', GitBranch],
  ['/assignments', 'Assignments', ClipboardList],
] as const;

export default function OrgShell({
  org,
  role,
  memberships,
  children,
}: {
  org: OrgShellOrg;
  role: 'owner' | 'admin' | 'mentor';
  memberships: OrgShellMembership[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const confirm = useConfirm();
  
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [profileName, setProfileName] = useState('Member');
  const [isPending, startTransition] = useTransition();

  // Profile data fetch logic
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
          setProfileName(profile?.name?.trim() || data.user?.email?.split('@')[0] || 'Member');
        });
    });

    return () => { 
      mounted = false; 
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    const isConfirmed = await confirm({ 
      title: 'Log out of organization?', 
      message: 'You will need to sign in again to access this workspace.', 
      confirmLabel: 'Log out', 
      danger: true 
    });

    if (!isConfirmed) return;

    startTransition(async () => {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    });
  }, [confirm, router]);

  const links = role === 'mentor' ? MENTOR_LINKS : MANAGER_LINKS;
  const base = `/organization/${org.slug}`;

  // Brand Header Section
  const BrandSection = (
    <div className="shrink-0 border-b border-slate-200/80 pb-3 dark:border-slate-800">
      <Link href={base} className="group block focus:outline-none">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          <Sparkles size={11} className="shrink-0" />
          <span>Depth Study</span>
        </div>
        <div className="mt-1 truncate text-sm font-semibold tracking-tight text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400 transition-colors">
          {org.name}
        </div>
      </Link>
      <div className="mt-2 flex items-center gap-1.5">
        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/50">
          {role}
        </span>
        {org.status !== 'active' && (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200/60 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/50">
            <ShieldAlert size={11} /> Suspended
          </span>
        )}
      </div>
    </div>
  );

  // Workspace Switcher Menu
  const SwitcherSection = memberships.length > 1 ? (
    <div className="relative">
      <button 
        type="button" 
        onClick={() => setSwitcherOpen((v) => !v)}
        aria-expanded={switcherOpen}
        aria-label="Switch organization"
        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-slate-700 transition-all"
      >
        <span className="flex items-center gap-2 truncate">
          <Building2 size={14} className="text-slate-400 shrink-0" />
          <span className="truncate">Switch Workspace</span>
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${switcherOpen ? 'rotate-180' : ''}`} />
      </button>

      {switcherOpen && (
        <div className="absolute left-0 right-0 z-40 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {memberships.map((m) => {
            const isCurrent = m.slug === org.slug;
            return (
              <Link 
                key={m.organization_id} 
                href={`/organization/${m.slug}`} 
                onClick={() => setSwitcherOpen(false)}
                className={`flex items-center justify-between px-3 py-1.5 text-xs transition-colors ${
                  isCurrent 
                    ? 'bg-indigo-50/80 font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400' 
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="truncate">{m.name}</span>
                <span className="ml-2 shrink-0 text-[9px] font-bold uppercase tracking-wider text-slate-400">{m.role}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  ) : null;

  // Primary Navigation
  const NavigationLinks = (
    <nav className="flex-1 space-y-0.5 py-2" aria-label="Main Navigation">
      {links.map(([href, label, Icon]) => {
        const target = href === '' ? base : `${base}${href}`;
        const isActive = pathname === target;

        return (
          <Link 
            key={href || 'dashboard'} 
            href={target}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
              isActive 
                ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950/50 dark:text-indigo-400' 
                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
            }`}
          >
            <Icon size={15} className={`shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );

  // Footer User Profile & Logout
  const FooterSection = (
    <div className="shrink-0 border-t border-slate-200/80 pt-2.5 dark:border-slate-800">
      <div className="px-2.5 py-1">
        <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{profileName}</div>
        <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{role}</div>
      </div>
      <button 
        type="button" 
        onClick={handleLogout}
        disabled={isPending}
        className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors disabled:opacity-50"
      >
        <LogOut size={14} /> 
        <span>{isPending ? 'Logging out...' : 'Log out'}</span>
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60 font-sans text-xs antialiased text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      
      {/* Desktop Sidebar */}
      <aside className="hidden w-56 flex-col border-r border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:flex fixed inset-y-0 left-0 z-30">
        <div className="flex h-full flex-col justify-between space-y-2">
          {BrandSection}
          <div className="min-h-0 flex-1 overflow-y-auto space-y-2">
            {SwitcherSection}
            {NavigationLinks}
          </div>
          {FooterSection}
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:pl-56">
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

        {/* Mobile Navigation Backdrop & Modal */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
              onClick={() => setMobileNavOpen(false)} 
              aria-hidden="true" 
            />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-2 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Organization</span>
                <button 
                  type="button" 
                  onClick={() => setMobileNavOpen(false)} 
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Close menu"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                {BrandSection}
                {SwitcherSection}
                {NavigationLinks}
              </div>
              {FooterSection}
            </aside>
          </div>
        )}

        {/* Page Content */}
        <main className="p-4">
          {children}
        </main>
      </div>

    </div>
  );
}