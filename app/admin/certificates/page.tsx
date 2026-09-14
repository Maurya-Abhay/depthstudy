'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Eye, Search, ShieldCheck, ShieldOff, Award, AlertCircle } from 'lucide-react';
import { AdminShell } from '@/app/admin/_components/admin-shell';

type Certificate = {
  certificate_code: string;
  score: number;
  issued_at: string;
  revoked_at: string | null;
  profiles: { name: string | null } | { name: string | null }[] | null;
  courses: { title: string | null } | { title: string | null }[] | null;
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

export default function Page() {
  const [items, setItems] = useState<Certificate[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  async function load() {
    try {
      const response = await fetch('/api/admin/certificates');
      const data = await response.json();
      if (response.ok) setItems(data.certificates ?? []);
      else setError(data.error ?? 'Unable to load certificates.');
    } catch {
      setError('Failed to connect to the server.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      items.filter((item) =>
        `${one(item.profiles)?.name ?? ''} ${one(item.courses)?.title ?? ''} ${item.certificate_code}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [items, query]
  );

  async function toggle(item: Certificate) {
    setBusy(item.certificate_code);
    try {
      const response = await fetch('/api/admin/certificates', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          certificateCode: item.certificate_code,
          revoked: !item.revoked_at,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setItems((current) =>
          current.map((x) =>
            x.certificate_code === item.certificate_code
              ? { ...x, revoked_at: data.certificate.revoked_at }
              : x
          )
        );
      } else {
        setError(data.error ?? 'Unable to update certificate.');
      }
    } catch {
      setError('Server error while updating certificate.');
    } finally {
      setBusy('');
    }
  }

  return (
    <AdminShell>
      <div className="space-y-4 font-sans text-xs">
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0d111c] p-4 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm">
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              Certificates
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Review, verify, preview, and revoke learner certificates.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-50 dark:bg-[#131823] border border-zinc-200/80 dark:border-white/5 text-zinc-600 dark:text-zinc-300 font-medium">
            <span>Total: {items.length}</span>
          </div>
        </div>

        {/* Search Toolbar & Content Section */}
        <div className="bg-white dark:bg-[#0d111c] p-4 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search learner, course or code..."
              className="w-full bg-zinc-50 dark:bg-[#131823] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Error Notice */}
          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg text-xs bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Certificate List */}
          {filtered.length ? (
            <div className="space-y-2 pt-1">
              {filtered.map((item) => {
                const profile = one(item.profiles);
                const course = one(item.courses);
                const isRevoked = Boolean(item.revoked_at);

                return (
                  <div
                    key={item.certificate_code}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-zinc-200/80 dark:border-white/5 bg-zinc-50/50 dark:bg-[#131823]/50 hover:bg-zinc-100/60 dark:hover:bg-[#131823] transition-all gap-2.5"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <strong className="text-xs font-bold text-zinc-900 dark:text-white block truncate">
                        {course?.title || 'Course'}
                      </strong>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {profile?.name || 'Learner'}
                        </span>{' '}
                        · Score: {item.score}% · Issued:{' '}
                        {new Date(item.issued_at).toLocaleDateString()} ·{' '}
                        <code className="font-mono text-[10px] text-zinc-400">
                          {item.certificate_code}
                        </code>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          isRevoked
                            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                        }`}
                      >
                        {isRevoked ? 'Revoked' : 'Valid'}
                      </span>

                      <Link
                        href={`/admin/certificates/${item.certificate_code}`}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 transition-colors"
                      >
                        <Eye size={13} /> Preview
                      </Link>

                      <button
                        type="button"
                        onClick={() => toggle(item)}
                        disabled={busy === item.certificate_code}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                          isRevoked
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20 dark:hover:bg-indigo-500/20'
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 dark:hover:bg-red-500/20'
                        }`}
                      >
                        {isRevoked ? (
                          <>
                            <ShieldCheck size={13} /> Restore
                          </>
                        ) : (
                          <>
                            <ShieldOff size={13} /> Revoke
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-zinc-200 dark:border-white/10 rounded-lg text-zinc-400 dark:text-zinc-500">
              No certificates match your search.
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}