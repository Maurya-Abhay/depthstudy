'use client';

import { useEffect, useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  LockKeyhole,
  Clock,
  X,
  Loader2,
} from 'lucide-react';
import { UserShell } from '@/app/user/(protected)/_components/user-shell';

type Project = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  premium: boolean;
  requirements?: string[];
};

type Mine = {
  id: string;
  status: string;
  progress: number;
  project_id: string;
  projects?: Project | null;
};

type Milestone = {
  id: string;
  title: string;
  description: string;
  sort_order: number;
  target_minutes: number;
  required: boolean;
};

type MilestoneProgress = {
  milestone_id: string;
  status: 'pending' | 'active' | 'completed';
};

type Workspace = {
  enrollment: Mine | null;
  milestones: Milestone[];
  progress: MilestoneProgress[];
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [mine, setMine] = useState<Mine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Mine | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  // Form states
  const [repo, setRepo] = useState('');
  const [demo, setDemo] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const r = await fetch('/api/projects', { cache: 'no-store' });
      const d = await r.json();
      setProjects(d.projects ?? []);
      setMine(d.mine ?? []);
    } catch {
      setProjects([]);
      setMine([]);
      setMessage('Failed to fetch projects.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetWorkspaceModal() {
    setSelected(null);
    setWorkspace(null);
    setRepo('');
    setDemo('');
    setNotes('');
  }

  async function enroll(projectId: string) {
    setBusy(true);
    try {
      const r = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'enroll', projectId }),
      });
      const d = await r.json();
      setMessage(r.ok ? 'Project added to your plan.' : (d.error ?? 'Could not start project'));
      await load();
    } catch {
      setMessage('Network error while enrolling.');
    } finally {
      setBusy(false);
    }
  }

  async function openProject(m: Mine) {
    setBusy(true);
    setSelected(m);
    try {
      const r = await fetch(`/api/projects?enrollmentId=${encodeURIComponent(m.id)}`, {
        cache: 'no-store',
      });
      const d = await r.json();
      setWorkspace(d.workspace ?? null);
    } catch {
      setMessage('Failed to load project workspace.');
    } finally {
      setBusy(false);
    }
  }

  async function updateMilestone(milestoneId: string, status: 'pending' | 'active' | 'completed') {
    if (!selected) return;
    setBusy(true);
    try {
      const r = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'milestone',
          enrollmentId: selected.id,
          milestoneId,
          status,
        }),
      });
      const d = await r.json();
      if (r.ok) {
        await openProject(selected);
      } else {
        setMessage(d.error ?? 'Could not update milestone');
      }
    } catch {
      setMessage('Error updating milestone status.');
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!selected) return;
    setBusy(true);
    try {
      const r = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          enrollmentId: selected.id,
          projectId: selected.project_id,
          repoUrl: repo,
          demoUrl: demo,
          notes,
        }),
      });
      const d = await r.json();
      setMessage(r.ok ? 'Project submitted for review.' : (d.error ?? 'Could not submit project'));
      if (r.ok) {
        resetWorkspaceModal();
        await load();
      }
    } catch {
      setMessage('Network error during project submission.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <UserShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800/80">
          <div>
            <h1 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Projects
            </h1>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Turn learning into portfolio evidence. Complete milestones, submit work, and gain verified proof.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <Sparkles size={13} /> {projects.length} Available
          </span>
        </div>

        {/* Global Notification Banner */}
        {message && (
          <div className="flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <span>{message}</span>
            <button
              onClick={() => setMessage('')}
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* My Active Projects */}
        {mine.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              My Active Projects
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {mine.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition dark:border-slate-800/80 dark:bg-[#121824] dark:shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {m.projects?.title ?? 'Project'}
                      </h3>
                      <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold capitalize text-indigo-600 dark:text-indigo-400">
                        {m.status}
                      </span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-500"
                        style={{ width: `${m.progress}%` }}
                      />
                    </div>
                    <div className="mt-2 text-right text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {m.progress}% complete
                    </div>
                  </div>
                  <button
                    disabled={busy}
                    onClick={() => openProject(m)}
                    className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white disabled:opacity-50"
                  >
                    {busy && selected?.id === m.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      'Open Workspace'
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Project Library */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Project Library
          </h2>

          {loading ? (
            <div className="flex h-48 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-[#121824] dark:text-slate-400">
              <Loader2 size={16} className="animate-spin text-indigo-500" />
              Loading projects…
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => {
                const enrolled = mine.some((m) => m.project_id === p.id);
                return (
                  <article
                    key={p.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 dark:border-slate-800/80 dark:bg-[#121824] dark:shadow-lg dark:hover:border-slate-700"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black tracking-wider uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {p.difficulty}
                        </span>
                        {p.premium && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            <LockKeyhole size={11} /> PRO
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                        {p.title}
                      </h3>
                      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        {p.description}
                      </p>

                      {p.requirements && p.requirements.length > 0 && (
                        <div className="mt-4 space-y-1 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                          {p.requirements.slice(0, 3).map((req, i) => (
                            <div key={i} className="line-clamp-1">
                              • {req}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      disabled={enrolled || busy}
                      onClick={() => enroll(p.id)}
                      className={`mt-5 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-xs font-bold transition disabled:opacity-50 ${
                        enrolled
                          ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500'
                      }`}
                    >
                      {enrolled ? 'Enrolled' : p.premium ? 'Unlock Pro Project' : 'Start Project'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Modal Workspace Drawer */}
        {selected && workspace && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm dark:bg-black/80">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#121824]">
              {/* Workspace Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Project Workspace
                  </span>
                  <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                    {workspace.enrollment?.projects?.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Complete all required milestones before submitting your work for review.
                  </p>
                </div>
                <button
                  onClick={resetWorkspaceModal}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Milestones List */}
              <div className="mt-5 space-y-3">
                {workspace.milestones.map((m) => {
                  const progress = workspace.progress.find((x) => x.milestone_id === m.id);
                  const status = progress?.status ?? 'pending';

                  return (
                    <div
                      key={m.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {m.sort_order}. {m.title}
                          </h3>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                            {m.description}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <Clock size={11} /> ~{m.target_minutes} min
                            </span>
                            {m.required && (
                              <span className="font-semibold text-amber-600 dark:text-amber-400">
                                • Required
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                            status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="mt-3 flex gap-2">
                        {status !== 'completed' ? (
                          <button
                            disabled={busy}
                            onClick={() =>
                              updateMilestone(m.id, status === 'active' ? 'completed' : 'active')
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
                          >
                            {status === 'active' ? 'Mark Complete' : 'Start Milestone'}
                          </button>
                        ) : (
                          <button
                            disabled={busy}
                            onClick={() => updateMilestone(m.id, 'active')}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white disabled:opacity-50"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress Summary */}
              <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={16} /> Progress: {workspace.enrollment?.progress ?? 0}%
                </div>
                <p className="mt-0.5 text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
                  Submission unlocks when all required milestones reach 100%.
                </p>
              </div>

              {/* Submission Form */}
              <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Submission Details
                </h3>
                <div className="mt-3 space-y-3">
                  <input
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    placeholder="Repository URL (e.g., GitHub) *"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-white"
                  />
                  <input
                    value={demo}
                    onChange={(e) => setDemo(e.target.value)}
                    placeholder="Live Demo URL (optional)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-white"
                  />
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="What did you build? Mention key technical trade-offs or architecture decisions..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-white"
                  />
                  <button
                    disabled={
                      busy || Number(workspace.enrollment?.progress ?? 0) < 100 || !repo.trim()
                    }
                    onClick={submit}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-40"
                  >
                    Submit for Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserShell>
  );
}