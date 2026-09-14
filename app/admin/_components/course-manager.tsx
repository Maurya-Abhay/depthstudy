'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Pencil,
  Plus,
  Search,
  Trash2,
  BookOpen,
  Sparkles,
  Award,
} from 'lucide-react';
import { JsonBulkBox } from '@/app/admin/_components/json-bulk-box';
import { AdminPagination, paginate } from '@/app/admin/_components/admin-pagination';
import { useConfirm } from '@/components/ui/confirm-dialog';

type Category = { id: string; name: string };
type Topic = { id: string; title: string; category_id: string | null; summary: string };
type Course = {
  id: string;
  title: string;
  description: string;
  access_type: string;
  price: number;
  unlock_days: number;
  required_progress: number;
  passing_score: number;
  certificate_enabled: boolean;
  published: boolean;
};

const example = JSON.stringify(
  [
    {
      title: 'Web Development',
      description: 'A guided path across selected web technologies.',
      accessType: 'free',
      categoryIds: ['CATEGORY_ID_1'],
      unlockDays: 10,
      requiredProgress: 100,
      passingScore: 70,
      certificateEnabled: true,
      published: false,
    },
  ],
  null,
  2
);

export function CourseManager() {
  const confirm = useConfirm();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicLinks, setTopicLinks] = useState<Record<string, string[]>>({});
  const [catLinks, setCatLinks] = useState<Record<string, string[]>>({});
  const [mode, setMode] = useState<'bulk' | 'manual'>('manual');
  const [editing, setEditing] = useState('');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryIds: [] as string[],
    topicIds: [] as string[],
    accessType: 'free',
    price: '0',
    unlockDays: '10',
    requiredProgress: '100',
    passingScore: '70',
    certificateEnabled: true,
    published: false,
  });

  async function load() {
    const r = await fetch('/api/admin/courses');
    const d = await r.json();
    if (r.ok) {
      setCourses(d.courses ?? []);
      setCategories(d.categories ?? []);
      setTopics(d.topics ?? []);
      setTopicLinks(d.topicLinks ?? {});
      setCatLinks(d.courseCategoryLinks ?? {});
    } else setMessage(d.error || 'Unable to load courses.');
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      courses.filter((c) =>
        `${c.title} ${c.description}`.toLowerCase().includes(query.toLowerCase())
      ),
    [courses, query]
  );

  function toggleCategory(id: string) {
    setForm((v) => {
      const categoryIds = v.categoryIds.includes(id)
        ? v.categoryIds.filter((x) => x !== id)
        : [...v.categoryIds, id];
      const topicIds = topics
        .filter((topic) => categoryIds.includes(topic.category_id ?? ''))
        .map((topic) => topic.id);
      return { ...v, categoryIds, topicIds };
    });
  }

  function toggle(key: 'categoryIds' | 'topicIds', id: string) {
    if (key === 'categoryIds') {
      toggleCategory(id);
      return;
    }
    setForm((v) => ({
      ...v,
      topicIds: v.topicIds.includes(id)
        ? v.topicIds.filter((x) => x !== id)
        : [...v.topicIds, id],
    }));
  }

  function reset() {
    setEditing('');
    setForm({
      title: '',
      description: '',
      categoryIds: [],
      topicIds: [],
      accessType: 'free',
      price: '0',
      unlockDays: '10',
      requiredProgress: '100',
      passingScore: '70',
      certificateEnabled: true,
      published: false,
    });
  }

  function edit(c: Course) {
    setMode('manual');
    setEditing(c.id);
    setForm({
      title: c.title,
      description: c.description,
      categoryIds: catLinks[c.id] ?? [],
      topicIds: topicLinks[c.id] ?? [],
      accessType: c.access_type,
      price: String(c.price ?? 0),
      unlockDays: String(c.unlock_days ?? 10),
      requiredProgress: String(c.required_progress ?? 100),
      passingScore: String(c.passing_score ?? 70),
      certificateEnabled: c.certificate_enabled,
      published: c.published,
    });
  }

  function moveTopic(index: number, delta: number) {
    setForm((v) => {
      const next = [...v.topicIds];
      const to = index + delta;
      if (to < 0 || to >= next.length) return v;
      [next[index], next[to]] = [next[to], next[index]];
      return { ...v, topicIds: next };
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    const r = await fetch('/api/admin/courses', {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: editing || undefined, ...form }),
    });
    const d = await r.json();
    setMessage(r.ok ? '' : d.error || 'Unable to save course.');
    if (r.ok) {
      reset();
      await load();
    }
    setBusy(false);
  }

  async function remove(id: string) {
    if (
      !(await confirm({
        title: 'Delete course?',
        message: 'This course and its links will be permanently removed.',
        confirmLabel: 'Delete',
        danger: true,
      }))
    )
      return;
    const r = await fetch(`/api/admin/courses?id=${id}`, { method: 'DELETE' });
    if (r.ok) setCourses((v) => v.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-4 text-slate-900 dark:text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Course Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Build structured paths by linking categories and ordered topics directly.
          </p>
        </div>
        <span className="self-start sm:self-auto rounded-xl border border-indigo-500/20 bg-indigo-50 px-3 py-1 font-mono text-xs font-semibold text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
          {courses.length} courses
        </span>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1 w-fit dark:border-slate-800 dark:bg-[#121824]">
        <button
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            mode === 'manual'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
          }`}
          onClick={() => setMode('manual')}
          type="button"
        >
          Course Editor
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            mode === 'bulk'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
          }`}
          onClick={() => setMode('bulk')}
          type="button"
        >
          Bulk JSON
        </button>
      </div>

      {mode === 'bulk' ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 items-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#121824] dark:shadow-xl">
            <JsonBulkBox
              endpoint="/api/admin/courses"
              title="Import Courses"
              description="Use categoryIds and topicIds from existing database records. Preview payload before importing."
              example={example}
              onImported={load}
            />
          </div>
          <CourseList
            courses={filtered}
            query={query}
            setQuery={setQuery}
            edit={edit}
            remove={remove}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr] items-start">
          {/* Manual Form Editor */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#121824] dark:shadow-xl space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles size={15} className="text-indigo-600 dark:text-indigo-400" />
                {editing ? 'Edit Course' : 'Create New Course'}
              </h2>
              {editing && (
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md">
                  Editing Mode
                </span>
              )}
            </div>

            <form className="space-y-4" onSubmit={save}>
              {/* Title & Description */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Course Title <span className="text-indigo-600 dark:text-indigo-400">*</span>
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900/60 dark:text-white dark:placeholder-slate-500 dark:focus:bg-transparent"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Modern Fullstack Web Architecture"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900/60 dark:text-white dark:placeholder-slate-500 dark:focus:bg-transparent h-20 resize-none"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Summary of course contents and objectives..."
                  />
                </div>
              </div>

              {/* Categories Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Associated Categories
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-36 overflow-y-auto pr-1">
                  {categories.map((c) => {
                    const selected = form.categoryIds.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => toggle('categoryIds', c.id)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition ${
                          selected
                            ? 'border-indigo-500/50 bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-600/15 dark:text-indigo-200'
                            : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800/80 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border text-[10px] ${
                            selected
                              ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-500'
                              : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800'
                          }`}
                        >
                          {selected ? <Check size={10} /> : null}
                        </span>
                        <span className="truncate">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Topic Multi-select Grid */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Included Topics
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-52 overflow-y-auto pr-1">
                  {topics.map((t) => {
                    const selected = form.topicIds.includes(t.id);
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => toggle('topicIds', t.id)}
                        className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition ${
                          selected
                            ? 'border-indigo-500/50 bg-indigo-50 text-indigo-700 dark:bg-indigo-600/15 dark:text-indigo-200'
                            : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800/80 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md border text-[10px] ${
                            selected
                              ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-500'
                              : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800'
                          }`}
                        >
                          {selected ? <Check size={10} /> : null}
                        </span>
                        <div className="min-w-0">
                          <strong className="block text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {t.title}
                          </strong>
                          {t.summary && (
                            <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {t.summary}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Topic Ordering List */}
              {form.topicIds.length > 0 && (
                <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800/80 dark:bg-slate-900/30">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Topic Sequence Order ({form.topicIds.length})
                  </label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {form.topicIds.map((id, i) => {
                      const t = topics.find((x) => x.id === id);
                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-800/60 dark:bg-slate-900/80 dark:text-slate-200"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold text-slate-600 dark:text-slate-400">
                              {i + 1}
                            </span>
                            <strong className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                              {t?.title || 'Topic'}
                            </strong>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={i === 0}
                              onClick={() => moveTopic(i, -1)}
                              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:text-white disabled:opacity-30"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              type="button"
                              disabled={i === form.topicIds.length - 1}
                              onClick={() => moveTopic(i, 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:text-white disabled:opacity-30"
                            >
                              <ArrowDown size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Numeric & Select Settings Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Access Type
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900/60 dark:text-white dark:focus:bg-transparent"
                    value={form.accessType}
                    onChange={(e) => setForm({ ...form, accessType: e.target.value })}
                  >
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                {form.accessType === 'paid' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900/60 dark:text-white dark:focus:bg-transparent"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unlock Delay (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900/60 dark:text-white dark:focus:bg-transparent"
                    value={form.unlockDays}
                    onChange={(e) => setForm({ ...form, unlockDays: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Required Progress (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900/60 dark:text-white dark:focus:bg-transparent"
                    value={form.requiredProgress}
                    onChange={(e) => setForm({ ...form, requiredProgress: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900/60 dark:text-white dark:focus:bg-transparent"
                    value={form.passingScore}
                    onChange={(e) => setForm({ ...form, passingScore: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Published Status
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900/60 dark:text-white dark:focus:bg-transparent"
                    value={String(form.published)}
                    onChange={(e) => setForm({ ...form, published: e.target.value === 'true' })}
                  >
                    <option value="false">Draft</option>
                    <option value="true">Published</option>
                  </select>
                </div>
              </div>

              {/* Certificate Checkbox Option */}
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 cursor-pointer transition hover:bg-slate-100/60 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-900/60">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-0 focus:ring-offset-0 dark:border-slate-700 dark:bg-slate-800"
                  checked={form.certificateEnabled}
                  onChange={(e) => setForm({ ...form, certificateEnabled: e.target.checked })}
                />
                <div>
                  <strong className="block text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Award size={13} className="text-amber-500 dark:text-amber-400" />
                    Enable Completion Certificate
                  </strong>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Generates a verified certificate after passing final test requirements.
                  </span>
                </div>
              </label>

              {message && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-600 font-medium dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  {message}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:border-slate-300 transition dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:text-white dark:hover:border-slate-700"
                  onClick={reset}
                >
                  Clear Form
                </button>
                <button
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
                  disabled={busy}
                >
                  <Plus size={14} />
                  {busy ? 'Saving...' : editing ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </section>

          <CourseList
            courses={filtered}
            query={query}
            setQuery={setQuery}
            edit={edit}
            remove={remove}
          />
        </div>
      )}
    </div>
  );
}

function CourseList({
  courses,
  query,
  setQuery,
  edit,
  remove,
}: {
  courses: Course[];
  query: string;
  setQuery: (x: string) => void;
  edit: (x: Course) => void;
  remove: (id: string) => void;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(courses.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const visible = paginate(courses, page, pageSize);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#121824] dark:shadow-xl space-y-3.5">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
        <input
          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900/60 dark:text-white dark:placeholder-slate-500 dark:focus:bg-transparent"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search courses..."
        />
      </div>

      {/* Item List Rows */}
      <div className="space-y-2">
        {visible.length ? (
          visible.map((c) => (
            <div
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 transition hover:border-slate-300 hover:bg-slate-100/50 dark:border-slate-800/60 dark:bg-slate-900/30 dark:hover:border-slate-700 dark:hover:bg-slate-900/60"
              key={c.id}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-50 font-mono text-xs font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <BookOpen size={14} />
                </span>
                <div className="min-w-0">
                  <strong className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {c.title}
                  </strong>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {c.access_type === 'free' ? 'Free' : `$${c.price}`} · Pass: {c.passing_score}% · Unlock: {c.unlock_days}d
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    c.published
                      ? 'border border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {c.published ? 'Published' : 'Draft'}
                </span>

                <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-500/50 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:text-indigo-300"
                    onClick={() => edit(c)}
                    aria-label={`Edit ${c.title}`}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-rose-500/50 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:text-rose-400"
                    onClick={() => remove(c.id)}
                    aria-label={`Delete ${c.title}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80 p-8 text-center text-xs text-slate-500">
            No courses found.
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <AdminPagination
          page={page}
          pageCount={pageCount}
          total={courses.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </section>
  );
}