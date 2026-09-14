'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast-provider';

type EnrollButtonProps = {
  courseId: string;
  courseTitle: string;
  terms: string[];
  redirectPath: string;
};

export function EnrollButton({
  courseId,
  courseTitle,
  terms,
  redirectPath,
}: EnrollButtonProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function enroll() {
    if (busy) return;

    const agreed = await confirm({
      title: `Enroll in ${courseTitle}?`,
      message:
        'Enrolling starts tracking your progress against this course. Please review the terms before continuing.',
      details: terms,
      confirmLabel: 'Enroll now',
      cancelLabel: 'Cancel',
    });

    if (!agreed) return;

    setBusy(true);
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        showToast('error', payload.error || 'Could not complete enrollment.');
        return;
      }

      showToast('success', 'Enrollment completed successfully.');
      router.push(redirectPath);
      router.refresh();
    } catch {
      showToast('error', 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={enroll}
      disabled={busy}
      aria-busy={busy}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-500 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-indigo-600 dark:hover:bg-indigo-500"
    >
      {busy ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span>Enrolling...</span>
        </>
      ) : (
        <>
          <GraduationCap size={16} />
          <span>Enroll for Free</span>
        </>
      )}
    </button>
  );
}