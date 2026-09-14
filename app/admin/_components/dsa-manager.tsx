'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Code2,
  FileJson,
  Pencil,
  Plus,
  Search,
  Trash2,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  FolderPlus,
} from 'lucide-react';
import { JsonBulkBox } from '@/app/admin/_components/json-bulk-box';
import { AdminPagination, paginate } from '@/app/admin/_components/admin-pagination';
import { useConfirm } from '@/components/ui/confirm-dialog';

type Topic = { id: string; name: string };
type Problem = {
  id: string;
  topic_id: string | null;
  title: string;
  difficulty: string;
  pattern: string;
  summary: string;
  problem: string;
  examples: string;
  constraints: string;
  hint: string;
  brute_force: string;
  optimized: string;
  time_complexity: string;
  space_complexity: string;
  starter_code: string;
  solution: string;
  test_cases: unknown;
  published: boolean;
};

const TOPIC_EXAMPLE = JSON.stringify(
  [
    {
      name: 'Arrays',
      slug: 'arrays',
      description: 'Array problem patterns',
      sortOrder: 1,
      published: true,
    },
  ],
  null,
  2
);

const PROBLEM_EXAMPLE = JSON.stringify(
  [
    {
      topicId: 'DSA_TOPIC_ID',
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: 'Easy',
      pattern: 'Hash Map',
      summary: 'Find two indices whose values add to the target.',
      problem: '...',
      examples: 'Input: [2,7,11,15], target 9\nOutput: [0,1]',
      constraints: '...',
      hint: 'Use a map for seen values.',
      bruteForce: 'Try every pair.',
      optimized: 'Store the complement in a hash map.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      starterCode: 'class Solution { }',
      solution: '...',
      testCases: [{ input: '[2,7,11,15]\n9', output: '[0,1]' }],
      published: false,
    },
  ],
  null,
  2
);

