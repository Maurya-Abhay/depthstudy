'use client';

import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2, FolderKanban, Sparkles, Code2 } from 'lucide-react';
import { AdminShell } from '@/app/admin/_components/admin-shell';
import { JsonBulkBox } from '@/app/admin/_components/json-bulk-box';
import { AdminPagination, paginate } from '@/app/admin/_components/admin-pagination';
import { useConfirm } from '@/components/ui/confirm-dialog';

type Category = {
  id: string;
  name: string;
  description: string;
  icon: string;
  published: boolean;
};

const example = JSON.stringify(
  [
    {
      name: 'HTML',
      slug: 'html',
      description: 'Learn HTML from fundamentals to practical web structure.',
      icon: '<>',
      published: true,
      sortOrder: 1,
    },
    {
      name: 'CSS',
      slug: 'css',
      description: 'Learn modern CSS, layout and responsive design.',
      icon: '{}',
      published: true,
      sortOrder: 2,
    },
  ],
  null,
  2
);

export default function Categories() {
  const confirm = useConfirm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [icon, setIcon] = useState('');
  const [published, setPublished] = useState(true);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [mode, setMode] = useState<'bulk' | 'manual'>('manual');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    const r = await fetch('/api/admin/categories');
    const d = await r.json();
    if (r.ok) setCategories(d.categories ?? []);
    else setMsg(d.error || 'Unable to load categories.');
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      categories.filter((x) =>
        `${x.name} ${x.description}`.toLowerCase().includes(query.toLowerCase())
      ),
    [categories, query]
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    const r = await fetch('/api/admin/categories', {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: editing || undefined,
        name,
        description: desc,
        icon,
        published,
      }),
    });
    const d = await r.json();
    setLoading(false);

    if (r.ok) {
      setEditing(null);
      setName('');
      setDesc('');
      setIcon('');
      setPublished(true);
      load();
    } else {
      setMsg(d.error || 'Unable to save category.');
    }
  }

  async function remove(id: string) {
    if (
      !(await confirm({
        title: 'Delete category?',
        message: 'This category will be permanently removed.',
        confirmLabel: 'Delete',
        danger: true,
      }))
    )
      return;

    const r = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
    if (r.ok) setCategories((v) => v.filter((x) => x.id !== id));
  }

  const handleClear = () => {
    setEditing(null);
    setName('');
    setDesc('');
    setIcon('');
    setPublished(true);
    setMsg('');
  };

  return (
    <AdminShell>
      <div className="space-y-3">
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-2">
          <div>
            <h1 className="mt-0.5 text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <FolderKanban className="text-indigo-600 dark:text-indigo-400 shrink-0" size={20} />
              Categories
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Organize top-level learning categories for modules and courses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 rounded-lg">
              {categories.length} Categories
            </span>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#121824] p-1 w-fit">
          <button
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              mode === 'manual'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
            onClick={() => setMode('manual')}
          >
            Category Editor
          </button>
          <button
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              mode === 'bulk'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
            onClick={() => setMode('bulk')}
          >
            Bulk JSON Import
          </button>
        </div>

        {/* Dynamic Content Grid */}
        {mode === 'bulk' ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 items-start">
            <JsonBulkBox
              endpoint="/api/admin/categories"
              title="Import Categories"
              description="Add multiple categories at once using structured JSON syntax."
              example={example}
              onImported={load}
            />
            <CategoryList
              items={filtered}
              query={query}
              setQuery={setQuery}
              edit={(x) => {
                setMode('manual');
                setEditing(x.id);
                setName(x.name);
                setDesc(x.description);
                setIcon(x.icon);
                setPublished(x.published);
              }}
              remove={remove}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.3fr] items-start">
            {/* Category Form Card */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] p-5 shadow-xl">
              <div className="mb-4 pb-3 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={15} className="text-indigo-600 dark:text-indigo-400" />
                  {editing ? 'Edit Category' : 'Create New Category'}
                </h2>
                {editing && (
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-md">
                    Editing Mode
                  </span>
                )}
              </div>

              <form className="space-y-3.5" onSubmit={save}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_100px]">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Category Name <span className="text-indigo-600 dark:text-indigo-400">*</span>
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Frontend Development"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Icon / Symbol
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-center font-mono text-indigo-600 dark:text-indigo-300 placeholder-slate-400 dark:placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      maxLength={8}
                      placeholder="<>"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none min-h-[80px] resize-none"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Brief outline of what this category covers..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Publishing Status
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                    value={String(published)}
                    onChange={(e) => setPublished(e.target.value === 'true')}
                  >
                    <option value="true">Published (Visible to all)</option>
                    <option value="false">Draft (Hidden from public)</option>
                  </select>
                </div>

                {msg && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-300 font-medium">
                    {msg}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  <button
                    type="button"
                    className="rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-700 transition"
                    onClick={handleClear}
                  >
                    Clear Form
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
                  >
                    <Plus size={14} />
                    {loading ? 'Saving...' : editing ? 'Save Changes' : 'Create Category'}
                  </button>
                </div>
              </form>
            </section>

            {/* Category Listing Card */}
            <CategoryList
              items={filtered}
              query={query}
              setQuery={setQuery}
              edit={(x) => {
                setEditing(x.id);
                setName(x.name);
                setDesc(x.description);
                setIcon(x.icon);
                setPublished(x.published);
              }}
              remove={remove}
            />
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function CategoryList({
  items,
  query,
  setQuery,
  edit,
  remove,
}: {
  items: Category[];
  query: string;
  setQuery: (x: string) => void;
  edit: (x: Category) => void;
  remove: (id: string) => void;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const visible = paginate(items, page, pageSize);

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] p-5 shadow-xl space-y-3.5">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
        <input
          className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories by name or description..."
        />
      </div>

      {/* Item List Rows */}
      <div className="space-y-2">
        {visible.length ? (
          visible.map((x) => (
            <div
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/30 p-3 transition hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900/60"
              key={x.id}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {x.icon || <Code2 size={14} />}
                </span>
                <div className="min-w-0">
                  <strong className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {x.name}
                  </strong>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px] sm:max-w-[300px]">
                    {x.description || 'No description provided.'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    x.published
                      ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {x.published ? 'Published' : 'Draft'}
                </span>

                <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 transition hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-300"
                    onClick={() => edit(x)}
                    title="Edit category"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 transition hover:border-rose-500/50 hover:text-rose-600 dark:hover:text-rose-400"
                    onClick={() => remove(x.id)}
                    title="Delete category"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800/80 p-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No categories match your search filter.
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
        <AdminPagination
          page={page}
          pageCount={pageCount}
          total={items.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </section>
  );
}