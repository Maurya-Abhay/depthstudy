'use client';

import { useState } from 'react';
import {
  Maximize2,
  Minimize2,
  Save,
  FileText,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

type Note = {
  id: string;
  content: string;
  updatedAt: string;
  topicTitle: string;
  topicSlug?: string;
  topicId?: string;
};

export function NotesPanel({ notes }: { notes: Note[] }) {
  const [selectedId, setSelectedId] = useState(notes[0]?.id ?? '');
  const [expanded, setExpanded] = useState(true);
  const [content, setContent] = useState(notes[0]?.content ?? '');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const selected = notes.find((note) => note.id === selectedId) ?? notes[0];

  function selectNote(note: Note) {
    setSelectedId(note.id);
    setContent(note.content);
    setExpanded(true);
    setMessage(null);
  }

  async function saveNote() {
    if (!selected || !selected.topicId) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topicId: selected.topicId, content }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage({ text: data.error || 'Unable to save note.', isError: true });
      } else {
        setMessage({ text: 'Note saved successfully!', isError: false });
        selected.content = content;
        selected.updatedAt = new Date().toISOString();
      }
    } catch {
      setMessage({ text: 'Network error. Try saving again.', isError: true });
    } finally {
      setSaving(false);
    }
  }

  /* Empty State View */
  if (!notes.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] p-10 text-center shadow-sm dark:shadow-xl">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400">
          <Save size={22} />
        </div>
        <strong className="text-sm font-bold text-slate-900 dark:text-white">No saved notes yet</strong>
        <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
          Add notes from any topic workspace and they will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] p-5 shadow-sm dark:shadow-xl lg:grid-cols-12">
      {/* Sidebar: Saved Notes Navigation */}
      <aside
        className="lg:col-span-4 flex flex-col space-y-3 border-b border-slate-200 dark:border-slate-800 pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5"
        aria-label="Saved notes"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2.5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Workspace Notes
            </span>
            <strong className="block text-xs font-bold text-slate-900 dark:text-white">
              {notes.length} {notes.length === 1 ? 'Saved Note' : 'Saved Notes'}
            </strong>
          </div>
        </div>

        <div className="space-y-1.5 overflow-y-auto max-h-[420px] pr-1">
          {notes.map((note) => {
            const isActive = note.id === selected?.id;
            return (
              <button
                type="button"
                key={note.id}
                onClick={() => selectNote(note)}
                className={`w-full text-left rounded-xl border p-2.5 transition flex flex-col gap-1 ${
                  isActive
                    ? 'border-indigo-500/40 bg-indigo-500/10 text-slate-900 dark:text-white shadow-sm'
                    : 'border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {note.topicTitle}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                    <Clock size={10} />
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <p className="line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  {note.content || 'Empty note...'}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Content: Note Editor Panel */}
      {selected && (
        <section className="lg:col-span-8 flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            {/* Header Toolbar */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Note Details
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{selected.topicTitle}</h2>
                <p className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  <Clock size={11} className="text-slate-400 dark:text-slate-500" />
                  <span>Last updated: {new Date(selected.updatedAt).toLocaleDateString()}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExpanded((value) => !value)}
                  aria-label={expanded ? 'Minimize note' : 'Maximize note'}
                  title={expanded ? 'Minimize note' : 'Maximize note'}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition"
                >
                  {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
              </div>
            </div>

            {/* Note Editor Body */}
            {expanded ? (
              <div className="space-y-3">
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  aria-label={`Edit note for ${selected.topicTitle}`}
                  placeholder="Type your notes here..."
                  className="w-full h-[320px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-3.5 font-sans text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/60 resize-none shadow-inner leading-relaxed"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={saveNote}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    <span>{saving ? 'Saving...' : 'Save Note'}</span>
                  </button>

                  {message && (
                    <div
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border ${
                        message.isError
                          ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {message.isError ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
                      <span>{message.text}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 p-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed min-h-[100px]">
                <div className="flex items-center gap-1.5 mb-2 text-slate-400 dark:text-slate-500 font-semibold uppercase text-[10px]">
                  <FileText size={11} />
                  <span>Preview</span>
                </div>
                <p className="whitespace-pre-wrap">{content || 'This note is empty.'}</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}