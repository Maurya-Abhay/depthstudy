'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Inbox } from 'lucide-react';
import { useOrgContext } from './use-org-context';

/* ============================================================
   REUSABLE FEEDBACK & STATE COMPONENTS
   ============================================================ */

/**
 * Standard Loading State Widget
 */
export function Loading({ message = 'Loading workspace data...' }: { message?: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-slate-200/80 bg-white p-4 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      <Loader2 size={16} className="animate-spin text-indigo-600 dark:text-indigo-400" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Standard Empty State Banner
 */
export function Empty({ text, icon: Icon = Inbox }: { text: string; icon?: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-8 text-center text-xs dark:border-slate-800">
      <Icon size={28} className="mb-2 text-slate-400 dark:text-slate-600" />
      <p className="font-medium text-slate-600 dark:text-slate-400">{text}</p>
    </div>
  );
}

/**
 * Inline Alert/Notification Message
 */
export function Message({ text, error }: { text: string | null; error: boolean }) {
  if (!text) return null;

  return (
    <div 
      role="alert"
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
        error
          ? 'border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300'
          : 'border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
      }`}
    >
      {error ? (
        <AlertCircle size={15} className="shrink-0 text-rose-600 dark:text-rose-400" />
      ) : (
        <CheckCircle2 size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
      )}
      <span>{text}</span>
    </div>
  );
}

/**
 * Dashboard & Page Layout Headers
 */
export function PageHeader({ 
  title, 
  subtitle, 
  actions 
}: { 
  title: string; 
  subtitle?: string; 
  actions?: React.ReactNode 
}) {
  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/**
 * Summary Metric Card
 */
export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</div>
      {hint && <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{hint}</div>}
    </div>
  );
}

/* ============================================================
   SHARED TAILWIND STYLING TOKENS
   ============================================================ */

export const inputCls = 
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20 transition-all';

export const selectCls = inputCls;

export const buttonCls = 
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition-all';

export const buttonSecondaryCls =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-all';

export const borderCls = 
  'rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';

/* ============================================================
   API & FETCHING HELPERS
   ============================================================ */

/**
 * Standardized POST API Wrapper
 */
export async function apiPost(orgId: string, endpoint: string, body: Record<string, unknown>) {
  const response = await fetch(endpoint, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ organizationId: orgId, ...body }) 
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(responseData.error || responseData.message || 'Action failed to execute');
  }

  return responseData;
}

/**
 * Safe Data Fetching Hook
 */
export function useOrgFetch<T>(
  slug: string,
  endpoint: string,
  query: Record<string, string> = {},
) {
  const ctx = useOrgContext(slug);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deep comparison ref to prevent re-render loop issue
  const queryString = JSON.stringify(query);
  const queryRef = useRef(queryString);

  useEffect(() => {
    queryRef.current = queryString;
  }, [queryString]);

  const reload = useCallback(async () => {
    if (!ctx.orgId) return;

    setLoading(true);
    setError(null);

    try {
      const activeQuery = JSON.parse(queryRef.current);
      const params = new URLSearchParams({ orgId: ctx.orgId, ...activeQuery });
      const response = await fetch(`${endpoint}?${params.toString()}`);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to load requested data');
      }

      setData(responseData as T);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred while fetching');
    } finally {
      setLoading(false);
    }
  }, [ctx.orgId, endpoint]);

  useEffect(() => { 
    reload(); 
  }, [reload, queryString]);

  return { ctx, data, loading, error, reload };
}