'use client';

import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  UserCheck,
  UserX,
  X,
  Save,
  Activity as ActivityIcon,
  Filter,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';

type User = {
  id: string;
  name: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  created_at: string;
};

type Activity = {
  user_id: string;
  completed: number;
  enrolled: number;
  tests: number;
  solved: number;
  certs: number;
};

export function UserManager() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [activity, setActivity] = useState<Record<string, Activity>>({});
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');

  async function load(signal?: AbortSignal) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '25' });
      if (query.trim()) params.set('q', query.trim());
      if (filter !== 'all') params.set('role', filter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetch(`/api/admin/users?${params}`, { cache: 'no-store', signal });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Unable to load users.');

      setUsers(data.users ?? []);
      setActivity(data.activity ?? {});
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        showToast('error', error instanceof Error ? error.message : 'Unable to load users.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => load(controller.signal), 180);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [page, query, filter, statusFilter]);

  function beginEdit(item: User) {
    setEditing(item);
    setName(item.name || '');
    setRole(item.role);
    setStatus(item.status || 'active');
  }

  async function save() {
    if (!editing) return;
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', 'X-Silent-Toast': '1' },
        body: JSON.stringify({
          id: editing.id,
          name,
          role,
          status,
          reason: status === 'suspended' ? 'Suspended by administrator' : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        showToast('error', data.error || 'Unable to update user.');
        return;
      }

      setUsers((v) => v.map((u) => (u.id === editing.id ? data.user : u)));
      setEditing(null);
      showToast('success', 'User updated successfully.');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Unable to update user.');
    }
  }

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Compact Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0d111c] p-4 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
            <Users className="w-3.5 h-3.5" />
            <span>Account Management</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
            User Directory
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-50 dark:bg-[#131823] border border-zinc-200/80 dark:border-white/5 text-zinc-600 dark:text-zinc-300 font-medium">
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Total: {total}</span>
          </div>
        </div>
      </div>

      {/* Compact Search & Filter Toolbar */}
      <div className="bg-white dark:bg-[#0d111c] p-3 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search learner name..."
            aria-label="Search users"
            className="w-full bg-zinc-50 dark:bg-[#131823] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Segmented Filter Buttons */}
          <div className="flex items-center bg-zinc-100 dark:bg-[#161b26] p-0.5 rounded-lg border border-zinc-200 dark:border-white/5">
            {(['all', 'user', 'admin'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setFilter(value);
                  setPage(1);
                }}
                className={`px-2.5 py-1 font-medium rounded-md transition-all ${
                  filter === value
                    ? 'bg-white dark:bg-[#222938] text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {value === 'all' ? 'All' : value === 'user' ? 'Learners' : 'Admins'}
              </button>
            ))}
          </div>

          {/* Status Dropdown Filter */}
          <div className="relative flex items-center">
            <Filter className="w-3 h-3 absolute left-2.5 text-zinc-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'active' | 'suspended');
                setPage(1);
              }}
              aria-label="Filter account status"
              className="bg-zinc-50 dark:bg-[#131823] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-lg pl-7 pr-6 py-1.5 font-medium focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-[#0d111c] rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50/80 dark:bg-[#131823]/60 border-b border-zinc-200 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2.5">User</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Joined</th>
                <th className="px-4 py-2.5">Activity</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-white/5">
              {users.map((user) => {
                const stats = activity[user.id];
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-[#131823]/40 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                          <UserRound className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-zinc-900 dark:text-white truncate">
                            {user.name || 'Learner'}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-400 truncate">
                            {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-2.5">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 text-zinc-700 dark:bg-white/5 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                          Learner
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-2.5">
                      {user.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                          <UserCheck className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                          <UserX className="w-3 h-3" /> Suspended
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400">
                      {new Date(user.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-300">
                      {stats ? (
                        <div className="flex items-center gap-1.5">
                          <ActivityIcon className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span>
                            <strong>{stats.completed}</strong> topics · <strong>{stats.solved}</strong> DSA · <strong>{stats.tests}</strong> tests
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">No activity</span>
                      )}
                    </td>

                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => beginEdit(user)}
                        className="p-1 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 rounded-md hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                        title="Edit User"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Loading/Empty States */}
        {loading ? (
          <div className="p-8 text-center text-zinc-400">Loading accounts...</div>
        ) : !users.length ? (
          <div className="p-8 text-center text-zinc-400">No accounts match filters.</div>
        ) : null}

        {/* Compact Footer Pagination */}
        <div className="p-3 bg-zinc-50/50 dark:bg-[#131823]/30 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">
            Showing <strong>{total}</strong> accounts · Page {page} of {totalPages}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded-md border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0d111c] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded-md border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0d111c] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit User Modal Dialog */}
      {editing && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) setEditing(null);
          }}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#0d111c] rounded-xl border border-zinc-200 dark:border-white/10 shadow-2xl p-5 space-y-4"
            role="dialog"
            aria-modal="true"
            aria-label="Edit user"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-2.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Settings
                </span>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Edit User Profile
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                aria-label="Close editor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-medium text-zinc-700 dark:text-zinc-300">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  className="w-full bg-zinc-50 dark:bg-[#131823] border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-zinc-700 dark:text-zinc-300">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                  className="w-full bg-zinc-50 dark:bg-[#131823] border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="user">Learner</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-zinc-700 dark:text-zinc-300">Account Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'suspended')}
                  className="w-full bg-zinc-50 dark:bg-[#131823] border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-3 py-1.5 font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3.5 py-1.5 rounded-lg transition-all shadow-sm"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}