export function DsaManager() {
  const confirm = useConfirm();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [mode, setMode] = useState<'topics' | 'problems' | 'problem-manual'>('topics');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    title: '',
    topicId: '',
    difficulty: 'Easy',
    pattern: '',
    summary: '',
    problem: '',
    examples: '',
    constraints: '',
    hint: '',
    bruteForce: '',
    optimized: '',
    timeComplexity: '',
    spaceComplexity: '',
    starterCode: '',
    solution: '',
    testCases: '',
    published: false,
  });

  async function loadTopics() {
    try {
      const r = await fetch('/api/admin/dsa-topics');
      const d = await r.json();
      if (r.ok) setTopics(d.topics ?? []);
    } catch {
      setMessage({ text: 'Unable to load DSA topics.', type: 'error' });
    }
  }

  async function loadProblems() {
    try {
      const r = await fetch('/api/admin/content?kind=dsa');
      const d = await r.json();
      if (r.ok) setProblems(d.items ?? []);
    } catch {
      setMessage({ text: 'Unable to load DSA problems.', type: 'error' });
    }
  }

  useEffect(() => {
    loadTopics();
    loadProblems();
  }, []);

  const filtered = useMemo(
    () =>
      problems.filter((p) =>
        `${p.title} ${p.pattern} ${p.summary}`.toLowerCase().includes(query.toLowerCase())
      ),
    [problems, query]
  );

  function resetForm() {
    setEditing('');
    setForm({
      title: '',
      topicId: '',
      difficulty: 'Easy',
      pattern: '',
      summary: '',
      problem: '',
      examples: '',
      constraints: '',
      hint: '',
      bruteForce: '',
      optimized: '',
      timeComplexity: '',
      spaceComplexity: '',
      starterCode: '',
      solution: '',
      testCases: '',
      published: false,
    });
  }

  async function saveProblem(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        id: editing || undefined,
        name: form.title,
        details: {
          topicId: form.topicId,
          difficulty: form.difficulty,
          pattern: form.pattern,
          summary: form.summary,
          problem: form.problem,
          examples: form.examples,
          constraints: form.constraints,
          hint: form.hint,
          bruteForce: form.bruteForce,
          optimized: form.optimized,
          timeComplexity: form.timeComplexity,
          spaceComplexity: form.spaceComplexity,
          starterCode: form.starterCode,
          solution: form.solution,
          testCases: form.testCases.split('\n').filter(Boolean),
        },
        published: form.published,
      };

      const r = await fetch('/api/admin/content?kind=dsa', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const d = await r.json();
      if (r.ok) {
        setMessage({
          text: editing ? 'Problem updated successfully.' : 'Problem created successfully.',
          type: 'success',
        });
        resetForm();
        setMode('problems');
        loadProblems();
      } else {
        setMessage({ text: d.error || 'Unable to save problem.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Failed to connect to server.', type: 'error' });
    }
  }

  function edit(p: Problem) {
    setMode('problem-manual');
    setEditing(p.id);
    setForm({
      title: p.title,
      topicId: p.topic_id ?? '',
      difficulty: p.difficulty,
      pattern: p.pattern,
      summary: p.summary,
      problem: p.problem,
      examples: p.examples,
      constraints: p.constraints,
      hint: p.hint,
      bruteForce: p.brute_force,
      optimized: p.optimized,
      timeComplexity: p.time_complexity,
      spaceComplexity: p.space_complexity,
      starterCode: p.starter_code,
      solution: p.solution,
      testCases: Array.isArray(p.test_cases)
        ? p.test_cases.map((x) => JSON.stringify(x)).join('\n')
        : String(p.test_cases ?? ''),
      published: p.published,
    });
  }

  async function remove(id: string) {
    if (
      !(await confirm({
        title: 'Delete DSA Problem?',
        message: 'This problem will be permanently removed.',
        confirmLabel: 'Delete',
        danger: true,
      }))
    )
      return;

    try {
      const r = await fetch(`/api/admin/content?kind=dsa&id=${id}`, { method: 'DELETE' });
      if (r.ok) {
        setProblems((v) => v.filter((x) => x.id !== id));
        setMessage({ text: 'Problem removed successfully.', type: 'success' });
      } else {
        const d = await r.json();
        setMessage({ text: d.error || 'Failed to delete problem.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Unable to connect to server.', type: 'error' });
    }
  }

  const formFields = [
    'pattern',
    'summary',
    'problem',
    'examples',
    'constraints',
    'hint',
    'bruteForce',
    'optimized',
    'timeComplexity',
    'spaceComplexity',
    'starterCode',
    'solution',
    'testCases',
  ] as const;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0d111c] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            DSA Practice
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Create DSA topics, manage coding patterns, and link algorithmic problems.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-zinc-100 dark:bg-[#161b26] p-1 rounded-xl border border-zinc-200 dark:border-white/5">
          <button
            type="button"
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              mode === 'topics'
                ? 'bg-white text-zinc-900 dark:bg-[#222938] dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
            onClick={() => setMode('topics')}
          >
            <FolderPlus className="w-3.5 h-3.5" /> Topics JSON
          </button>
          <button
            type="button"
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              mode === 'problems'
                ? 'bg-white text-zinc-900 dark:bg-[#222938] dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
            onClick={() => setMode('problems')}
          >
            <FileJson className="w-3.5 h-3.5" /> Problems JSON
          </button>
          <button
            type="button"
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              mode === 'problem-manual'
                ? 'bg-white text-zinc-900 dark:bg-[#222938] dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
            onClick={() => setMode('problem-manual')}
          >
            <Pencil className="w-3.5 h-3.5" /> Manual Editor
          </button>
        </div>
      </div>

      {/* Notification Banner */}
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

      {/* Dynamic View Sections */}
      {mode === 'topics' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <JsonBulkBox
              endpoint="/api/admin/dsa-topics"
              title="Add DSA Topics"
              description="Batch import topics such as Arrays, Strings, Trees, Dynamic Programming, etc."
              example={TOPIC_EXAMPLE}
              onImported={() => loadTopics()}
            />
          </div>
          <div className="lg:col-span-2">
            <DsaTopicList topics={topics} />
          </div>
        </div>
      ) : mode === 'problems' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-[#0d111c] p-5 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-2">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Target Topic (Applies to all imported problems)
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Choose DSA Topic</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <JsonBulkBox
              endpoint="/api/admin/content?kind=dsa"
              title="Import DSA Problems"
              description="Select a topic, paste JSON payload array, preview records, and import."
              example={PROBLEM_EXAMPLE}
              beforeSend={(records) =>
                records.map((r) => ({ ...r, topicId: selectedTopic || undefined }))
              }
              onImported={loadProblems}
            />
          </div>
          <div className="lg:col-span-2">
            <ProblemList
              problems={filtered}
              query={query}
              setQuery={setQuery}
              edit={edit}
              remove={remove}
            />
          </div>
        </div>
      ) : (
        /* Manual Problem Editor */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-1 bg-white dark:bg-[#0d111c] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
            <form className="space-y-4" onSubmit={saveProblem}>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-white/5">
                <Pencil className="w-4 h-4 text-indigo-500" />
                {editing ? 'Edit DSA Problem' : 'Create New Problem'}
              </h2>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Problem Title
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Valid Anagram"
                  required
                  className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    DSA Topic
                  </label>
                  <select
                    value={form.topicId}
                    onChange={(e) => setForm({ ...form, topicId: e.target.value })}
                    className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">No topic</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Difficulty
                  </label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Inputs */}
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {formFields.map((key) => {
                  const label = key
                    .replace(/[A-Z]/g, (m) => ` ${m}`)
                    .replace(/^./, (m) => m.toUpperCase());

                  return (
                    <div className="space-y-1" key={key}>
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        {label}
                      </label>
                      <textarea
                        value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        rows={2}
                        className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Status
                </label>
                <select
                  value={String(form.published)}
                  onChange={(e) => setForm({ ...form, published: e.target.value === 'true' })}
                  className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="false">Draft</option>
                  <option value="true">Published</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {editing ? 'Save Changes' : 'Create Problem'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setMode('problems');
                  }}
                  className="px-3.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 font-medium text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>

          <div className="lg:col-span-2">
            <ProblemList
              problems={filtered}
              query={query}
              setQuery={setQuery}
              edit={edit}
              remove={remove}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DsaTopicList({ topics }: { topics: Topic[] }) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(topics.length / pageSize));

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const visible = paginate(topics, page, pageSize);

  return (
    <section className="bg-white dark:bg-[#0d111c] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-white/5">
        <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
          DSA Topics
        </h3>
        <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 text-[10px] px-2 py-0.5 rounded-full font-semibold">
          {topics.length} Total
        </span>
      </div>

      {visible.length ? (
        <div className="space-y-2">
          {visible.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 dark:border-white/5 bg-zinc-50/50 dark:bg-[#131823]/50"
            >
              <div className="space-y-0.5">
                <strong className="text-xs font-bold text-zinc-900 dark:text-white block">
                  {t.name}
                </strong>
                <span className="text-[10px] text-zinc-400 font-mono block">{t.id}</span>
              </div>
              <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                Topic
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-white/10 rounded-xl">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">No DSA topics defined yet.</p>
        </div>
      )}

      <AdminPagination
        page={page}
        pageCount={pageCount}
        total={topics.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </section>
  );
}

function ProblemList({
  problems,
  query,
  setQuery,
  edit,
  remove,
}: {
  problems: Problem[];
  query: string;
  setQuery: (x: string) => void;
  edit: (x: Problem) => void;
  remove: (id: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [topicFilter, setTopicFilter] = useState('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const pageSize = 10;

  useEffect(() => {
    fetch('/api/admin/dsa-topics')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setTopics(data?.topics ?? []))
      .catch(() => undefined);
  }, []);

  const filteredProblems = useMemo(
    () => (topicFilter ? problems.filter((problem) => problem.topic_id === topicFilter) : problems),
    [problems, topicFilter]
  );

  const pageCount = Math.max(1, Math.ceil(filteredProblems.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [query, topicFilter]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const visible = paginate(filteredProblems, page, pageSize);

  return (
    <section className="bg-white dark:bg-[#0d111c] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search DSA problems..."
            className="w-full bg-zinc-50 dark:bg-[#131823] text-zinc-900 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          aria-label="Filter DSA problems by topic"
          className="w-full sm:w-auto bg-zinc-50 dark:bg-[#131823] text-zinc-900 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
        >
          <option value="">All Topics</option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </select>
      </div>

      {/* Problem Items */}
      {visible.length ? (
        <div className="space-y-2.5">
          {visible.map((p) => {
            const diffColor =
              p.difficulty === 'Easy'
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                : p.difficulty === 'Medium'
                ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'
                : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10';

            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/80 dark:border-white/5 bg-zinc-50/50 dark:bg-[#131823]/50 hover:bg-zinc-100/60 dark:hover:bg-[#131823] transition-all"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      {p.title}
                    </h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${diffColor}`}
                    >
                      {p.difficulty}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    Pattern: {p.pattern || 'No pattern specified'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      p.published
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-white/5 dark:text-zinc-400 dark:border-white/10'
                    }`}
                  >
                    {p.published ? 'Published' : 'Draft'}
                  </span>

                  <button
                    onClick={() => edit(p)}
                    className="p-1.5 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-white/5 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-white/10 rounded-xl">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            No DSA problems found matching current filters.
          </p>
        </div>
      )}

      {/* Pagination Footer */}
      <AdminPagination
        page={page}
        pageCount={pageCount}
        total={filteredProblems.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </section>
  );
}