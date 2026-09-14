'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Pencil, Plus, Search, Trash2, BookOpen, Sparkles, Filter } from 'lucide-react';
import { JsonBulkBox } from '@/app/admin/_components/json-bulk-box';
import { AdminPagination, paginate } from '@/app/admin/_components/admin-pagination';
import { useConfirm } from '@/components/ui/confirm-dialog';

type Topic = {
  id: string;
  category_id: string | null;
  title: string;
  difficulty: string;
  estimated_minutes: number;
  summary: string;
  concept: string;
  explanation: string;
  mental_model: string | null;
  real_example: string | null;
  code_example: string | null;
  code_language: string | null;
  output: string | null;
  common_mistakes: unknown;
  practice_task: string | null;
  interview_questions: unknown;
  published: boolean;
};

type Category = { id: string; name: string };

type Form = {
  title: string;
  categoryId: string;
  difficulty: string;
  minutes: string;
  summary: string;
  concept: string;
  explanation: string;
  mentalModel: string;
  realExample: string;
  codeExample: string;
  codeLanguage: string;
  output: string;
  mistakes: string;
  practice: string;
  questions: string;
  published: boolean;
};

const empty: Form = {
  title: '',
  categoryId: '',
  difficulty: 'Beginner',
  minutes: '10',
  summary: '',
  concept: '',
  explanation: '',
  mentalModel: '',
  realExample: '',
  codeExample: '',
  codeLanguage: 'javascript',
  output: '',
  mistakes: '',
  practice: '',
  questions: '',
  published: false,
};

const example = JSON.stringify(
  [
    {
      title: 'What is HTML?',
      slug: 'what-is-html',
      difficulty: 'Beginner',
      estimatedMinutes: 10,
      summary: '...',
      concept: '...',
      explanation: '...',
      mentalModel: '...',
      realExample: '...',
      codeExample: '',
      codeLanguage: 'html',
      output: '',
      commonMistakes: ['...'],
      practiceTask: '...',
      interviewQuestions: ['...'],
      published: false,
      sortOrder: 1,
    },
  ],
  null,
  2
);

