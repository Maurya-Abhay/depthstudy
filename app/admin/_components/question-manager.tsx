'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Pencil,
  Plus,
  Search,
  Trash2,
  HelpCircle,
  FileJson,
  Layers,
  FolderPlus,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  X,
  Edit2,
  Check
} from 'lucide-react';
import { JsonBulkBox } from '@/app/admin/_components/json-bulk-box';
import { useConfirm } from '@/components/ui/confirm-dialog';

type Category = { id: string; name: string };
type Question = {
  id: string;
  category_id: string | null;
  topic_id: string | null;
  prompt: string;
  type: string;
  options: unknown;
  answer: unknown;
  explanation: string;
  published: boolean;
};

// All supported question types (mirrors the questions.type column values)
export const QUESTION_TYPES: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'mcq', label: 'MCQ' },
  { value: 'true_false', label: 'True / False' },
  { value: 'code_output', label: 'Code Output' },
  { value: 'code_fix', label: 'Code Fix' },
  { value: 'scenario', label: 'Scenario Based' },
  { value: 'debugging', label: 'Debugging' },
  { value: 'best_practice', label: 'Best Practice' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'seo', label: 'SEO' },
];

const EXAMPLE_JSON = JSON.stringify(
  [
    {
      prompt: 'Which tag creates a hyperlink?',
      type: 'mcq',
      options: ['<a>', '<link>', '<href>', '<nav>'],
      answer: '<a>',
      explanation: 'The anchor element creates hyperlinks.',
      published: false,
    },
    {
      prompt: 'HTML is a programming language.',
      type: 'true_false',
      options: ['True', 'False'],
      answer: 'False',
      explanation: 'HTML is a markup language, not a programming language.',
      published: false,
    },
    {
      prompt: 'What does the following JS print? console.log(typeof null)',
      type: 'code_output',
      options: ['"null"', '"object"', '"undefined"'],
      answer: '"object"',
      explanation: 'typeof null returns "object" due to a legacy JavaScript quirk.',
      published: false,
    },
    {
      prompt: 'A loop never terminates. Which line is the bug?',
      type: 'debugging',
      options: ['Line 1: let i = 0', 'Line 2: i++ should be i--'],
      answer: 'Line 2: i++ should be i--',
      explanation: 'Incrementing instead of decrementing prevents termination.',
      published: false,
    },
  ],
  null,
  2
);

