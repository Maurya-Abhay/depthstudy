'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  UserPlus, 
  Search, 
  Filter, 
  KeyRound, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  UserCheck, 
  UserX, 
  Mail, 
  Users,
  Edit2,
  X,
  ChevronLeft,
  ChevronRight,
  MoreVertical
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

type Member = { 
  user_id: string; 
  role: string; 
  status: string; 
  joined_at: string; 
  name: string; 
  email: string 
};
type Data = { members: Member[]; invites: any[]; total: number };

const PAGE_SIZE = 10;

export default function MembersPage() {
  const { slug } = useParams<{ slug: string }>();
  const [q, setQ] = useState<Record<string, string>>({});
  const { ctx, data, loading, error, reload } = useOrgFetch<Data>(slug, '/api/organization/members', q);
  
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: string; e: boolean } | null>(null);
  
  // Modals Control
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Add Form State
  const [showPwd, setShowPwd] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [role, setRole] = useState<'student' | 'mentor' | 'admin'>('student');

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<string>('student');
  const [editStatus, setEditStatus] = useState<string>('active');

  // Filter & Pagination States
  const [f, setF] = useState({ search: '', role: '', status: '' });
  const [page, setPage] = useState(1);
  
  // Credentials Output
  const [creds, setCreds] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (ctx.loading || loading) return <Loading />;
  if (ctx.error || error) return <Message text={ctx.error || error} error />;
  const canManage = ctx.role === 'owner' || ctx.role === 'admin';

  async function run(b: Record<string, unknown>) {
    if (!ctx.orgId) return;
    setBusy(true); setMsg(null);
    try {
      if (b.action === 'invite' && String(b.password ?? '').length < 8) {
        throw new Error('Password must be at least 8 characters.');
      }
      const d = await apiPost(ctx.orgId, '/api/organization/members', b);
      
      if (b.action === 'invite' && d?.credentials) {
        setCreds(`Email: ${d.credentials.email} | Password: ${d.credentials.password}`);
        setMsg({ t: 'Member added successfully with direct credentials.', e: false });
        // Reset form & close modal
        setName('');
        setEmail('');
        setPwd('');
        setShowAddModal(false);
      } else {
        setMsg({ t: 'Member updated successfully.', e: false });
        if (editingMember) setEditingMember(null);
      }
      await reload();
    } catch (e) { 
      setMsg({ t: e instanceof Error ? e.message : 'Operation failed', e: true }); 
    } finally { 
      setBusy(false); 
    }
  }

  const handleFilter = () => {
    setPage(1);
    setQ({
      ...(f.search && { search: f.search }),
      ...(f.role && { role: f.role }),
      ...(f.status && { status: f.status }),
    });
  };

  const copyCreds = () => {
    if (!creds) return;
    navigator.clipboard.writeText(creds);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openEditModal = (m: Member) => {
    setEditingMember(m);
    setEditName(m.name || '');
    setEditRole(m.role);
    setEditStatus(m.status);
  };

  // Pagination Logic
  const allMembers = data?.members ?? [];
  const totalPages = Math.ceil(allMembers.length / PAGE_SIZE) || 1;
  const paginatedMembers = allMembers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5 font-sans text-xs antialiased">
      {/* Header */}
      <PageHeader 
        title="Organization Members" 
        subtitle={`Manage users and role permissions (${data?.total ?? 0} total)`} 
        actions={
          canManage ? (
            <button 
              onClick={() => setShowAddModal(true)} 
              className={buttonCls}
            >
              <UserPlus size={14} />
              <span>Add New Member</span>
            </button>
          ) : undefined
        } 
      />

      {/* Global Message Banner */}
      <Message text={msg?.t ?? null} error={msg?.e ?? false} />

      {/* Credentials Banner */}
      {creds && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/70 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <KeyRound size={16} className="shrink-0" />
            <span className="font-mono text-[11px] font-semibold">{creds}</span>
          </div>
          <button 
            onClick={copyCreds} 
            className="inline-flex items-center gap-1 rounded bg-emerald-200/60 px-2 py-1 text-[10px] font-bold text-emerald-800 transition-colors hover:bg-emerald-200 dark:bg-emerald-900/80 dark:text-emerald-200"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      {canManage && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <input 
                value={f.search} 
                onChange={(e) => setF({ ...f, search: e.target.value })} 
                placeholder="Search name or email..." 
                className={`${inputCls} pl-8`} 
              />
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <select 
              value={f.role} 
              onChange={(e) => setF({ ...f, role: e.target.value })} 
              className={selectCls}
            >
              <option value="">All Roles</option>
              {['owner', 'admin', 'mentor', 'student'].map((r) => (
                <option key={r} value={r}>{r.toUpperCase()}</option>
              ))}
            </select>

            <select 
              value={f.status} 
              onChange={(e) => setF({ ...f, status: e.target.value })} 
              className={selectCls}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button onClick={handleFilter} className={buttonCls}>
              <Filter size={13} />
              <span>Apply</span>
            </button>
          </div>
        </div>
      )}

      {/* Members Directory Table */}
      <div className={borderCls}>
        <table className="w-full min-w-[650px] text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
            <tr>
              {['Member', 'Role', 'Status', 'Joined Date', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 font-bold uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {paginatedMembers.map((m) => {
              const initials = (m.name || m.email).slice(0, 2).toUpperCase();
              return (
                <tr key={m.user_id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                  {/* Name & Email */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {initials}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{m.name || 'Unnamed User'}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{m.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role Badge */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      m.role === 'owner' 
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' 
                        : m.role === 'admin'
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : m.role === 'mentor'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {m.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 font-semibold ${
                      m.status === 'active' 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${m.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="capitalize">{m.status}</span>
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {m.joined_at ? new Date(m.joined_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    {canManage && m.role !== 'owner' && (
                      <div className="flex items-center gap-1.5">
                        <button 
                          disabled={busy} 
                          onClick={() => openEditModal(m)} 
                          className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Edit2 size={11} />
                          <span>Edit</span>
                        </button>

                        {m.status === 'active' ? (
                          <button 
                            disabled={busy} 
                            onClick={() => run({ action: 'deactivate', memberUserId: m.user_id })} 
                            className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400"
                          >
                            <UserX size={11} />
                            <span>Deactivate</span>
                          </button>
                        ) : (
                          <button 
                            disabled={busy} 
                            onClick={() => run({ action: 'reactivate', memberUserId: m.user_id })} 
                            className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                          >
                            <UserCheck size={11} />
                            <span>Reactivate</span>
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {!paginatedMembers.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Users size={24} className="text-slate-300 dark:text-slate-700" />
                    <span>No members match your current filter.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        {allMembers.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200/80 px-4 py-3 dark:border-slate-800">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{(page - 1) * PAGE_SIZE + 1}</span> to{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{Math.min(page * PAGE_SIZE, allMembers.length)}</span> of{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{allMembers.length}</span> members
            </p>

            <div className="flex items-center gap-1.5">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)} 
                className="inline-flex items-center justify-center rounded border border-slate-200 p-1.5 text-slate-600 disabled:opacity-40 dark:border-slate-800 dark:text-slate-300"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Page {page} of {totalPages}
              </span>
              <button 
                disabled={page === totalPages} 
                onClick={() => setPage(page + 1)} 
                className="inline-flex items-center justify-center rounded border border-slate-200 p-1.5 text-slate-600 disabled:opacity-40 dark:border-slate-800 dark:text-slate-300"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add New Member</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Directly provision an account with initial login credentials.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                <input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Rahul Sharma" 
                  className={inputCls} 
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Email Address *</label>
                <input 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="rahul@domain.com" 
                  className={inputCls} 
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Password * (Min 8 characters)</label>
                <div className="relative">
                  <input 
                    type={showPwd ? 'text' : 'password'} 
                    value={pwd} 
                    onChange={(e) => setPwd(e.target.value)} 
                    placeholder="••••••••" 
                    className={`${inputCls} pr-8`} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Assign Role</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value as any)} 
                  className={selectCls}
                >
                  <option value="student">Student</option>
                  <option value="mentor">Mentor</option>
                  {ctx.role === 'owner' && <option value="admin">Admin</option>}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <button onClick={() => setShowAddModal(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">
                Cancel
              </button>
              <button 
                disabled={busy || !email || pwd.length < 8} 
                onClick={() => run({ action: 'invite', name, email, password: pwd, role })} 
                className={buttonCls}
              >
                <span>{busy ? 'Provisioning...' : 'Provision Member'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Edit Member Details</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{editingMember.email}</p>
              </div>
              <button onClick={() => setEditingMember(null)} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                <input 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  placeholder="Full Name" 
                  className={inputCls} 
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Role</label>
                <select 
                  value={editRole} 
                  onChange={(e) => setEditRole(e.target.value)} 
                  className={selectCls}
                >
                  <option value="student">Student</option>
                  <option value="mentor">Mentor</option>
                  {ctx.role === 'owner' && <option value="admin">Admin</option>}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Status</label>
                <select 
                  value={editStatus} 
                  onChange={(e) => setEditStatus(e.target.value)} 
                  className={selectCls}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <button onClick={() => setEditingMember(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">
                Cancel
              </button>
              <button 
                disabled={busy} 
                onClick={() => run({ 
                  action: 'update', 
                  memberUserId: editingMember.user_id, 
                  name: editName, 
                  role: editRole, 
                  status: editStatus 
                })} 
                className={buttonCls}
              >
                <span>{busy ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}