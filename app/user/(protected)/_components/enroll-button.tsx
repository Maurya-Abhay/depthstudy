'use client';

import { ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast-provider';

interface EnrollButtonProps {
  courseId: string;
  topicSlug?: string;
  redirectPath?: string;
  courseTitle?: string;
  terms?: string[];
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export function EnrollButton({
  courseId,
  topicSlug,
  redirectPath,
  courseTitle,
  terms,
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}: EnrollButtonProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  // Variant Styles Mapping
  const variantStyles = {
    primary:
      'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 hover:shadow-indigo-500/35 active:scale-[0.98]',
    secondary:
      'bg-slate-800 text-slate-100 hover:bg-slate-700 active:scale-[0.98] dark:bg-slate-800 dark:hover:bg-slate-700',
    outline:
      'border border-slate-300 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 active:scale-[0.98]',
  };

  // Size Styles Mapping
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-[11px] rounded-lg gap-1.5',
    md: 'px-4 py-2 text-xs rounded-xl gap-2',
    lg: 'px-5 py-2.5 text-xs font-bold rounded-xl gap-2',
  };

  async function handleEnroll() {
    if (busy) return;

    if (
      terms?.length &&
      !(await confirm({
        title: `Start ${courseTitle ?? 'this course'}?`,
        message: 'Review and accept these course rules before enrollment.',
        details: terms,
        confirmLabel: 'Accept and start',
        cancelLabel: 'Not now',
      }))
    ) {
      return;
    }

    setBusy(true);

    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setBusy(false);
        if (response.status === 401) {
          showToast('info', 'Please sign in to start this course.');
          router.push('/register');
          return;
        }
        showToast('error', data.error || 'Unable to start this course.');
        return;
      }

      showToast('success', 'Course added to your learning dashboard.');

      if (redirectPath) {
        router.push(redirectPath);
      } else if (topicSlug) {
        router.push(`/study/topic/${encodeURIComponent(topicSlug)}`);
      } else {
        router.refresh();
        setBusy(false);
      }
    } catch {
      showToast('error', 'Unable to enroll right now. Please try again.');
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleEnroll}
      disabled={busy}
      aria-busy={busy}
      aria-disabled={busy}
      className={`group inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {busy ? (
        <>
          <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin" />
          <span>Starting…</span>
        </>
      ) : (
        <>
          <span>{children || 'Start Course'}</span>
          <ArrowRight
            size={size === 'sm' ? 13 : 15}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </>
      )}
    </button>
  );
}