export function TopicManager() {
  const confirm = useConfirm();
  const [items, setItems] = useState<Topic[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<Form>(empty);
  const [editing, setEditing] = useState('');
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'manual' | 'bulk'>('bulk');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await fetch('/api/admin/content?kind=topics');
      const data = await res.json();
      if (res.ok) {
        setItems(data.items ?? []);
        setCategories(data.categories ?? []);
      } else {
        setMessage(data.error || 'Unable to load topics.');
      }
    } catch {
      setMessage('Failed to fetch data from server.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((v) => ({ ...v, [key]: value }));
  }

  function edit(item: Topic) {
    setEditing(item.id);
    setMode('manual');
    setForm({
      title: item.title,
      categoryId: item.category_id ?? '',
      difficulty: item.difficulty,
      minutes: String(item.estimated_minutes),
      summary: item.summary,
      concept: item.concept,
      explanation: item.explanation,
      mentalModel: item.mental_model ?? '',
      realExample: item.real_example ?? '',
      codeExample: item.code_example ?? '',
      codeLanguage: item.code_language ?? 'javascript',
      output: item.output ?? '',
      mistakes: Array.isArray(item.common_mistakes) ? item.common_mistakes.join('\n') : '',
      practice: item.practice_task ?? '',
      questions: Array.isArray(item.interview_questions) ? item.interview_questions.join('\n') : '',
      published: item.published,
    });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');

    const payload = {
      id: editing || undefined,
      name: form.title,
      categoryId: form.categoryId,
      published: form.published,
      details: {
        slug: form.title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
        difficulty: form.difficulty,
        estimated_minutes: Number(form.minutes) || 10,
        summary: form.summary,
        concept: form.concept,
        explanation: form.explanation,
        mental_model: form.mentalModel || null,
        real_example: form.realExample || null,
        code_example: form.codeExample || null,
        code_language: form.codeLanguage || null,
        output: form.output || null,
        common_mistakes: form.mistakes
          .split('\n')
          .map((x) => x.trim())
          .filter(Boolean),
        practice_task: form.practice || null,
        interview_questions: form.questions
          .split('\n')
          .map((x) => x.trim())
          .filter(Boolean),
        sort_order: 0,
      },
    };

    try {
      const res = await fetch('/api/admin/content?kind=topics', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setMessage(res.ok ? '' : data.error || 'Unable to save.');

      if (res.ok) {
        setForm(empty);
        setEditing('');
        await load();
      }
    } catch {
      setMessage('Failed to send payload request.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (
      !(await confirm({
        title: 'Delete topic?',
        message: 'This topic will be permanently removed.',
        confirmLabel: 'Delete',
        danger: true,
      }))
    )
      return;

    const res = await fetch(`/api/admin/content?kind=topics&id=${id}`, { method: 'DELETE' });
    if (res.ok) setItems((v) => v.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* Dynamic Mode Navigation */}
      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#121824] p-1 w-fit">
        <button
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            mode === 'bulk'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
          }`}
          onClick={() => setMode('bulk')}
          type="button"
        >
          Bulk JSON
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            mode === 'manual'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
          }`}
          onClick={() => setMode('manual')}
          type="button"
        >
          Manual Editor
        </button>
      </div>

      {mode === 'bulk' ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 items-start">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] p-5 shadow-xl space-y-4">
            <div>
              <label htmlFor="bulk-topic-category" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category for all imported topics
              </label>
              <select
                id="bulk-topic-category"
                defaultValue=""
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Choose category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <JsonBulkBox
              endpoint="/api/admin/content?kind=topics"
              title="Import Learning Topics"
              description="Paste an array from ChatGPT or your generator. Selected category is applied to every item."
              example={example}
              beforeSend={(records) => {
                const select = document.getElementById('bulk-topic-category') as HTMLSelectElement | null;
                const categoryId = select?.value || '';
                return records.map((item) => ({ ...item, categoryId }));
              }}
              onImported={load}
            />
          </div>
          <TopicList
            items={items}
            categories={categories}
            query={query}
            setQuery={setQuery}
            edit={edit}
            remove={remove}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.2fr] items-start">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] p-5 shadow-xl">
            <div className="mb-4 pb-3 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles size={15} className="text-indigo-600 dark:text-indigo-400" />
                {editing ? 'Edit Topic' : 'Create Topic'}
              </h2>
              {editing && (
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-md">
                  Editing Mode
                </span>
              )}
            </div>

            <form className="space-y-3.5" onSubmit={save}>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Title <span className="text-indigo-600 dark:text-indigo-400">*</span>
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="e.g. Understanding Flexbox Axis"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category <span className="text-indigo-600 dark:text-indigo-400">*</span>
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    value={form.categoryId}
                    onChange={(e) => update('categoryId', e.target.value)}
                    required
                  >
                    <option value="">Choose category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
                  <select
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    value={form.difficulty}
                    onChange={(e) => update('difficulty', e.target.value)}
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Minutes</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    value={form.minutes}
                    onChange={(e) => update('minutes', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Summary</label>
                <textarea
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none h-16 resize-none"
                  value={form.summary}
                  onChange={(e) => update('summary', e.target.value)}
                  placeholder="One sentence topic overview..."
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Core Concept</label>
                  <textarea
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none h-20 resize-none"
                    value={form.concept}
                    onChange={(e) => update('concept', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Simple Explanation</label>
                  <textarea
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none h-20 resize-none"
                    value={form.explanation}
                    onChange={(e) => update('explanation', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Mental Model</label>
                  <textarea
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none h-16 resize-none"
                    value={form.mentalModel}
                    onChange={(e) => update('mentalModel', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Real-World Example</label>
                  <textarea
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none h-16 resize-none"
                    value={form.realExample}
                    onChange={(e) => update('realExample', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Code Example (Optional)</label>
                <textarea
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 p-3 font-mono text-xs text-indigo-400 dark:text-indigo-300 placeholder-slate-500 dark:placeholder-slate-600 focus:border-indigo-500 focus:outline-none h-24 resize-y leading-relaxed"
                  value={form.codeExample}
                  onChange={(e) => update('codeExample', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Language</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 font-mono text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    value={form.codeLanguage}
                    onChange={(e) => update('codeLanguage', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Expected Output</label>
                  <textarea
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none h-10 resize-none"
                    value={form.output}
                    onChange={(e) => update('output', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Common Mistakes (One per line)
                </label>
                <textarea
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none h-16 resize-y"
                  value={form.mistakes}
                  onChange={(e) => update('mistakes', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Practice Task</label>
                <textarea
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none h-16 resize-none"
                  value={form.practice}
                  onChange={(e) => update('practice', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Interview Questions (One per line)
                </label>
                <textarea
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none h-16 resize-y"
                  value={form.questions}
                  onChange={(e) => update('questions', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Publishing Status</label>
                <select
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                  value={String(form.published)}
                  onChange={(e) => update('published', e.target.value === 'true')}
                >
                  <option value="false">Draft (Hidden)</option>
                  <option value="true">Published (Public)</option>
                </select>
              </div>

              {message && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-300 font-medium">
                  {message}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <button
                  type="button"
                  className="rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-700 transition"
                  onClick={() => {
                    setForm(empty);
                    setEditing('');
                  }}
                >
                  Clear Form
                </button>
                <button
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
                  disabled={busy}
                >
                  <Plus size={14} />
                  {busy ? 'Saving...' : editing ? 'Save Changes' : 'Create Topic'}
                </button>
              </div>
            </form>
          </section>

          <TopicList
            items={items}
            categories={categories}
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

function TopicList({
  items,
  categories,
  query,
  setQuery,
  edit,
  remove,
}: {
  items: Topic[];
  categories: Category[];
  query: string;
  setQuery: (v: string) => void;
  edit: (x: Topic) => void;
  remove: (id: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const pageSize = 10;

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = `${item.title} ${item.summary ?? ''}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesCategory = categoryFilter ? item.category_id === categoryFilter : true;
      return matchesSearch && matchesCategory;
    });
  }, [items, query, categoryFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [query, categoryFilter]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const visible = paginate(filteredItems, page, pageSize);

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] p-5 shadow-xl space-y-3.5">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_160px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
          <input
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics..."
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={13} />
          <select
            className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 pl-8 pr-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:border-indigo-500 focus:outline-none appearance-none"
            aria-label="Filter topics by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Topics</option>
            {categories.map((category) => (
              <option value={category.id} key={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {visible.length ? (
          visible.map((item) => (
            <div
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/30 p-3 transition hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900/60"
              key={item.id}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <BookOpen size={14} />
                </span>
                <div className="min-w-0">
                  <strong className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {item.title}
                  </strong>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-[280px]">
                    {item.summary || 'No summary'} · {item.difficulty} · {item.estimated_minutes} min
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    item.published
                      ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.published ? 'Published' : 'Draft'}
                </span>

                <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 transition hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-300"
                    onClick={() => edit(item)}
                    aria-label={`Edit ${item.title}`}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 transition hover:border-rose-500/50 hover:text-rose-600 dark:hover:text-rose-400"
                    onClick={() => remove(item.id)}
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800/80 p-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No topics found.
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
        <AdminPagination
          page={page}
          pageCount={pageCount}
          total={filteredItems.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </section>
  );
}