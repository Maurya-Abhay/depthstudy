'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FileJson,
  Pencil,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  Lock,
  Layers,
  Sparkles,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { JsonBulkBox } from '@/app/admin/_components/json-bulk-box';
import { AdminPagination, paginate } from '@/app/admin/_components/admin-pagination';
import { useConfirm } from '@/components/ui/confirm-dialog';

type Course = { id: string; title: string };
type Question = { id: string; prompt: string; categoryId: string | null; categoryName: string };
type Test = {
  id: string;
  title: string;
  course_id: string | null;
  duration_minutes: number;
  passing_score: number;
  unlock_days: number;
  required_progress: number;
  max_attempts: number;
  random_questions: boolean;
  random_options: boolean;
  published: boolean;
};

const EXAMPLE_JSON = JSON.stringify(
  [
    {
      title: 'HTML Final Test',
      courseId: 'COURSE_ID',
      durationMinutes: 30,
      passingScore: 70,
      unlockDays: 10,
      requiredProgress: 100,
      maxAttempts: 1,
      questionIds: [],
      published: false,
    },
  ],
  null,
  2
);

export function TestManager() {
  const confirm = useConfirm();
  const [items, setItems] = useState<Test[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [links, setLinks] = useState<Record<string, string[]>>({});
  const [mode, setMode] = useState<'bulk' | 'manual'>('manual');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    title: '',
    courseId: '',
    duration: '30',
    passing: '70',
    unlock: '0',
    progress: '100',
    attempts: '1',
    randomQuestions: true,
    randomOptions: true,
    questionIds: [] as string[],
    published: false,
  });

  async function load() {
    try {
      const response = await fetch('/api/admin/content?kind=tests');
      const data = await response.json();
      if (response.ok) {
        setItems(data.items ?? []);
        setCourses(data.courses ?? []);
        setQuestions(data.questionOptions ?? []);
        setLinks(data.testQuestionIds ?? {});
        setMessage(null);
      } else {
        setMessage({ text: data.error || 'Unable to load tests.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Unable to connect to server.', type: 'error' });
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => items.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())),
    [items, query]
  );

  const banks = useMemo(() => {
    const grouped = new Map<string, { name: string; questions: Question[] }>();
    for (const question of questions) {
      const key = question.categoryId ?? 'general';
      const bank = grouped.get(key) ?? {
        name: question.categoryName || 'General Bank',
        questions: [],
      };
      bank.questions.push(question);
      grouped.set(key, bank);
    }
    return [...grouped.entries()];
  }, [questions]);

  function toggleBank(bankId: string) {
    setForm((current) => {
      const bankQuestionIds = questions
        .filter((q) => (q.categoryId ?? 'general') === bankId)
        .map((q) => q.id);

      const selected = new Set(current.questionIds);
      const allSelected = bankQuestionIds.every((id) => selected.has(id));

      bankQuestionIds.forEach((id) => {
        if (allSelected) {
          selected.delete(id);
        } else {
          selected.add(id);
        }
      });

      return { ...current, questionIds: [...selected] };
    });
  }

  function edit(item: Test) {
    setMode('manual');
    setEditing(item.id);
    setForm({
      title: item.title,
      courseId: item.course_id ?? '',
      duration: String(item.duration_minutes),
      passing: String(item.passing_score),
      unlock: String(item.unlock_days),
      progress: String(item.required_progress),
      attempts: String(item.max_attempts ?? 1),
      randomQuestions: item.random_questions !== false,
      randomOptions: item.random_options !== false,
      questionIds: links[item.id] ?? [],
      published: item.published,
    });
  }

  function clearForm() {
    setEditing('');
    setForm({
      title: '',
      courseId: '',
      duration: '30',
      passing: '70',
      unlock: '0',
      progress: '100',
      attempts: '1',
      randomQuestions: true,
      randomOptions: true,
      questionIds: [],
      published: false,
    });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    try {
      const response = await fetch('/api/admin/content?kind=tests', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: editing || undefined,
          name: form.title,
          parentId: form.courseId,
          published: form.published,
          questionIds: form.questionIds,
          details: {
            courseId: form.courseId,
            duration_minutes: Number(form.duration) || 30,
            passing_score: Number(form.passing) || 70,
            unlock_days: Number(form.unlock) || 0,
            required_progress: Number(form.progress) || 100,
            max_attempts: Number(form.attempts) || 1,
            random_questions: form.randomQuestions,
            random_options: form.randomOptions,
          },
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({
          text: editing ? 'Test updated successfully.' : 'Test created successfully.',
          type: 'success',
        });
        clearForm();
        load();
      } else {
        setMessage({ text: data.error || 'Unable to save test.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'An unexpected error occurred.', type: 'error' });
    }
  }

  async function remove(id: string) {
    if (
      !(await confirm({
        title: 'Delete test?',
        message: 'This test will be permanently removed.',
        confirmLabel: 'Delete',
        danger: true,
      }))
    )
      return;

    try {
      const response = await fetch(`/api/admin/content?kind=tests&id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setItems((current) => current.filter((item) => item.id !== id));
        setMessage({ text: 'Test deleted successfully.', type: 'success' });
      } else {
        const data = await response.json();
        setMessage({ text: data.error || 'Failed to delete test.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Unable to connect to server.', type: 'error' });
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0d111c] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Test Manager
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Configure assessments, scoring criteria, and map question banks.
          </p>
        </div>

        <div className="flex items-center bg-zinc-100 dark:bg-[#161b26] p-1 rounded-xl border border-zinc-200 dark:border-white/5">
          <button
            type="button"
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              mode === 'manual'
                ? 'bg-white text-zinc-900 dark:bg-[#222938] dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
            onClick={() => setMode('manual')}
          >
            <Pencil className="w-3.5 h-3.5" /> Test Editor
          </button>
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

      {/* Main Grid View */}
      {mode === 'bulk' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <JsonBulkBox
              endpoint="/api/admin/content?kind=tests"
              title="Import Tests"
              description="Create test definitions in bulk. Add questionIds when you already have a question bank."
              example={EXAMPLE_JSON}
              onImported={load}
            />
          </div>
          <div className="lg:col-span-2">
            <TestList items={filtered} query={query} setQuery={setQuery} edit={edit} remove={remove} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor Form */}
          <section className="lg:col-span-1 bg-white dark:bg-[#0d111c] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
            <form className="space-y-4" onSubmit={save}>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-white/5">
                <Pencil className="w-4 h-4 text-indigo-500" />
                {editing ? 'Edit Test Setup' : 'Create New Test'}
              </h2>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Test Title
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Intermediate Assessment"
                  required
                  className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Course
                </label>
                <select
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">General test (No course)</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Duration (Min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Passing Score %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.passing}
                    onChange={(e) => setForm({ ...form, passing: e.target.value })}
                    className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Unlock (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.unlock}
                    onChange={(e) => setForm({ ...form, unlock: e.target.value })}
                    className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Required Progress %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.progress}
                    onChange={(e) => setForm({ ...form, progress: e.target.value })}
                    className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Attempts Allowed
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.attempts}
                    onChange={(e) => setForm({ ...form, attempts: e.target.value })}
                    className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Visibility
                  </label>
                  <select
                    value={String(form.published)}
                    onChange={(e) => setForm({ ...form, published: e.target.value === 'true' })}
                    className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="false">Draft</option>
                    <option value="true">Published</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-1">
                <label className="flex items-start gap-3 p-2.5 rounded-xl border border-zinc-200/80 dark:border-white/5 bg-zinc-50/50 dark:bg-[#131823]/50 cursor-pointer hover:bg-zinc-100 dark:hover:bg-[#131823] transition-colors">
                  <input
                    type="checkbox"
                    checked={form.randomQuestions}
                    onChange={(e) => setForm({ ...form, randomQuestions: e.target.checked })}
                    className="mt-0.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 block">
                      Randomize Question Order
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block leading-tight">
                      Shuffle assigned questions per student attempt.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-xl border border-zinc-200/80 dark:border-white/5 bg-zinc-50/50 dark:bg-[#131823]/50 cursor-pointer hover:bg-zinc-100 dark:hover:bg-[#131823] transition-colors">
                  <input
                    type="checkbox"
                    checked={form.randomOptions}
                    onChange={(e) => setForm({ ...form, randomOptions: e.target.checked })}
                    className="mt-0.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 block">
                      Randomize Answer Options
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block leading-tight">
                      Shuffle option ordering without changing answer keys.
                    </span>
                  </div>
                </label>
              </div>

              {/* Question Banks Mapping */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Question Banks
                  </label>
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">
                    Selected: {form.questionIds.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {banks.map(([id, bank]) => {
                    const selected =
                      bank.questions.length > 0 &&
                      bank.questions.every((q) => form.questionIds.includes(q.id));

                    return (
                      <button
                        type="button"
                        key={id}
                        onClick={() => toggleBank(id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                          selected
                            ? 'bg-indigo-50/80 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20'
                            : 'bg-zinc-50 dark:bg-[#131823] border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            {bank.name}
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            {bank.questions.length} Questions
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                            selected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-300'
                          }`}
                        >
                          {selected ? 'Selected' : 'Select'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {editing ? 'Save Changes' : 'Create Test'}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={clearForm}
                    className="px-3.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 font-medium text-xs rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* List Display View */}
          <div className="lg:col-span-2">
            <TestList items={filtered} query={query} setQuery={setQuery} edit={edit} remove={remove} />
          </div>
        </div>
      )}
    </div>
  );
}

function TestList({
  items,
  query,
  setQuery,
  edit,
  remove,
}: {
  items: Test[];
  query: string;
  setQuery: (value: string) => void;
  edit: (item: Test) => void;
  remove: (id: string) => void;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const visible = paginate(items, page, pageSize);

  return (
    <section className="bg-white dark:bg-[#0d111c] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tests..."
          className="w-full bg-zinc-50 dark:bg-[#131823] text-zinc-900 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* List Container */}
      {visible.length ? (
        <div className="space-y-2.5">
          {visible.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/80 dark:border-white/5 bg-zinc-50/50 dark:bg-[#131823]/50 hover:bg-zinc-100/60 dark:hover:bg-[#131823] transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white">{item.title}</h3>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      item.published
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-white/5 dark:text-zinc-400 dark:border-white/10'
                    }`}
                  >
                    {item.published ? 'Published' : 'Draft'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    {item.duration_minutes} min
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Award className="w-3 h-3 text-zinc-400" />
                    {item.passing_score}% pass
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-zinc-400" />
                    unlock {item.unlock_days}d
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => edit(item)}
                  className="p-1.5 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-white/5 transition-colors"
                  aria-label="Edit test"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => remove(item.id)}
                  className="p-1.5 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  aria-label="Delete test"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-white/10 rounded-xl">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">No tests found matching criteria.</p>
        </div>
      )}

      {/* Pagination Footer */}
      <AdminPagination
        page={page}
        pageCount={pageCount}
        total={items.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </section>
  );
}