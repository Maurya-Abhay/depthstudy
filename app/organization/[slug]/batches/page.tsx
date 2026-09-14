'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  GraduationCap, 
  Plus, 
  Archive, 
  RotateCcw, 
  Search, 
  Users, 
  Calendar, 
  Building2, 
  Hash, 
  CheckCircle2, 
  ArchiveX 
} from 'lucide-react';
import { 
  PageHeader, 
  Message, 
  Loading, 
  inputCls, 
  selectCls, 
  buttonCls, 
  borderCls, 
  apiPost, 
  useOrgFetch 
} from '../../_components/portal-ui';

type Department = { 
  id: string; 
  name: string 
};

type Batch = { 
  id: string; 
  name: string; 
  code: string; 
  start_year: number | null; 
  end_year: number | null; 
  archived: boolean; 
  organization_departments: { name: string } | null; 
  batch_members: any[] 
};

type Data = { 
  departments: Department[]; 
  batches: Batch[] 
};

export default function BatchesPage() {
  const { slug } = useParams<{ slug: string }>();
  const { ctx, data, loading, error, reload } = useOrgFetch<Data>(slug, '/api/organization/structure', { all: '1' });
  
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: string; e: boolean } | null>(null);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [b, setB] = useState({ 
    name: '', 
    code: '', 
    departmentId: '', 
    startYear: '', 
    endYear: '', 
    mentorId: '' 
  });

  // Filter & Search States
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');

  if (ctx.loading || loading) return <Loading />;
  if (ctx.error || error) return <Message text={ctx.error || error} error />;
  const canManage = ctx.role === 'owner' || ctx.role === 'admin';

  const batches = data?.batches ?? [];
  const departments = data?.departments ?? [];

  const activeCount = batches.filter((bt) => !bt.archived).length;
  const archivedCount = batches.filter((bt) => bt.archived).length;
  const totalStudents = batches.reduce((acc, current) => acc + (current.batch_members?.length || 0), 0);

  async function run(body: Record<string, unknown>) {
    if (!ctx.orgId) return;
    setBusy(true); 
    setMsg(null);
    try { 
      await apiPost(ctx.orgId, '/api/organization/structure', body); 
      setMsg({ t: 'Batch details updated successfully.', e: false }); 
      setB({ name: '', code: '', departmentId: '', startYear: '', endYear: '', mentorId: '' }); 
      setShowForm(false);
      await reload(); 
    } catch (e) { 
      setMsg({ t: e instanceof Error ? e.message : 'Operation failed.', e: true }); 
    } finally { 
      setBusy(false); 
    }
  }

  // Filter Logic
  const filteredBatches = batches.filter((bt) => {
    const matchesSearch = bt.name.toLowerCase().includes(search.toLowerCase()) || 
                          (bt.code && bt.code.toLowerCase().includes(search.toLowerCase()));
    const matchesDept = deptFilter ? bt.organization_departments?.name === deptFilter : true;
    
    if (statusFilter === 'active') return matchesSearch && matchesDept && !bt.archived;
    if (statusFilter === 'archived') return matchesSearch && matchesDept && bt.archived;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-5 font-sans text-xs antialiased">
      {/* Page Header */}
      <PageHeader 
        title="Batches" 
        subtitle="Manage academic cohorts, student batches, and department allocations" 
        actions={
          canManage ? (
            <button 
              onClick={() => setShowForm(!showForm)} 
              className={buttonCls}
            >
              <Plus size={14} />
              <span>{showForm ? 'Close Panel' : 'Create Batch'}</span>
            </button>
          ) : undefined
        } 
      />

      {/* Global Message Banner */}
      <Message text={msg?.t ?? null} error={msg?.e ?? false} />

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className={`${borderCls} p-3.5 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Batches</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-100">{batches.length}</p>
          </div>
          <GraduationCap size={18} className="text-slate-400" />
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

        <div className={`${borderCls} p-3.5 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Total Enrolled</p>
            <p className="mt-0.5 text-lg font-bold text-indigo-700 dark:text-indigo-300">{totalStudents}</p>
          </div>
          <Users size={18} className="text-indigo-500" />
        </div>
      </div>

      {/* Creation Form Panel */}
      {canManage && showForm && (
        <section className={`${borderCls} p-4 bg-slate-50/50 dark:bg-slate-900/40 space-y-3`}>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">Provision New Batch</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Define academic cohort attributes and associate with a department.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Batch Name *</label>
              <input 
                value={b.name} 
                onChange={(e) => setB({ ...b, name: e.target.value })} 
                placeholder="e.g. CS 2024-2028" 
                className={inputCls} 
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Batch Code (Optional)</label>
              <input 
                value={b.code} 
                onChange={(e) => setB({ ...b, code: e.target.value })} 
                placeholder="e.g. CS-24A" 
                className={inputCls} 
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Department</label>
              <select 
                value={b.departmentId} 
                onChange={(e) => setB({ ...b, departmentId: e.target.value })} 
                className={selectCls}
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Start Year</label>
              <input 
                type="number"
                value={b.startYear} 
                onChange={(e) => setB({ ...b, startYear: e.target.value })} 
                placeholder="2024" 
                className={inputCls} 
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">End Year</label>
              <input 
                type="number"
                value={b.endYear} 
                onChange={(e) => setB({ ...b, endYear: e.target.value })} 
                placeholder="2028" 
                className={inputCls} 
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button 
              disabled={busy || b.name.trim().length < 2} 
              onClick={() => run({ 
                action: 'create_batch', 
                name: b.name, 
                code: b.code || undefined, 
                departmentId: b.departmentId || null, 
                startYear: b.startYear ? Number(b.startYear) : null, 
                endYear: b.endYear ? Number(b.endYear) : null 
              })} 
              className={buttonCls}
            >
              <GraduationCap size={13} />
              <span>{busy ? 'Creating...' : 'Provision Batch'}</span>
            </button>
          </div>
        </section>
      )}

      {/* Controls & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Bar */}
          <div className="relative w-48 sm:w-64">
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search by name or code..." 
              className={`${inputCls} pl-8`} 
            />
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Department Filter */}
          <select 
            value={deptFilter} 
            onChange={(e) => setDeptFilter(e.target.value)} 
            className={selectCls}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100/60 p-0.5 dark:border-slate-800 dark:bg-slate-900">
          {(['active', 'archived', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Batches Directory List */}
      <div className={borderCls}>
        {filteredBatches.length ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredBatches.map((bt) => (
              <div 
                key={bt.id} 
                className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    bt.archived 
                      ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' 
                      : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                  }`}>
                    <GraduationCap size={16} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{bt.name}</span>
                      
                      {bt.code && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          <Hash size={10} />
                          {bt.code}
                        </span>
                      )}

                      {bt.archived ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                          Archived
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Metadata Subline */}
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Building2 size={12} className="text-slate-400" />
                        <span>{bt.organization_departments?.name || 'No Dept'}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        <span>
                          {bt.start_year || 'N/A'} – {bt.end_year || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Users size={12} className="text-slate-400" />
                        <span>{bt.batch_members?.length ?? 0} Students</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {canManage && (
                  <div>
                    {!bt.archived ? (
                      <button 
                        disabled={busy} 
                        onClick={() => run({ action: 'update_batch', batchId: bt.id, archived: true })} 
                        className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400"
                      >
                        <Archive size={11} />
                        <span>Archive</span>
                      </button>
                    ) : (
                      <button 
                        disabled={busy} 
                        onClick={() => run({ action: 'update_batch', batchId: bt.id, archived: false })} 
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
            <GraduationCap size={28} className="mb-2 text-slate-300 dark:text-slate-700" />
            <p className="font-medium">No batches found.</p>
            <p className="text-[11px] text-slate-400">Try adjusting your department filter or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}