'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  Target, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText 
} from 'lucide-react';
import { 
  PageHeader, 
  Message, 
  Loading, 
  inputCls, 
  selectCls, 
  buttonCls, 
  borderCls, 
  useOrgFetch 
} from '../../_components/portal-ui';

type Assignment = {
  id: string;
  title: string;
  description?: string;
  target_type: string;
  status: string;
  due_at?: string | null;
  batch_id?: string | null;
};

type Batch = {
  id: string;
  name: string;
};

type Data = { 
  dashboard: { 
    assignments: Assignment[]; 
    batches: Batch[] 
  } 
};

export default function AssignmentsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [q, setQ] = useState<Record<string, string>>({});
  const { ctx, data, loading, error, reload } = useOrgFetch<Data>(slug, '/api/organization', q);
  
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: string; e: boolean } | null>(null);
  
  // Creation Form State
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [targetType, setTargetType] = useState('skill');
  const [batchId, setBatchId] = useState('');
  const [due, setDue] = useState('');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  if (ctx.loading || loading) return <Loading />;
  if (ctx.error || error) return <Message text={ctx.error || error} error />;

  const assignments = data?.dashboard?.assignments ?? [];
  const batches = data?.dashboard?.batches ?? [];
  const isStudent = ctx.role === 'student';

  const pendingCount = assignments.filter((a) => a.status !== 'completed').length;
  const completedCount = assignments.filter((a) => a.status === 'completed').length;

  async function create() {
    if (!ctx.orgId) return;
    setBusy(true); 
    setMsg(null);
    try {
      const r = await fetch('/api/organization/manage', { 
        method: 'POST', 
        headers: { 'content-type': 'application/json' }, 
        body: JSON.stringify({ 
          action: 'create_assignment', 
          organizationId: ctx.orgId, 
          title, 
          description: desc, 
          targetType, 
          batchId: batchId || null, 
          dueAt: due || null 
        }) 
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Failed to publish assignment');
      
      setMsg({ t: 'Assignment published successfully.', e: false });
      setTitle(''); 
      setDesc(''); 
      setDue('');
      setShowForm(false);
      await reload();
    } catch (e) { 
      setMsg({ t: e instanceof Error ? e.message : 'Failed', e: true }); 
    } finally { 
      setBusy(false); 
    }
  }

  // Filter Logic
  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || 
                          (a.description && a.description.toLowerCase().includes(search.toLowerCase()));
    const matchesType = filterType ? a.target_type === filterType : true;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-5 font-sans text-xs antialiased">
      {/* Page Header */}
      <PageHeader 
        title={isStudent ? 'My Assignments' : 'Assignments'} 
        subtitle={isStudent ? 'Track your coursework, tests, and task deadlines' : 'Manage coursework and track submissions'} 
        actions={
          !isStudent ? (
            <button 
              onClick={() => setShowForm(!showForm)} 
              className={buttonCls}
            >
              <Plus size={14} />
              <span>{showForm ? 'Close Panel' : 'Create Assignment'}</span>
            </button>
          ) : undefined
        }
      />

      {/* Global Message Banner */}
      <Message text={msg?.t ?? null} error={msg?.e ?? false} />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`${borderCls} p-3.5 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Assignments</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-100">{assignments.length}</p>
          </div>
          <ClipboardList size={18} className="text-slate-400" />
        </div>

        <div className={`${borderCls} p-3.5 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending / Active</p>
            <p className="mt-0.5 text-lg font-bold text-amber-700 dark:text-amber-300">{pendingCount}</p>
          </div>
          <Clock size={18} className="text-amber-500" />
        </div>

        <div className={`${borderCls} p-3.5 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Completed</p>
            <p className="mt-0.5 text-lg font-bold text-emerald-700 dark:text-emerald-300">{completedCount}</p>
          </div>
          <CheckCircle2 size={18} className="text-emerald-500" />
        </div>
      </div>

      {/* Creation Form Panel (Mentors/Admins) */}
      {!isStudent && showForm && (
        <section className={`${borderCls} p-4 bg-slate-50/50 dark:bg-slate-900/40 space-y-3`}>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">Publish New Assignment</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Assign learning tasks, quizzes, or project deliverables to cohorts.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Assignment Title *</label>
              <input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. Data Structures Assessment #1" 
                className={inputCls} 
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Instructions / Description</label>
              <input 
                value={desc} 
                onChange={(e) => setDesc(e.target.value)} 
                placeholder="Brief guidelines or submission rules..." 
                className={inputCls} 
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Target Type</label>
              <select 
                value={targetType} 
                onChange={(e) => setTargetType(e.target.value)} 
                className={selectCls}
              >
                {['skill', 'topic', 'test', 'dsa', 'project', 'course'].map((t) => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Target Batch</label>
              <select 
                value={batchId} 
                onChange={(e) => setBatchId(e.target.value)} 
                className={selectCls}
              >
                <option value="">All Cohort Members</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Due Date & Time</label>
              <input 
                type="datetime-local" 
                value={due} 
                onChange={(e) => setDue(e.target.value)} 
                className={inputCls} 
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button 
              disabled={busy || !title.trim()} 
              onClick={create} 
              className={buttonCls}
            >
              <ClipboardList size={13} />
              <span>{busy ? 'Publishing...' : 'Publish Assignment'}</span>
            </button>
          </div>
        </section>
      )}

      {/* Filter & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search assignments..." 
              className={`${inputCls} pl-8`} 
            />
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)} 
            className={selectCls}
          >
            <option value="">All Types</option>
            {['skill', 'topic', 'test', 'dsa', 'project', 'course'].map((t) => (
              <option key={t} value={t}>{t.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignments Directory List */}
      <div className={borderCls}>
        {filteredAssignments.length ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredAssignments.map((a) => {
              const isOverdue = a.due_at && new Date(a.due_at) < new Date() && a.status !== 'completed';
              return (
                <div 
                  key={a.id} 
                  className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      a.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : isOverdue
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                        : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                    }`}>
                      <ClipboardList size={16} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{a.title}</span>
                        
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          <Target size={10} />
                          {a.target_type}
                        </span>

                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
                            <AlertCircle size={10} />
                            Overdue
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {a.description || 'No detailed instructions provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Deadline & Status */}
                  <div className="text-right text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-end gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <Calendar size={12} className="text-slate-400" />
                      <span>
                        {a.due_at 
                          ? new Date(a.due_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                          : 'No Deadline'}
                      </span>
                    </div>

                    <span className={`inline-block mt-0.5 font-semibold capitalize ${
                      a.status === 'completed' 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {a.status || 'Active'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 text-center text-slate-500 dark:text-slate-400">
            <FileText size={28} className="mb-2 text-slate-300 dark:text-slate-700" />
            <p className="font-medium">No assignments found.</p>
            <p className="text-[11px] text-slate-400">Try adjusting your search filter or target category.</p>
          </div>
        )}
      </div>
    </div>
  );
}