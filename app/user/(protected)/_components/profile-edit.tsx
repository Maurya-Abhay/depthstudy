'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Save, X, User, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';

export function ProfileEdit({ currentName }: { currentName: string }) {
  const { showToast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    if (name.trim().length < 2) {
      showToast('error', 'Name must contain at least 2 characters.');
      return;
    }
    if (newPassword && newPassword.length < 8) {
      showToast('error', 'New password must be at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      const r = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, ...(newPassword ? { newPassword } : {}) }),
      });
      const d = await r.json();

      if (!r.ok) throw new Error(d.error || 'Unable to update profile.');

      showToast('success', d.passwordChanged ? 'Profile + password updated.' : 'Profile updated successfully.');
      setOpen(false);
      setNewPassword('');
      router.refresh();
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Unable to update profile.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Edit Profile Trigger Button */}
      <button
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
        type="button"
        onClick={() => {
          setName(currentName);
          setOpen(true);
        }}
      >
        <Pencil size={13} className="text-slate-400" />
        <span>Edit profile</span>
      </button>

      {/* Modal Dialog Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md space-y-5 rounded-2xl border border-slate-800 bg-[#121824] p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <User size={16} />
                </div>
                <h3 className="text-base font-bold text-white">Edit Display Name</h3>
              </div>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                onClick={() => setOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Input */}
            <div className="space-y-1.5">
              <label htmlFor="display-name" className="text-xs font-medium text-slate-300">
                Display name
              </label>
              <input
                id="display-name"
                value={name}
                maxLength={120}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                placeholder="Enter your name"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    save();
                  } else if (e.key === 'Escape') {
                    setOpen(false);
                  }
                }}
              />
              <p className="text-[11px] text-slate-500">
                This name will be visible across your certificates and public profile.
              </p>
            </div>

            {/* Password change */}
            <div className="space-y-1.5">
              <label htmlFor="new-password" className="text-xs font-medium text-slate-300">
                New password <span className="text-slate-500">(optional — khud badalne ke liye)</span>
              </label>
              <input
                id="new-password"
                value={newPassword}
                type="password"
                minLength={8}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-500">
                Khali chhodo to password same rahega. Bharoge to turant change ho jayega.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-50"
                type="button"
                disabled={busy}
                onClick={save}
              >
                {busy ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}