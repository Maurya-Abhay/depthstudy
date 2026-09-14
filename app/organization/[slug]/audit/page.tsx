'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  ShieldCheck, 
  Activity, 
  Users, 
  Search, 
  FileText, 
  Terminal, 
  Clock, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { 
  PageHeader, 
  Loading, 
  Message, 
  borderCls, 
  inputCls, 
  selectCls, 
  useOrgFetch 
} from '../../_components/portal-ui';

type AuditEntry = {
  id: string;
  action: string;
  actor_name?: string | null;
  entity_type?: string | null;
  created_at: string;
  metadata?: Record<string, any> | null;
};

type Data = { 
  entries: AuditEntry[]; 
  total: number 
};

export default function AuditPage() {
  const { slug } = useParams<{ slug: string }>();
  const { ctx, data, loading, error } = useOrgFetch<Data>(slug, '/api/organization/audit');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [expandedMeta, setExpandedMeta] = useState<Record<string, boolean>>({});

  if (ctx.loading || loading) return <Loading />;
  if (ctx.error || error) return <Message text={ctx.error || error} error />;

  const entries = data?.entries ?? [];
  const total = data?.total ?? entries.length;

  // Extract unique entity types for filter dropdown
  const entityTypes = Array.from(new Set(entries.map((e) => e.entity_type).filter(Boolean))) as string[];
  const uniqueActors = new Set(entries.map((e) => e.actor_name || 'system')).size;

  // Toggle JSON metadata view
  const toggleMetadata = (id: string) => {
    setExpandedMeta((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter Logic
  const filteredEntries = entries.filter((e) => {
    const matchesSearch = 
      e.action.toLowerCase().includes(search.toLowerCase()) ||
      (e.actor_name && e.actor_name.toLowerCase().includes(search.toLowerCase())) ||
      (e.entity_type && e.entity_type.toLowerCase().includes(search.toLowerCase()));
    
    const matchesEntity = entityFilter ? e.entity_type === entityFilter : true;
    return matchesSearch && matchesEntity;
  });

  return (
    <div className="space-y-5 font-sans text-xs antialiased">
      {/* Page Header */}
      <PageHeader 
        title="Audit Log" 
        subtitle="Security activity, configuration changes, and system access trail" 
      />

      {/* Statistics Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className={`${borderCls} p-3.5 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Recorded Events</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-100">{total}</p>
          </div>
          <Activity size={18} className="text-slate-400" />
        </div>

        <div className={`${borderCls} p-3.5 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Active Actors</p>
            <p className="mt-0.5 text-lg font-bold text-indigo-700 dark:text-indigo-300">{uniqueActors}</p>
          </div>
          <Users size={18} className="text-indigo-500" />
        </div>

        <div className={`${borderCls} col-span-2 sm:col-span-1 p-3.5 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Log Status</p>
            <p className="mt-0.5 text-lg font-bold text-emerald-700 dark:text-emerald-300">Monitored</p>
          </div>
          <ShieldCheck size={18} className="text-emerald-500" />
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Bar */}
          <div className="relative w-48 sm:w-64">
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Filter by action, actor, or entity..." 
              className={`${inputCls} pl-8`} 
            />
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Entity Type Filter */}
          <select 
            value={entityFilter} 
            onChange={(e) => setEntityFilter(e.target.value)} 
            className={selectCls}
          >
            <option value="">All Entity Types</option>
            {entityTypes.map((t) => (
              <option key={t} value={t}>{t.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <span className="text-[11px] font-medium text-slate-500">
          Showing {filteredEntries.length} of {entries.length} events
        </span>
      </div>

      {/* Audit Logs Directory */}
      <div className={borderCls}>
        {filteredEntries.length ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredEntries.map((e) => {
              const hasMetadata = e.metadata && Object.keys(e.metadata).length > 0;
              const isExpanded = !!expandedMeta[e.id];

              return (
                <div 
                  key={e.id} 
                  className="p-3.5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Terminal size={14} />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {e.action}
                          </span>

                          {e.entity_type && (
                            <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
                              <FileText size={10} />
                              {e.entity_type}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>
                            Actor: <strong className="font-medium text-slate-700 dark:text-slate-300">{e.actor_name || 'System / Automated'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock size={11} />
                        <span>{new Date(e.created_at).toLocaleString()}</span>
                      </div>

                      {hasMetadata && (
                        <button
                          onClick={() => toggleMetadata(e.id)}
                          className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          <span>{isExpanded ? 'Hide Payload' : 'View Payload'}</span>
                          {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metadata JSON Inspector */}
                  {hasMetadata && isExpanded && (
                    <div className="mt-2.5 overflow-x-auto rounded-lg border border-slate-200 bg-slate-950 p-3 text-[11px] font-mono text-emerald-400 dark:border-slate-800">
                      <pre className="whitespace-pre-wrap break-all">
                        {JSON.stringify(e.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 text-center text-slate-500 dark:text-slate-400">
            <Activity size={28} className="mb-2 text-slate-300 dark:text-slate-700" />
            <p className="font-medium">No audit events match your search.</p>
            <p className="text-[11px] text-slate-400">Try clearing filters or searching for another keyword.</p>
          </div>
        )}
      </div>
    </div>
  );
}