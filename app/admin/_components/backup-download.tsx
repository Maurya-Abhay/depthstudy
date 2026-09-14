'use client';

import { Download, Upload, AlertTriangle, FileCheck, ShieldAlert, Loader2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useToast } from '@/components/ui/toast-provider';

export function BackupDownload() {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ file: File; backup: unknown } | null>(null);

  async function download() {
    setBusy(true);
    try {
      const response = await fetch('/api/admin/backup');
      const data = response.ok ? null : await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || 'Unable to create backup.');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `depth-study-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('success', 'Backup downloaded securely.');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Unable to create backup.');
    } finally {
      setBusy(false);
    }
  }

  async function inspect(file: File) {
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if (![1, 2].includes(Number(backup?.version)) || !backup?.tables) {
        throw new Error('Unsupported backup format.');
      }
      setPending({ file, backup });
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Backup file is invalid.');
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function restore() {
    if (!pending) return;
    setBusy(true);
    try {
      const response = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'X-Silent-Toast': '1' },
        body: JSON.stringify({ confirm: true, backup: pending.backup }),
      });
      const data = await response.json();
      if (!response.ok && response.status !== 207) {
        throw new Error(data.error || 'Unable to restore backup.');
      }
      showToast(
        response.status === 207 ? 'info' : 'success',
        response.status === 207
          ? 'Backup restored partially; skipped records were left untouched.'
          : 'Backup restored safely as a merge.'
      );
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Unable to restore backup.');
    } finally {
      setBusy(false);
      setPending(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <>
      <div className="space-y-3 font-sans text-xs">
        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={download}
            disabled={busy}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>{busy ? 'Working…' : 'Download Backup'}</span>
          </button>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex items-center gap-2 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 font-medium px-4 py-2 rounded-lg transition-all disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore Merge</span>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void inspect(file);
            }}
          />
        </div>

        {/* Warning Note */}
        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>
            Restore is merge-only: existing records are never deleted and authentication secrets remain untouched.
          </span>
        </div>
      </div>

      {/* Confirmation Modal */}
      {pending && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target && !busy) {
              setPending(null);
              if (inputRef.current) inputRef.current.value = '';
            }
          }}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#0d111c] rounded-xl border border-zinc-200 dark:border-white/10 shadow-2xl p-5 space-y-4 font-sans text-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="restore-title"
          >
            <div className="flex items-start justify-between pb-2 border-b border-zinc-100 dark:border-white/5">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Database Restore
                </span>
                <h2 id="restore-title" className="text-sm font-bold text-zinc-900 dark:text-white">
                  Restore this backup?
                </h2>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setPending(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target File Overview */}
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-50 dark:bg-[#131823] border border-zinc-200/80 dark:border-white/5">
              <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-zinc-900 dark:text-white truncate">
                  {pending.file.name}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  {(pending.file.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>

            {/* Safety Warning */}
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20 text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-relaxed">
                Use only trusted Depth Study backups created by administrators. Existing records are updated if IDs match.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/5">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setPending(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
                className="px-3.5 py-1.5 font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => void restore()}
                className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium px-4 py-1.5 rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{busy ? 'Restoring…' : 'Restore Safely'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}