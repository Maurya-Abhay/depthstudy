'use client';

import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { createContext, useContext, useState } from 'react';

type ConfirmOptions = {
  title?: string;
  message: string;
  details?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<
    (ConfirmOptions & { resolve: (value: boolean) => void }) | null
  >(null);

  function confirm(options: ConfirmOptions) {
    return new Promise<boolean>((resolve) =>
      setRequest({ ...options, resolve }),
    );
  }

  function close(value: boolean) {
    request?.resolve(value);
    setRequest(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-md transition-opacity animate-in fade-in duration-200 dark:bg-black/70"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close(false);
          }}
        >
          <section
            className="w-full max-w-[420px] overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur-xl transition-all animate-in zoom-in-95 duration-200 dark:border-white/10 dark:bg-[#0b0f19]/95 dark:shadow-indigo-500/5"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Status Icon */}
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
                  request.danger
                    ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400'
                    : 'border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400'
                }`}
              >
                {request.danger ? (
                  <AlertTriangle size={20} />
                ) : (
                  <CheckCircle2 size={20} />
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                onClick={() => close(false)}
                aria-label="Close confirmation"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Title & Message */}
            <h2
              id="confirm-title"
              className="mt-4 text-base font-extrabold text-zinc-900 dark:text-white"
            >
              {request.title ?? 'Please confirm'}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              {request.message}
            </p>

            {/* Details List */}
            {request.details?.length ? (
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-xs text-zinc-500 dark:text-zinc-400">
                {request.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            ) : null}

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 shadow-xs transition-all hover:bg-zinc-50 hover:text-zinc-900 active:scale-95 dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                onClick={() => close(false)}
              >
                {request.cancelLabel ?? 'Cancel'}
              </button>
              <button
                type="button"
                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all active:scale-95 ${
                  request.danger
                    ? 'border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/30'
                    : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500'
                }`}
                onClick={() => close(true)}
              >
                {request.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm)
    throw new Error('useConfirm must be used inside ConfirmProvider');
  return confirm;
}