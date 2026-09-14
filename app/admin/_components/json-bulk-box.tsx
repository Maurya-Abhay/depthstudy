'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardPaste, Eye, RotateCcw, Upload, FileCode2 } from 'lucide-react';

export function JsonBulkBox({
  endpoint,
  title,
  description,
  example,
  onImported,
  beforeSend,
  recordDefaults,
  syncFields,
}: {
  endpoint: string;
  title: string;
  description: string;
  example: string;
  onImported?: () => void;
  beforeSend?: (records: Record<string, unknown>[]) => Record<string, unknown>[];
  recordDefaults?: Record<string, unknown>;
  syncFields?: Record<string, unknown>;
}) {
  const [value, setValue] = useState(example);
  const [preview, setPreview] = useState<Record<string, unknown>[] | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!syncFields) return;
    try {
      const parsed = JSON.parse(value);
      const records: unknown[] | null = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.items)
        ? parsed.items
        : Array.isArray(parsed.records)
        ? parsed.records
        : null;
      if (!records) return;
      setValue(
        JSON.stringify(
          records.map((record) => ({ ...(record as Record<string, unknown>), ...syncFields })),
          null,
          2
        )
      );
      setPreview(null);
    } catch {
      // Keep invalid user input untouched until it can be parsed.
    }
  }, [syncFields]);

  useEffect(() => {
    if (!endpoint.includes('kind=dsa')) return;
    function syncDsaTopic(event: Event) {
      const select = event.target as HTMLSelectElement;
      if (!select.matches('select') || !select.value) return;
      const label = select.previousElementSibling?.textContent ?? '';
      if (!label.includes('Target Topic')) return;
      try {
        const parsed = JSON.parse(value);
        const records: unknown[] | null = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.items)
          ? parsed.items
          : Array.isArray(parsed.records)
          ? parsed.records
          : null;
        if (!records) return;
        const updated = JSON.stringify(
          records.map((record) => ({ ...(record as Record<string, unknown>), topicId: select.value })),
          null,
          2
        );
        if (updated !== value) {
          setValue(updated);
          setPreview(null);
        }
      } catch {
        return;
      }
    }
    document.addEventListener('change', syncDsaTopic);
    return () => document.removeEventListener('change', syncDsaTopic);
  }, [endpoint, value]);

  const prettyCount = useMemo(() => preview?.length ?? 0, [preview]);

  function extract(): Record<string, unknown>[] {
    const parsed = JSON.parse(value);
    const records: unknown[] | null = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.items)
      ? parsed.items
      : Array.isArray(parsed.records)
      ? parsed.records
      : null;
    if (!records) throw new Error('Paste a JSON array or an object containing items/records.');
    if (records.some((item) => !item || typeof item !== 'object' || Array.isArray(item)))
      throw new Error('Every JSON item must be an object.');
    return records as Record<string, unknown>[];
  }

  function parse() {
    setMessage('');
    try {
      const records = extract();
      setPreview(
        beforeSend
          ? beforeSend(records)
          : records.map((record) => ({ ...record, ...recordDefaults }))
      );
    } catch (error) {
      setPreview(null);
      setMessage(error instanceof Error ? error.message : 'Invalid JSON.');
    }
  }

  async function importRecords() {
    setBusy(true);
    setMessage('');
    try {
      // Import works even without pressing Preview first, and beforeSend is
      // always re-applied so the latest Target Topic is used for every record.
      const raw = preview?.length ? preview : extract();
      const records = beforeSend ? beforeSend(raw) : raw;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'bulk', records }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Import failed.');
      setMessage(`${data.imported ?? records.length} records imported as saved database content.`);
      onImported?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-[#121824] p-5 shadow-xl space-y-4">
      {/* Component Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            <ClipboardPaste size={13} /> Bulk JSON Utility
          </div>
          <h2 className="mt-0.5 text-lg font-black tracking-tight text-white">{title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>

        {preview ? (
          <span className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
            <CheckCircle2 size={13} /> {prettyCount} Ready
          </span>
        ) : null}
      </div>

      {/* Code Editor Container */}
      <div className="relative rounded-xl border border-slate-800 bg-slate-950/80 p-1">
        <textarea
          className="w-full h-56 rounded-lg bg-transparent p-3 text-xs font-mono text-indigo-200 placeholder-slate-600 focus:outline-none resize-y scrollbar-thin scrollbar-thumb-slate-800 leading-relaxed"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setPreview(null);
          }}
          spellCheck={false}
          aria-label="Bulk JSON input"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:border-slate-700 transition active:scale-95"
          onClick={() => setValue(example)}
        >
          <RotateCcw size={13} /> Reset Example
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition active:scale-95"
          onClick={parse}
        >
          <Eye size={13} /> Preview
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition active:scale-95 disabled:opacity-50"
          onClick={importRecords}
          disabled={busy}
        >
          <Upload size={13} /> {busy ? 'Importing...' : 'Import'}
        </button>
      </div>

      {/* JSON Preview Output */}
      {preview ? (
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            <FileCode2 size={13} className="text-indigo-400" />
            Validated Output Preview:
          </div>
          <pre className="max-h-48 overflow-y-auto rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-[11px] font-mono text-emerald-400/90 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
            {JSON.stringify(preview, null, 2)}
          </pre>
        </div>
      ) : null}

      {/* Error or Success Notice */}
      {message ? (
        <div
          className={`rounded-xl border p-3 text-xs font-medium ${
            message.includes('imported')
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          {message}
        </div>
      ) : null}
    </section>
  );
}