'use client';

import { Bell, CheckCheck, ChevronRight, Circle, Loader2 } from 'lucide-react';
import { useState } from 'react';

type Notification = {
  id: string;
  title: string;
  message: string;
  kind: string;
  created_at: string;
  read_at: string | null;
};

export function NotificationsList({ initial }: { initial: Notification[] }) {
  const [items, setItems] = useState<Notification[]>(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const unread = items.filter((item) => !item.read_at).length;

  async function markRead(id: string) {
    setBusyId(id);
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        setItems((current) =>
          current.map((item) =>
            item.id === id ? { ...item, read_at: new Date().toISOString() } : item
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setBusyId(null);
    }
  }

  async function markAllRead() {
    if (!unread || markingAll) return;
    setMarkingAll(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      if (response.ok) {
        setItems((current) =>
          current.map((item) =>
            item.read_at ? item : { ...item, read_at: new Date().toISOString() }
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="space-y-2">
      {/* Sub Header / Action Toolbar */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              unread
                ? 'border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400'
                : 'border border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {unread ? `${unread} new` : 'All read'}
          </span>
        </div>

        {unread > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            {markingAll ? (
              <>
                <Loader2 size={11} className="animate-spin text-indigo-500" />
                <span>Marking...</span>
              </>
            ) : (
              <>
                <CheckCheck size={11} className="text-slate-500 dark:text-slate-400" />
                <span>Mark all read</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Notifications Row List */}
      {items.length ? (
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200/80 bg-slate-50/50 dark:divide-slate-800/60 dark:border-slate-800/80 dark:bg-slate-950/40">
          {items.map((item) => {
            const isUnread = !item.read_at;
            const isBusy = busyId === item.id;

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => isUnread && !isBusy && void markRead(item.id)}
                className={`group flex w-full items-start gap-2.5 p-2.5 text-left transition ${
                  isUnread
                    ? 'bg-indigo-50/60 hover:bg-indigo-50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40'
                    : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                }`}
              >
                {/* Icon */}
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${
                    isUnread
                      ? 'border-indigo-200 bg-indigo-100 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400'
                      : 'border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500'
                  }`}
                >
                  <Bell size={13} />
                </span>

                {/* Body Content */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <strong className="truncate text-xs font-bold text-slate-900 transition group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300">
                      {item.title}
                    </strong>
                    {isUnread && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600 dark:bg-indigo-500" />
                    )}
                  </div>
                  <p className="line-clamp-1 text-[11px] text-slate-600 dark:text-slate-400">
                    {item.message}
                  </p>
                  <span className="block text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    {new Date(item.created_at).toLocaleDateString()} · {item.kind}
                  </span>
                </div>

                {/* Right Action/Loading Indicator */}
                <div className="mt-1 shrink-0">
                  {isBusy ? (
                    <Loader2 size={12} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                  ) : isUnread ? (
                    <Circle size={7} className="fill-indigo-600 text-indigo-600 dark:fill-indigo-500 dark:text-indigo-500" />
                  ) : (
                    <ChevronRight size={12} className="text-slate-400 dark:text-slate-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50/50 py-6 text-center dark:border-slate-800 dark:bg-slate-950/30">
          <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500">
            <Bell size={15} />
          </div>
          <strong className="text-xs font-bold text-slate-900 dark:text-white">
            You are all caught up
          </strong>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            New learning updates will appear here.
          </p>
        </div>
      )}
    </div>
  );
}