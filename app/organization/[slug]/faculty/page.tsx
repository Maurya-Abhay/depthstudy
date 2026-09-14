'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  UserPlus, 
  FileSpreadsheet, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  KeyRound, 
  Eye, 
  UploadCloud,
  FileText,
  UserCheck,
  GraduationCap
} from 'lucide-react';
import { 
  PageHeader, 
  Message, 
  Loading, 
  inputCls, 
  selectCls, 
  buttonCls, 
  borderCls, 
  apiPost, 
  useOrgFetch 
} from '../../_components/portal-ui';

type Data = { jobs: any[] };
type Dept = { id: string; name: string };
type Structure = { departments: Dept[] };

export default function FacultyPage() {
  const { slug } = useParams<{ slug: string }>();
  const { ctx, data, loading, error, reload } = useOrgFetch<Data>(slug, '/api/organization/faculty');
  const { data: structure } = useOrgFetch<Structure>(slug, '/api/organization/structure', { all: '1' });
  
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'history'>('single');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: string; e: boolean } | null>(null);
  const [f, setF] = useState({ name: '', email: '', password: '', departmentId: '', designation: '', employeeId: '' });
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<any[] | null>(null);
  const [parsed, setParsed] = useState<Record<string, string>[]>([]);
  const [report, setReport] = useState<any | null>(null);
  const [creds, setCreds] = useState('');
  const [copied, setCopied] = useState(false);

  if (ctx.loading || loading) return <Loading />;
  if (ctx.error || error) return <Message text={ctx.error || error} error />;
  const canManage = ctx.role === 'owner' || ctx.role === 'admin';

  async function handleSingleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!ctx.orgId) return;
    setBusy(true); setMsg(null); setCreds('');
    try {
      const d = await apiPost(ctx.orgId, '/api/organization/faculty', { 
        action: 'add_one', 
        ...f, 
        departmentId: f.departmentId || null 
      });
      if (d.faculty?.credentials) {
        setCreds(`Email: ${d.faculty.credentials.email} · Password: ${d.faculty.credentials.password}`);
      }
      setMsg({ t: 'Faculty member added successfully.', e: false });
      setF({ name: '', email: '', password: '', departmentId: '', designation: '', employeeId: '' });
      await reload();
    } catch (err) { 
      setMsg({ t: err instanceof Error ? err.message : 'Failed to add faculty member', e: true }); 
    } finally { 
      setBusy(false); 
    }
  }

  async function doPreview() {
    if (!ctx.orgId || !csv.trim()) return;
    setBusy(true); setMsg(null);
    try {
      const d = await apiPost(ctx.orgId, '/api/organization/faculty', { action: 'preview', csv });
      setPreview(d.preview?.rows ?? []);
      setParsed(d.rows ?? []);
    } catch (err) { 
      setMsg({ t: err instanceof Error ? err.message : 'Validation failed', e: true }); 
    } finally { 
      setBusy(false); 
    }
  }

  async function doImport() {
    if (!ctx.orgId || !parsed.length) return;
    setBusy(true); setMsg(null);
    try {
      const d = await apiPost(ctx.orgId, '/api/organization/faculty', { action: 'import', rows: parsed });
      setReport(d.job?.result ?? null);
      setMsg({ t: 'Bulk import complete.', e: false });
      await reload();
    } catch (err) { 
      setMsg({ t: err instanceof Error ? err.message : 'Import failed', e: true }); 
    } finally { 
      setBusy(false); 
    }
  }

  const copyCredentials = () => {
    if (!creds) return;
    navigator.clipboard.writeText(creds);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5 font-sans text-xs antialiased">
      {/* Header */}
      <PageHeader 
        title="Faculty & Staff Directory" 
        subtitle={`Manage teaching staff and onboarding for ${slug.toUpperCase()}`} 
      />

      {/* Notification Banner */}
      <Message text={msg?.t ?? null} error={msg?.e ?? false} />

      {/* Tabs */}
      {canManage && (
        <div className="flex border-b border-slate-200/80 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-semibold transition-all ${
              activeTab === 'single'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus size={15} />
            <span>Add Faculty</span>
          </button>

          <button
            onClick={() => setActiveTab('bulk')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-semibold transition-all ${
              activeTab === 'bulk'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet size={15} />
            <span>CSV Import</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-semibold transition-all ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <History size={15} />
            <span>Import History ({data?.jobs?.length ?? 0})</span>
          </button>
        </div>
      )}

      {/* TAB 1: DIRECT ADD FACULTY */}
      {canManage && activeTab === 'single' && (
        <section className={`${borderCls} p-5`}>
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add Faculty Member</h2>
            <p className="mt-0.5 text-slate-500 dark:text-slate-400">
              Create an account with initial access password.
            </p>
          </div>

          <form onSubmit={handleSingleAdd} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Full Name *</label>
                <input 
                  value={f.name} 
                  onChange={(e) => setF({ ...f, name: e.target.value })} 
                  placeholder="e.g. Dr. Robert Bruce" 
                  className={inputCls} 
                  required 
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Email Address *</label>
                <input 
                  type="email"
                  value={f.email} 
                  onChange={(e) => setF({ ...f, email: e.target.value })} 
                  placeholder="robert@college.edu" 
                  className={inputCls} 
                  required 
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Password * (Min 8 chars)</label>
                <input 
                  type="password" 
                  value={f.password} 
                  onChange={(e) => setF({ ...f, password: e.target.value })} 
                  placeholder="••••••••" 
                  className={inputCls} 
                  required 
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Employee / Staff ID</label>
                <input 
                  value={f.employeeId} 
                  onChange={(e) => setF({ ...f, employeeId: e.target.value })} 
                  placeholder="e.g. FAC-2026-09" 
                  className={inputCls} 
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Designation</label>
                <input 
                  value={f.designation} 
                  onChange={(e) => setF({ ...f, designation: e.target.value })} 
                  placeholder="e.g. Associate Professor" 
                  className={inputCls} 
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Department</label>
                <select value={f.departmentId} onChange={(e) => setF({ ...f, departmentId: e.target.value })} className={selectCls}>
                  <option value="">Select Department</option>
                  {(structure?.departments ?? []).map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={busy || !f.name.trim() || !f.email.trim() || f.password.length < 8} 
                className={buttonCls}
              >
                <UserCheck size={14} />
                <span>{busy ? 'Creating...' : 'Enroll Faculty Member'}</span>
              </button>
            </div>
          </form>

          {/* Credentials Display */}
          {creds && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <KeyRound size={16} className="shrink-0" />
                <span className="font-mono text-[11px] font-semibold">{creds}</span>
              </div>
              <button 
                onClick={copyCredentials} 
                className="inline-flex items-center gap-1 rounded bg-emerald-200/60 px-2 py-1 text-[10px] font-bold text-emerald-800 transition-colors hover:bg-emerald-200 dark:bg-emerald-900/80 dark:text-emerald-200"
              >
                <Copy size={12} />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: BULK IMPORT */}
      {canManage && activeTab === 'bulk' && (
        <section className={`${borderCls} p-5`}>
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Bulk CSV Onboarding</h2>
            <p className="mt-0.5 text-slate-500 dark:text-slate-400">
              Required CSV headers: <code className="font-mono text-indigo-600 dark:text-indigo-400">name, email, department, designation</code>
            </p>
          </div>

          <textarea 
            value={csv} 
            onChange={(e) => setCsv(e.target.value)} 
            rows={8} 
            placeholder={'name,email,department,designation\nDr. Alan Turing,alan@college.edu,Computer Science,Head of Department\nDr. Grace Hopper,grace@college.edu,Information Technology,Professor'} 
            className={`${inputCls} font-mono text-[11px] leading-relaxed`} 
          />

          <div className="mt-3 flex gap-2">
            <button disabled={busy || !csv.trim()} onClick={doPreview} className={buttonCls}>
              <Eye size={14} />
              <span>{busy ? 'Validating...' : 'Validate CSV Records'}</span>
            </button>
            {preview && (
              <button disabled={busy || !parsed.length} onClick={doImport} className={buttonCls}>
                <UploadCloud size={14} />
                <span>Execute Import ({parsed.length} Valid)</span>
              </button>
            )}
          </div>

          {/* Validation Table */}
          {preview && (
            <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Validation Results: <span className="text-emerald-600 dark:text-emerald-400">{preview.filter((r) => r.valid).length} Valid</span> · <span className="text-rose-600 dark:text-rose-400">{preview.filter((r) => !r.valid).length} Errors</span>
              </p>
              
              <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-200/80 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="space-y-1.5">
                  {preview.map((r) => (
                    <div 
                      key={r.index} 
                      className={`flex items-center justify-between rounded-md p-2 text-[11px] font-medium transition-colors ${
                        r.valid 
                          ? 'bg-emerald-50/80 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' 
                          : 'bg-rose-50/80 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {r.valid ? <CheckCircle2 size={13} className="shrink-0 text-emerald-600 dark:text-emerald-400" /> : <AlertCircle size={13} className="shrink-0 text-rose-600 dark:text-rose-400" />}
                        <span>#{r.index} — {r.name || r.email || 'Row entry'}</span>
                      </div>
                      {!r.valid && <span className="font-normal opacity-90">{r.errors?.join(', ')}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Report */}
          {report && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="font-bold text-slate-900 dark:text-slate-100">Import Processing Summary</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 sm:grid-cols-4">
                <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-950"><span className="block font-bold text-slate-900 dark:text-slate-100">{report.added}</span> Added</div>
                <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-950"><span className="block font-bold text-slate-900 dark:text-slate-100">{report.invited}</span> Invited</div>
                <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-950"><span className="block font-bold text-slate-900 dark:text-slate-100">{report.skipped}</span> Skipped</div>
                <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-950"><span className="block font-bold text-slate-900 dark:text-slate-100">{report.duplicates}</span> Duplicates</div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: HISTORY */}
      {activeTab === 'history' && (
        <section className={`${borderCls} p-5`}>
          <div className="mb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Batch Processing Logs</h2>
            <p className="mt-0.5 text-slate-500 dark:text-slate-400">Historical overview of previous faculty CSV imports.</p>
          </div>

          {(data?.jobs ?? []).length ? (
            <div className="space-y-2">
              {(data?.jobs ?? []).map((j: any) => (
                <div 
                  key={j.id} 
                  className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50/40 p-3 transition-colors dark:border-slate-800 dark:bg-slate-950/30"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{j.filename || 'CSV Import Job'}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">ID: {j.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      {j.status}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Added: <strong className="text-slate-800 dark:text-slate-200">{j.added_count}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
              No historical batch import logs found.
            </div>
          )}
        </section>
      )}
    </div>
  );
}