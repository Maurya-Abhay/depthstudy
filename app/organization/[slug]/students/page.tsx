'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  UserPlus, 
  FileSpreadsheet, 
  History, 
  Users,
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  KeyRound, 
  Eye, 
  UploadCloud,
  FileText,
  UserCheck,
  Building,
  Layers
} from 'lucide-react';
import { 
  PageHeader, 
  Message, 
  Loading, 
  inputCls, 
  selectCls, 
  buttonCls, 
  buttonSecondaryCls,
  borderCls, 
  apiPost, 
  useOrgFetch 
} from '../../_components/portal-ui';

// Updated type definitions
type Student = { id: string; user: { name: string; email: string }; department?: { name: string }; batch?: { name: string }; roll_number?: string };
type Data = { 
  jobs: any[]; 
  students: Student[]; 
  total_students: number; 
  page: number; 
  total_pages: number; 
};
type Dept = { id: string; name: string };
type Batch = { id: string; name: string };
type Structure = { departments: Dept[]; batches: Batch[] };

export default function StudentsPage() {
  const { slug } = useParams<{ slug: string }>();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'all' | 'single' | 'bulk' | 'history'>('all');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 20; // Hardcoded or dynamic

  // Data Fetching hooks
  const { ctx, data, loading, error, reload } = useOrgFetch<Data>(
    slug, 
    '/api/organization/students', 
    { page: currentPage.toString(), limit: studentsPerPage.toString() }
  );
  
  const { data: structure } = useOrgFetch<Structure>(
    slug, 
    '/api/organization/structure', 
    { all: '1' }
  );
  
  // Local UI States
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: string; e: boolean } | null>(null);
  const [s, setS] = useState({ name: '', email: '', departmentId: '', batchId: '', rollNumber: '' });
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<any[] | null>(null);
  const [parsed, setParsed] = useState<Record<string, string>[]>([]);
  const [report, setReport] = useState<any | null>(null);
  const [creds, setCreds] = useState('');
  const [copied, setCopied] = useState(false);

  if (ctx.loading || loading) return <Loading />;
  if (ctx.error || error) return <Message text={ctx.error || error} error />;
  const canManage = ctx.role === 'owner' || ctx.role === 'admin';

  // --- API Actions ---

  async function handleSingleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!ctx.orgId) return;
    setBusy(true); setMsg(null); setCreds('');
    try {
      // Note: No password sent here, server will generate one
      const d = await apiPost(ctx.orgId, '/api/organization/students', { 
        action: 'add_one', 
        ...s, 
        departmentId: s.departmentId || null, 
        batchId: s.batchId || null 
      });
      if (d.student?.credentials) {
        setCreds(`Email: ${d.student.credentials.email} · System Password: ${d.student.credentials.password}`);
      }
      setMsg({ t: 'Student added successfully. Direct login enabled.', e: false });
      setS({ name: '', email: '', departmentId: '', batchId: '', rollNumber: '' });
      await reload();
    } catch (err) { 
      setMsg({ t: err instanceof Error ? err.message : 'Failed to add student', e: true }); 
    } finally { 
      setBusy(false); 
    }
  }

  async function doPreview() {
    if (!ctx.orgId || !csv.trim()) return;
    setBusy(true); setMsg(null);
    try {
      // Server will validate CSV has required 'password' column now
      const d = await apiPost(ctx.orgId, '/api/organization/students', { action: 'preview', csv });
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
      const d = await apiPost(ctx.orgId, '/api/organization/students', { 
        action: 'import', 
        rows: parsed
        // No defaultPassword sent here, using pass from CSV rows
      });
      setReport(d.job?.result ?? null);
      setMsg({ t: 'Bulk import completed!', e: false });
      await reload();
    } catch (err) { 
      setMsg({ t: err instanceof Error ? err.message : 'Import failed', e: true }); 
    } finally { 
      setBusy(false); 
    }
  }

  // --- UI Helpers ---

  const copyCredentials = () => {
    if (!creds) return;
    navigator.clipboard.writeText(creds);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (data?.total_pages ?? 1)) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-5 font-sans text-xs antialiased">
      {/* Header */}
      <PageHeader 
        title="Student Directory" 
        subtitle={`Manage enrolments and admissions for ${slug.toUpperCase()}`} 
      />

      {/* Global Notification Banner */}
      <Message text={msg?.t ?? null} error={msg?.e ?? false} />

      {/* Tab Navigation (4 Tabs now) */}
      <div className="flex border-b border-slate-200/80 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-semibold transition-all ${
            activeTab === 'all'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Users size={15} />
          <span>All Students ({data?.total_students ?? 0})</span>
        </button>

        {canManage && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-semibold transition-all ${
                activeTab === 'single'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus size={15} />
              <span>Direct Add</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bulk')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-semibold transition-all ${
                activeTab === 'bulk'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            >
              <FileSpreadsheet size={15} />
              <span>Bulk CSV Admission</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-semibold transition-all ${
                activeTab === 'history'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <History size={15} />
              <span>Import Logs ({data?.jobs?.length ?? 0})</span>
            </button>
          </>
        )}
      </div>

      {/* TAB: ALL STUDENTS with Pagination */}
      {activeTab === 'all' && (
        <section className={`${borderCls} p-5`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Enrolled Students</h2>
            {/* Optional: Add search bar here */}
          </div>

          {(data?.students ?? []).length ? (
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-3 border-b border-slate-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800/80">
                <span className="col-span-2">Name / Email</span>
                <span>Roll No</span>
                <span>Department</span>
                <span>Batch</span>
              </div>
              {(data?.students ?? []).map((stu) => (
                <div 
                  key={stu.id} 
                  className="grid grid-cols-5 items-center gap-3 rounded-lg border border-slate-200/80 bg-slate-50/40 p-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/30 dark:hover:bg-slate-800/40"
                >
                  <div className="col-span-2 truncate">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{stu.user.name}</p>
                    <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{stu.user.email}</p>
                  </div>
                  <span className="font-mono text-slate-600 dark:text-slate-400">{stu.roll_number || '—'}</span>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Building size={13} className="shrink-0 text-slate-400" />
                    <span className="truncate">{stu.department?.name || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Layers size={13} className="shrink-0 text-slate-400" />
                    <span className="truncate">{stu.batch?.name || '—'}</span>
                  </div>
                </div>
              ))}

              {/* Pagination Controls */}
              {data && data.total_pages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800/80">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className={`${buttonSecondaryCls} px-2.5 py-1 text-[11px] disabled:opacity-50`}
                  >
                    Previous
                  </button>
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    Page {currentPage} of {data.total_pages}
                  </span>
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    disabled={currentPage === data.total_pages}
                    className={`${buttonSecondaryCls} px-2.5 py-1 text-[11px] disabled:opacity-50`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
              No students enrolled in this organization yet.
            </div>
          )}
        </section>
      )}

      {/* TAB: DIRECT ADD SINGLE STUDENT (No Password Field) */}
      {canManage && activeTab === 'single' && (
        <section className={`${borderCls} p-5`}>
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add Student (Direct Provisioning)</h2>
            <p className="mt-0.5 text-slate-500 dark:text-slate-400">
              Instantly create an active student account. Password will be generated by the system.
            </p>
          </div>

          <form onSubmit={handleSingleAdd} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Full Name *</label>
                <input 
                  value={s.name} 
                  onChange={(e) => setS({ ...s, name: e.target.value })} 
                  placeholder="e.g. John Doe" 
                  className={inputCls} 
                  required 
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Email Address *</label>
                <input 
                  type="email"
                  value={s.email} 
                  onChange={(e) => setS({ ...s, email: e.target.value })} 
                  placeholder="john@college.edu" 
                  className={inputCls} 
                  required 
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Roll / Registration Number</label>
                <input 
                  value={s.rollNumber} 
                  onChange={(e) => setS({ ...s, rollNumber: e.target.value })} 
                  placeholder="e.g. 2026-BCA-042" 
                  className={inputCls} 
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Department</label>
                <select value={s.departmentId} onChange={(e) => setS({ ...s, departmentId: e.target.value })} className={selectCls}>
                  <option value="">Select Department</option>
                  {(structure?.departments ?? []).map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Batch</label>
                <select value={s.batchId} onChange={(e) => setS({ ...s, batchId: e.target.value })} className={selectCls}>
                  <option value="">Select Batch</option>
                  {(structure?.batches ?? []).map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={busy || !s.name.trim() || !s.email.trim()} 
                className={buttonCls}
              >
                <UserCheck size={14} />
                <span>{busy ? 'Creating...' : 'Enroll Student'}</span>
              </button>
            </div>
          </form>

          {/* Credentials Display Box */}
          {creds && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <KeyRound size={16} className="shrink-0" />
                <span className="font-mono text-[11px] font-semibold">{creds}</span>
              </div>
              <button 
                type="button"
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

      {/* TAB: BULK ADMISSION CSV (With Password Column) */}
      {canManage && activeTab === 'bulk' && (
        <section className={`${borderCls} p-5`}>
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Bulk CSV Admission Workspace</h2>
            <p className="mt-0.5 text-slate-500 dark:text-slate-400">
              Paste comma-separated student records with required column headers: <code className="font-mono text-indigo-600 dark:text-indigo-400">name, email, password, department, batch</code>
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">CSV Content Data</label>
              <textarea 
                value={csv} 
                onChange={(e) => setCsv(e.target.value)} 
                rows={7} 
                placeholder={'name,email,password,department,batch\nAlice Green,alice@domain.edu,SystemPass@123,Computer Science,BCA 2026\nBob Smith,bob@domain.edu, سسٹمپاس@321,Information Technology,MCA 2025'} 
                className={`${inputCls} font-mono text-[11px] leading-relaxed`} 
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" disabled={busy || !csv.trim()} onClick={doPreview} className={buttonCls}>
                <Eye size={14} />
                <span>{busy ? 'Validating...' : 'Validate CSV Records'}</span>
              </button>
              {preview && (
                <button type="button" disabled={busy || !parsed.length} onClick={doImport} className={buttonCls}>
                  <UploadCloud size={14} />
                  <span>Execute Admission ({parsed.length} Valid)</span>
                </button>
              )}
            </div>
          </div>

          {/* Validation Table Stream */}
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

          {/* Import Execution Report */}
          {report && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="font-bold text-slate-900 dark:text-slate-100">Admission Processing Summary</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 sm:grid-cols-4">
                <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-950"><span className="block font-bold text-slate-900 dark:text-slate-100">{report.added}</span> Enrolled</div>
                <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-950"><span className="block font-bold text-slate-900 dark:text-slate-100">{report.invited}</span> Invited</div>
                <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-950"><span className="block font-bold text-slate-900 dark:text-slate-100">{report.skipped}</span> Skipped</div>
                <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-950"><span className="block font-bold text-slate-900 dark:text-slate-100">{report.duplicates}</span> Duplicates</div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB: IMPORT LOGS */}
      {canManage && activeTab === 'history' && (
        <section className={`${borderCls} p-5`}>
          <div className="mb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Batch Processing Logs</h2>
            <p className="mt-0.5 text-slate-500 dark:text-slate-400">Historical overview of previous student CSV admissions.</p>
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
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{j.filename || 'CSV Admission Job'}</p>
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
              No historical batch admission logs found for this organization.
            </div>
          )}
        </section>
      )}
    </div>
  );
}