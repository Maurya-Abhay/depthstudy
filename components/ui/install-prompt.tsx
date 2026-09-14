'use client';

import { Download, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      setOpen(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () =>
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  if (!open || !event) return null;

  return (
    <aside
      className="fixed bottom-4 right-4 z-[90] flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white/95 p-2.5 text-zinc-900 shadow-xl backdrop-blur-md transition-all duration-300 dark:border-white/10 dark:bg-zinc-900/95 dark:text-white animate-in slide-in-from-bottom-3 sm:bottom-5 sm:right-5 sm:p-3"
      aria-label="Install Depth Study"
    >
      {/* Icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
        <Sparkles size={15} />
      </div>

      {/* Text Info */}
      <div className="flex flex-col pr-1">
        <strong className="text-[11px] font-bold leading-none sm:text-xs">
          Install App
        </strong>
        <span className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400 sm:text-[11px]">
          Quick access on desktop & mobile
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 active:scale-95 sm:px-3 sm:text-xs"
          onClick={async () => {
            await event.prompt();
            await event.userChoice;
            setEvent(null);
            setOpen(false);
          }}
        >
          Install <Download size={12} />
        </button>

        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white"
          aria-label="Dismiss install prompt"
          onClick={() => setOpen(false)}
        >
          <X size={13} />
        </button>
      </div>
    </aside>
  );
}