export function QuestionManager() {
  const confirm = useConfirm();
  const [items, setItems] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [mode, setMode] = useState<'bulk' | 'manual'>('bulk');
  const [categoryId, setCategoryId] = useState('');
  const [editing, setEditing] = useState('');
  const [form, setForm] = useState({
    prompt: '',
    type: 'mcq',
    options: '',
    answer: '',
    explanation: '',
    published: false,
  });
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  async function load() {
    try {
      const res = await fetch('/api/admin/content?kind=questions');
      const data = await res.json();
      if (res.ok) {
        setItems(data.items ?? []);
        setCategories(data.categories ?? []);
        setMessage(null);
      } else {
        setMessage({ text: data.error || 'Unable to load questions.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Unable to connect to server.', type: 'error' });
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      items.filter((x) =>
        (!typeFilter || x.type === typeFilter) &&
        `${x.prompt} ${x.explanation}`.toLowerCase().includes(query.toLowerCase())
      ),
    [items, query, typeFilter]
  );

  function resetForm() {
    setEditing('');
    setForm({
      prompt: '',
      type: 'mcq',
      options: '',
      answer: '',
      explanation: '',
      published: false,
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/content?kind=questions', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: editing || undefined,
          name: form.prompt,
          categoryId,
          details: {
            type: form.type,
            options: form.options.split('\n').filter(Boolean),
            answer: form.answer,
            explanation: form.explanation,
          },
          published: form.published,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: 'Question saved successfully.', type: 'success' });
        resetForm();
        await load();
      } else {
        setMessage({ text: data.error || 'Unable to save question.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Failed to save question.', type: 'error' });
    }
  }

  function handleEditQuestion(q: Question) {
    setMode('manual');
    setEditing(q.id);
    setCategoryId(q.category_id ?? '');
    setForm({
      prompt: q.prompt,
      type: q.type,
      options: Array.isArray(q.options) ? q.options.join('\n') : '',
      answer: typeof q.answer === 'string' ? q.answer : JSON.stringify(q.answer ?? ''),
      explanation: q.explanation || '',
      published: q.published,
    });
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#0d111c] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Question Manager
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Bulk import or edit assessment questions across topics and categories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 text-xs px-3 py-1.5 rounded-full font-semibold">
            {items.length} Questions
          </span>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-zinc-50 dark:bg-[#131823] text-zinc-900 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">All Types</option>
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          {/* Mode Toggles */}
          <div className="flex items-center bg-zinc-100 dark:bg-[#161b26] p-1 rounded-xl border border-zinc-200 dark:border-white/5">
            <button
              type="button"
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                mode === 'bulk'
                  ? 'bg-white text-zinc-900 dark:bg-[#222938] dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              onClick={() => setMode('bulk')}
            >
              <FileJson className="w-3.5 h-3.5" /> Bulk JSON
            </button>
            <button
              type="button"
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                mode === 'manual'
                  ? 'bg-white text-zinc-900 dark:bg-[#222938] dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              onClick={() => setMode('manual')}
            >
              <Pencil className="w-3.5 h-3.5" /> Manual Editor
            </button>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`flex items-center gap-3 p-3.5 rounded-xl text-xs border ${
            message.type === 'error'
              ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
              : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
          }`}
        >
          {message.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {mode === 'bulk' ? (
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#0d111c] p-5 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-3">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Target Category (Applies to bulk batch)
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">No category (General)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <JsonBulkBox
                endpoint="/api/admin/content?kind=questions"
                title="Import Question Bank"
                description="Paste JSON payload directly from ChatGPT or external bank format."
                example={EXAMPLE_JSON}
                beforeSend={(records) =>
                  records.map((r) => ({ ...r, categoryId: categoryId || undefined }))
                }
                onImported={load}
              />
            </div>
          ) : (
            /* Manual Form */
            <section className="bg-white dark:bg-[#0d111c] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
              <form className="space-y-4" onSubmit={save}>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-white/5">
                  <Pencil className="w-4 h-4 text-indigo-500" />
                  {editing ? 'Edit Question' : 'Create New Question'}
                </h2>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">No category (General)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Question Prompt
                  </label>
                  <textarea
                    value={form.prompt}
                    onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                    rows={3}
                    required
                    placeholder="Enter question statement..."
                    className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Type
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                      <option value="single">Single Choice (legacy)</option>
                      <option value="text">Text Input (legacy)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Visibility
                    </label>
                    <select
                      value={String(form.published)}
                      onChange={(e) =>
                        setForm({ ...form, published: e.target.value === 'true' })
                      }
                      className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="false">Draft</option>
                      <option value="true">Published</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Correct Answer
                  </label>
                  <input
                    value={form.answer}
                    onChange={(e) => setForm({ ...form, answer: e.target.value })}
                    placeholder="e.g. <a>"
                    className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Options (One per line)
                  </label>
                  <textarea
                    value={form.options}
                    onChange={(e) => setForm({ ...form, options: e.target.value })}
                    rows={3}
                    placeholder={'Option A\nOption B\nOption C'}
                    className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Explanation
                  </label>
                  <textarea
                    value={form.explanation}
                    onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                    rows={2}
                    placeholder="Brief explanation for solution..."
                    className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {editing ? 'Save Changes' : 'Create Question'}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-3.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 font-medium text-xs rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>
          )}
        </div>

        {/* Right Side Question Bank List */}
        <div className="lg:col-span-2">
          <QuestionList
            items={filtered}
            query={query}
            setQuery={setQuery}
            categories={categories}
            onEditQuestion={handleEditQuestion}
          />
        </div>
      </div>
    </div>
  );
}

function QuestionList({
  items,
  query,
  setQuery,
  categories,
  onEditQuestion,
}: {
  items: Question[];
  query: string;
  setQuery: (x: string) => void;
  categories: Category[];
  onEditQuestion: (q: Question) => void;
}) {
  const confirm = useConfirm();
  const router = useRouter();
  const [draftName, setDraftName] = useState('');
  const [editingBankKey, setEditingBankKey] = useState('');
  const [editingBankTitle, setEditingBankTitle] = useState('');
  const [jsonBank, setJsonBank] = useState<{ key: string; name: string; value: string } | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; items: Question[] }>();
    for (const item of items) {
      const name = categories.find((c) => c.id === item.category_id)?.name ?? 'General';
      const key = item.category_id ?? 'general';
      const group = map.get(key) ?? { name, items: [] };
      group.items.push(item);
      map.set(key, group);
    }
    return map;
  }, [items, categories]);

  async function createBank() {
    const name = draftName.trim();
    if (!name) return;
    await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, published: true }),
    });
    setDraftName('');
    router.refresh();
  }

  async function renameBank(key: string) {
    if (key === 'general') return;
    const name = editingBankTitle.trim();
    if (!name) return;
    await fetch('/api/admin/categories', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: key, name, published: true }),
    });
    setEditingBankKey('');
    router.refresh();
  }

  async function setPublished(key: string, bank: Question[]) {
    const published = !bank.every((item) => item.published);
    await fetch('/api/admin/content?kind=questions', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'set-bank-published', categoryId: key, published }),
    });
    router.refresh();
  }

  async function deleteBank(key: string, bank: Question[]) {
    if (
      !(await confirm({
        title: 'Delete Question Bank?',
        message: `Delete all ${bank.length} questions in ${groups.get(key)?.name ?? 'this bank'}?`,
        confirmLabel: 'Delete All',
        danger: true,
      }))
    )
      return;

    const url =
      key === 'general'
        ? '/api/admin/content?kind=questions&general=true'
        : `/api/admin/content?kind=questions&categoryId=${key}`;

    await fetch(url, { method: 'DELETE' });
    router.refresh();
  }

  function editBank(bank: Question[], name: string, key: string) {
    setJsonBank({
      key,
      name,
      value: JSON.stringify(
        bank.map((item) => ({
          prompt: item.prompt,
          type: item.type,
          options: item.options,
          answer: item.answer,
          explanation: item.explanation,
          published: item.published,
        })),
        null,
        2
      ),
    });
  }

  async function saveJson() {
    if (!jsonBank) return;
    try {
      const records = JSON.parse(jsonBank.value) as Record<string, unknown>[];
      const bank = groups.get(jsonBank.key)?.items ?? [];
      for (const item of bank) {
        const record = records.find((entry) => entry.prompt === item.prompt);
        if (record) {
          await fetch('/api/admin/content?kind=questions', {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ id: item.id, ...record }),
          });
        }
      }
      setJsonBank(null);
      router.refresh();
    } catch {
      alert('Invalid JSON input syntax.');
    }
  }

  return (
    <section className="bg-white dark:bg-[#0d111c] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-5">
      {/* Search & Create Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions or answers..."
            className="w-full bg-zinc-50 dark:bg-[#131823] text-zinc-900 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="New Bank Name..."
            className="flex-1 sm:w-40 bg-zinc-50 dark:bg-[#131823] text-zinc-900 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="button"
            onClick={createBank}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-all shrink-0"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Create
          </button>
        </div>
      </div>

      {/* JSON Modal/Drawer Editor */}
      {jsonBank ? (
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <span className="text-xs font-semibold text-zinc-200">
              Editing <span className="text-indigo-400">{jsonBank.name}</span> JSON
            </span>
            <button
              type="button"
              onClick={() => setJsonBank(null)}
              className="text-zinc-400 hover:text-white p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            className="w-full font-mono text-xs bg-zinc-950 text-emerald-400 p-3 rounded-xl border border-zinc-800 focus:outline-none"
            rows={12}
            value={jsonBank.value}
            onChange={(e) => setJsonBank({ ...jsonBank, value: e.target.value })}
          />
          <button
            type="button"
            onClick={saveJson}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-xl transition-all"
          >
            Save All Questions
          </button>
        </div>
      ) : groups.size ? (
        <div className="space-y-4">
          {[...groups].map(([key, group]) => {
            const allPublished = group.items.every((item) => item.published);
            return (
              <div
                key={key}
                className="p-4 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-[#131823]/50 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-200/60 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    {editingBankKey === key ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          value={editingBankTitle}
                          onChange={(e) => setEditingBankTitle(e.target.value)}
                          className="bg-white dark:bg-[#0d111c] text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-white/10 rounded-lg px-2 py-1 text-xs"
                          placeholder="Rename bank..."
                        />
                        <button
                          onClick={() => renameBank(key)}
                          className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingBankKey('')}
                          className="p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          {group.name}
                        </h3>
                        {key !== 'general' && (
                          <button
                            onClick={() => {
                              setEditingBankKey(key);
                              setEditingBankTitle(group.name);
                            }}
                            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    )}
                    <span className="text-[10px] bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-full font-semibold">
                      {group.items.length}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => editBank(group.items, group.name, key)}
                      className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      Edit JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => setPublished(key, group.items)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                        allPublished
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                          : 'bg-zinc-100 border-zinc-200 text-zinc-600 dark:bg-white/5 dark:border-white/10 dark:text-zinc-400'
                      }`}
                    >
                      {allPublished ? 'Published' : 'Publish All'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBank(key, group.items)}
                      className="text-[11px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Question List Items */}
                <div className="space-y-2">
                  {group.items.map((q) => (
                    <div
                      key={q.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white dark:bg-[#0d111c] border border-zinc-200/80 dark:border-white/5"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                          {q.prompt}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                          <span className="uppercase font-mono">{q.type}</span>
                          <span>•</span>
                          <span className="truncate">Ans: {String(q.answer)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditQuestion(q)}
                          className="p-1.5 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 rounded hover:bg-zinc-100 dark:hover:bg-white/5"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-white/10 rounded-xl">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            No question banks found. Create one or bulk import.
          </p>
        </div>
      )}
    </section>
  );
}