'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  Building2, 
  Plus, 
  Archive, 
  RotateCcw, 
  Search, 
  Layers, 
  CheckCircle2, 
  ArchiveX, 
  FolderKanban 
} from 'lucide-react';
import { 
  PageHeader, 
  Message, 
  Loading, 
  inputCls, 
  buttonCls, 
  borderCls, 
  apiPost, 
  useOrgFetch 
} from '../../_components/portal-ui';

type Dept = { 
  id: string; 
  name: string; 
  description: string; 
  archived: boolean 
};

type Data = { 
  departments: Dept[]; 
  batches: any[] 
};

export default function DepartmentsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { ctx, data, loading, error, reload } = useOrgFetch<Data>(slug, '/api/organization/structure', { all: '1' });
  
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: string; e: boolean } | null>(null);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  
  // Filter & Search State
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active');

  if (ctx.loading || loading) return <Loading />;
  if (ctx.error || error) return <Message text={ctx.error || error} error />;
  const canManage = ctx.role === 'owner' || ctx.role === 'admin';

  const departments = data?.departments ?? [];
  const activeCount = departments.filter((d) => !d.archived).length;
  const archivedCount = departments.filter((d) => d.archived).length;

  async function run(b: Record<string, unknown>) {
    if (!ctx.orgId) return;
    setBusy(true); 
    setMsg(null);
    try { 
      await apiPost(ctx.orgId, '/api/organization/structure', b); 
      setMsg({ t: 'Department configuration updated successfully.', e: false }); 
      setName(''); 
      setDesc(''); 
      setShowForm(false);
      await reload(); 
    } catch (e) { 
      setMsg({ t: e instanceof Error ? e.message : 'Operation failed.', e: true }); 
    } finally { 
      setBusy(false); 
    }
  }

  // Filter Logic
  const filteredDepartments = departments.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                          (d.description && d.description.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'active') return matchesSearch && !d.archived;
    if (filter === 'archived') return matchesSearch && d.archived;
    return matchesSearch;
  });

  return (
    <div className="space-y-5 font-sans text-xs antialiased">
      {/* Header */}
      <PageHeader 
        title="Departments" 
        subtitle="Manage organizational departments and functional divisions" 
        actions={
          canManage ? (
            <button 
              onClick={() => setShowForm(!showForm)} 
              className={buttonCls}
            >
              <Plus size={14} />
              <span>{showForm ? 'Close Panel' : 'New Department'}</span>
            </button>
          ) : undefined
        }
      />

      {/* Global Message Banner */}
      <Message text={msg?.t ?? null} error={msg?.e ?? false} />

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`${borderCls} p-3.5 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Departments</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-100">{departments.length}</p>
          </div>
          <Building2 size={18} className="text-slate-400" />
        </div>

        <div className={`${borderCls} p-3.5 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Active</p>
            <p className="mt-0.5 text-lg font-bold text-emerald-700 dark:text-emerald-300">{activeCount}</p>
          </div>
          <CheckCircle2 size={18} className="text-emerald-500" />
        </div>

        <div className={`${borderCls} p-3.5 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Archived</p>
            <p className="mt-0.5 text-lg font-bold text-slate-700 dark:text-slate-300">{archivedCount}</p>
          </div>
          <ArchiveX size={18} className="text-slate-400" />
        </div>
      </div>

      {/* Create Form Panel */}
      {canManage && showForm && (
        <section className={`${borderCls} p-4 bg-slate-50/50 dark:bg-slate-900/40 space-y-3`}>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">Create New Department</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Add a primary operational unit or department to your organization.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Department Name *</label>
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Computer Science & Engineering" 
                className={inputCls} 
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Description</label>
              <input 
                value={desc} 
                onChange={(e) => setDesc(e.target.value)} 
                placeholder="Brief department scope or objective..." 
                className={inputCls} 
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button 
              disabled={busy || name.trim().length < 2} 
              onClick={() => run({ action: 'create_department', name, description: desc })} 
              className={buttonCls}
            >
              <Building2 size={13} />
              <span>{busy ? 'Adding...' : 'Add Department'}</span>
            </button>
          </div>
        </section>
      )}

      {/* Controls & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3 dark:border-slate-800">
        <div className="relative w-full max-w-xs">
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search departments..." 
            className={`${inputCls} pl-8`} 
          />
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100/60 p-0.5 dark:border-slate-800 dark:bg-slate-900">
          {(['active', 'archived', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors ${
                filter === tab
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Department Directory List */}
      <div className={borderCls}>
        {filteredDepartments.length ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredDepartments.map((d) => (
              <div 
                key={d.id} 
                className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    d.archived 
                      ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' 
                      : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                  }`}>
                    <Building2 size={16} />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{d.name}</span>
                      {d.archived ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                          Archived
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {d.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {canManage && (
                  <div>
                    {!d.archived ? (
                      <button 
                        disabled={busy} 
                        onClick={() => run({ action: 'update_department', departmentId: d.id, archived: true })} 
                        className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400"
                      >
                        <Archive size={11} />
                        <span>Archive</span>
                      </button>
                    ) : (
                      <button 
                        disabled={busy} 
                        onClick={() => run({ action: 'update_department', departmentId: d.id, archived: false })} 
                        className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      >
                        <RotateCcw size={11} />
                        <span>Restore</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 text-center text-slate-500 dark:text-slate-400">
            <FolderKanban size={28} className="mb-2 text-slate-300 dark:text-slate-700" />
            <p className="font-medium">No departments found.</p>
            <p className="text-[11px] text-slate-400">Try adjusting your search query or status filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}