import Link from 'next/link';
import { requireUser } from '@/services/auth';
import { getUserOrganizations } from '@/services/organization';
import { Building2, ArrowRight, PlusCircle, Shield, Sparkles } from 'lucide-react';

export default async function OrganizationIndexPage() {
  const user = await requireUser();
  const orgs = await getUserOrganizations(user.id);

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 font-sans text-xs antialiased text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:p-8">
      <div className="mx-auto max-w-4xl">
        
        {/* Header Section */}
        <header className="mb-6 border-b border-slate-200/80 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            <Sparkles size={11} className="shrink-0" />
            <span>Workspace Selector</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Your Organizations
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Select a college, institute, or department workspace to continue.
          </p>
        </header>

        {/* Organizations Grid */}
        {orgs.length > 0 ? (
          <div className="grid gap-3.5 sm:grid-cols-2">
            {orgs.map((item: any) => {
              const org = item.organizations;
              return (
                <Link
                  key={item.organization_id}
                  href={`/organization/${org.slug}`}
                  className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-indigo-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-400/50"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                          <Building2 size={16} />
                        </div>
                        <h2 className="truncate font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400 transition-colors">
                          {org.name}
                        </h2>
                      </div>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {org.kind}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <Shield size={12} className="text-slate-400" />
                      <span>Role: <strong className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{item.role}</strong></span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <span>Open workspace</span>
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Building2 size={32} className="mb-2 text-slate-400 dark:text-slate-600" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">No organizations found</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              You are not a member of any organization yet. Contact your administrator or create a new workspace.
            </p>
            <Link
              href="/organization/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
            >
              <PlusCircle size={14} />
              <span>Create Organization</span>
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}