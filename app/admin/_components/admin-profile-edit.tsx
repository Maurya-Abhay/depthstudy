'use client';

import { useState } from 'react';
import { Pencil, Save, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast-provider';

export function AdminProfileEdit({ currentName }: { currentName: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [busy, setBusy] = useState(false);

  async function save() {
    const trimmed = name.trim();

    if (trimmed.length < 2) {
      showToast('error', 'Name must contain at least 2 characters.');
      return;
    }

    setBusy(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to update profile.');
      }

      showToast('success', 'Profile updated successfully.');
      setOpen(false);
      router.refresh();
    } catch (error) {
      showToast(
        'error',
        error instanceof Error
          ? error.message
          : 'Unable to update profile.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-200 font-medium text-[11px] shadow-sm transition-all"
      >
        <Pencil className="w-3.5 h-3.5 text-zinc-500" />
        <span>Edit Profile</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-2 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200 dark:border-white/10 transition-all">
      <div className="space-y-1 grow">
        <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Display Name
        </label>
        <input
          type="text"
          value={name}
          maxLength={120}
          disabled={busy}
          onChange={(event) => setName(event.target.value)}
          autoFocus
          className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50"
          placeholder="Enter display name"
        />
      </div>

      <div className="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setName(currentName);
            setOpen(false);
          }}
          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[11px] font-medium transition-all disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium shadow-sm transition-all disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>{busy ? 'Saving…' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
}