'use client';

import { useEffect, useState } from 'react';
import { CalendarPlus, Trash2, Calendar, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';
import { UserShell } from '@/app/user/(protected)/_components/user-shell';

type Session = {
  id: string;
  title: string;
  starts_at: string;
  duration_minutes: number;
  status: string;
};

export default function Page() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [duration, setDuration] = useState('30');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function load() {
    try {
      const response = await fetch('/api/schedule');
      const data = await response.json();
      if (response.ok) setSessions(data.sessions ?? []);
      else setMessage(data.error);
    } catch {
      setMessage('Failed to load schedule.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Silent-Toast': '1',
        },
        body: JSON.stringify({
          title,
          startsAt: new Date(startsAt).toISOString(),
          durationMinutes: Number(duration),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error);
        setLoading(false);
        return;
      }

      setTitle('');
      setStartsAt('');
      showToast('success', 'Study session added successfully.');
      await load();
    } catch {
      setMessage('An error occurred while adding the session.');
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    const r = await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' });
    if (r.ok) showToast('success', 'Study session removed.');
    else showToast('error', 'Unable to remove this session.');
    setSessions((items) => items.filter((item) => item.id !== id));
  }

  return (
    <UserShell>
      <div className="mx-auto max-w-7xl space-y-3 text-slate-900 dark:text-slate-100">
        {/* Compact Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 dark:border-slate-800/80">
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Schedule
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Plan study blocks and keep your next session visible.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
            <Sparkles size={10} /> {sessions.length} Planned
          </span>
        </div>

        {/* Main Section */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          {/* Form Panel */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900">
              <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800/60">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <CalendarPlus size={14} />
                </span>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                  Add Study Session
                </h2>
              </div>

              <form onSubmit={add} className="space-y-2.5">
                <div className="space-y-1">
                  <label
                    htmlFor="session-title"
                    className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Title
                  </label>
                  <input
                    id="session-title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    placeholder="e.g., React Hooks Deep Dive"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950/50 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label
                      htmlFor="session-time"
                      className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Start Time
                    </label>
                    <input
                      id="session-time"
                      type="datetime-local"
                      value={startsAt}
                      onChange={(event) => setStartsAt(event.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950/50 dark:text-white dark:focus:border-indigo-500 [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="session-duration"
                      className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Duration (Mins)
                    </label>
                    <input
                      id="session-duration"
                      type="number"
                      min="5"
                      max="480"
                      value={duration}
                      onChange={(event) => setDuration(event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950/50 dark:text-white dark:focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  <CalendarPlus size={13} />
                  <span>{loading ? 'Adding…' : 'Add Session'}</span>
                </button>
              </form>

              {message && (
                <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 p-2 text-[11px] font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{message}</span>
                </div>
              )}
            </div>
          </div>

          {/* List Panel */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900">
              <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <Calendar size={14} />
                  </span>
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                    Scheduled Sessions
                  </h2>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                  Timeline
                </span>
              </div>

              {sessions.length ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="group flex items-center justify-between gap-2 p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg"
                    >
                      <div className="min-w-0 flex-1">
                        <strong className="block truncate text-xs font-semibold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                          {session.title}
                        </strong>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={10} className="text-slate-400 dark:text-slate-500" />
                            {new Date(session.starts_at).toLocaleString([], {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600 dark:text-amber-400">
                            <Clock size={10} />
                            {session.duration_minutes}m
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(session.id)}
                        aria-label={`Delete ${session.title}`}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-500">
                    <Calendar size={18} />
                  </span>
                  <strong className="text-xs font-bold text-slate-900 dark:text-white">
                    No sessions scheduled
                  </strong>
                  <p className="mt-0.5 max-w-xs text-[11px] text-slate-500 dark:text-slate-400">
                    Your planned study sessions will appear here once added.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </UserShell>
  );
}