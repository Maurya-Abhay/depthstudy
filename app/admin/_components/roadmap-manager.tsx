'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Save,
  Sparkles,
  FileJson,
  ListChecks,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  BookOpen,
} from 'lucide-react';

type Roadmap = {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string;
  published: boolean;
  categoryIds: string[];
  topicIds: string[];
  categories: Array<{ id: string; name: string }>;
};

type Category = { id: string; name: string; slug: string };

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 120);
}

export function RoadmapManager() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState('');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(true);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  const [mode, setMode] = useState<'form' | 'json'>('form');
  const [jsonValue, setJsonValue] = useState('');

  const [aiOpen, setAiOpen] = useState(false);
  const [aiInstruction, setAiInstruction] = useState(
    'Build a beginner-to-job-ready roadmap covering the core subjects for this goal, in the right learning order.'
  );
  const [aiBusy, setAiBusy] = useState(false);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  async function load() {
    setMessage({ text: 'Loading roadmaps...', type: 'info' });
    try {
      const [roadmapRes, categoryRes] = await Promise.all([
        fetch('/api/admin/roadmaps'),
        fetch('/api/admin/categories'),
      ]);
      const roadmapData = await roadmapRes.json();
      const categoryData = await categoryRes.json();
      if (!roadmapRes.ok) throw new Error(roadmapData.error || 'Unable to load roadmaps.');
      if (!categoryRes.ok) throw new Error(categoryData.error || 'Unable to load categories.');
      setRoadmaps(roadmapData.roadmaps ?? []);
      setCategories(categoryData.categories ?? []);
      setMessage(null);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Unable to load roadmaps.',
        type: 'error',
      });
    }
  }

  useEffect(() => {
    load();
  }, []);

  const currentFormPayload = useMemo(
    () => ({
      id: selectedId || undefined,
      title,
      slug: slug || slugify(title),
      description,
      content,
      published,
      categoryIds,
    }),
    [selectedId, title, slug, description, content, published, categoryIds]
  );

  function resetForm() {
    setSelectedId('');
    setTitle('');
    setSlug('');
    setDescription('');
    setContent('');
    setPublished(true);
    setCategoryIds([]);
    setMessage(null);
    setJsonValue('');
  }

  function selectRoadmap(id: string) {
    setMessage(null);
    if (!id) {
      resetForm();
      return;
    }
    const roadmap = roadmaps.find((item) => item.id === id);
    if (!roadmap) return;
    setSelectedId(id);
    setTitle(roadmap.title);
    setSlug(roadmap.slug);
    setDescription(roadmap.description || '');
    setContent(roadmap.content || '');
    setPublished(roadmap.published);
    setCategoryIds(roadmap.categoryIds || []);
    setJsonValue(
      JSON.stringify(
        {
          id: roadmap.id,
          title: roadmap.title,
          description: roadmap.description,
          content: roadmap.content || '',
          published: roadmap.published,
          categories: roadmap.categories,
          categoryIds: roadmap.categoryIds,
          topicIds: roadmap.topicIds,
        },
        null,
        2
      )
    );
  }

  function toggleCategory(id: string) {
    setCategoryIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function moveCategory(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categoryIds.length) return;
    const updated = [...categoryIds];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setCategoryIds(updated);
  }

  function handleSwitchMode(targetMode: 'form' | 'json') {
    if (targetMode === 'json') {
      setJsonValue(JSON.stringify(currentFormPayload, null, 2));
    } else {
      try {
        const parsed = JSON.parse(jsonValue);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.slug) setSlug(parsed.slug);
        if (parsed.description) setDescription(parsed.description || '');
        if (parsed.content) setContent(parsed.content || '');
        if (typeof parsed.published === 'boolean') setPublished(parsed.published);
        if (Array.isArray(parsed.categoryIds)) setCategoryIds(parsed.categoryIds);
      } catch {
        // Fallback
      }
    }
    setMode(targetMode);
  }

  async function generateWithAi() {
    if (!title.trim()) {
      setMessage({ text: 'Add a roadmap title first, then generate with AI.', type: 'error' });
      return;
    }
    setAiBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: 'roadmap', title, instruction: aiInstruction }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI generation failed.');
      const draft = data.content as {
        title?: string;
        slug?: string;
        description?: string;
        categoryNames?: string[];
      };
      if (draft.description) setDescription(draft.description);
      if (draft.slug) setSlug(draft.slug);
      const matched = (draft.categoryNames ?? [])
        .map((name) =>
          categories.find((category) => category.name.toLowerCase() === String(name).toLowerCase())
        )
        .filter((category): category is Category => Boolean(category))
        .map((category) => category.id);
      if (matched.length) setCategoryIds([...new Set(matched)]);
      setMessage({
        text: matched.length
          ? `Draft generated. Matched ${matched.length} existing categories.`
          : 'Draft generated, but no categories matched. Pick them manually below.',
        type: 'success',
      });
      setAiOpen(false);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'AI service unavailable.',
        type: 'error',
      });
    } finally {
      setAiBusy(false);
    }
  }

  async function saveForm() {
    if (!title.trim()) {
      setMessage({ text: 'Roadmap title is required.', type: 'error' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const payload = {
        id: selectedId || undefined,
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        description: description.trim(),
        content,
        published,
        categoryIds,
      };
      const response = await fetch('/api/admin/roadmaps', {
        method: selectedId ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(selectedId ? payload : { records: [payload] }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save roadmap.');
      setMessage({
        text: selectedId ? 'Roadmap updated successfully.' : 'Roadmap created successfully.',
        type: 'success',
      });
      await load();
      if (!selectedId) resetForm();
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Unable to save roadmap.',
        type: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  async function saveJson() {
    setBusy(true);
    setMessage(null);
    try {
      const data = JSON.parse(jsonValue) as Record<string, unknown>;
      const response = await fetch('/api/admin/roadmaps', {
        method: selectedId ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(selectedId ? data : { records: [data] }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save roadmap.');
      setMessage({
        text: selectedId ? 'Roadmap updated successfully.' : 'Roadmap created from JSON.',
        type: 'success',
      });
      await load();
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Invalid JSON format.',
        type: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#0d111c] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Roadmap Manager
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Design, reorder, and structure learning paths for your platform.
          </p>
        </div>

        {/* View Toggles */}
        <div className="flex items-center bg-zinc-100 dark:bg-[#161b26] p-1 rounded-xl border border-zinc-200 dark:border-white/5">
          <button
            type="button"
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              mode === 'form'
                ? 'bg-white text-zinc-900 dark:bg-[#222938] dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
            onClick={() => handleSwitchMode('form')}
          >
            <ListChecks className="w-3.5 h-3.5" /> Visual Form
          </button>
          <button
            type="button"
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              mode === 'json'
                ? 'bg-white text-zinc-900 dark:bg-[#222938] dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
            onClick={() => handleSwitchMode('json')}
          >
            <FileJson className="w-3.5 h-3.5" /> JSON Editor
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`flex items-center gap-3 p-3.5 rounded-xl text-xs border ${
            message.type === 'error'
              ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
              : message.type === 'success'
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
              : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
          }`}
        >
          {message.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
          {message.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#0d111c] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-5">
            {/* Active Selection Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                ACTIVE SELECTION
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedId}
                  onChange={(event) => selectRoadmap(event.target.value)}
                  className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">
                    {roadmaps.length ? 'No existing roadmaps — create one below' : 'No existing roadmaps — create one below'}
                  </option>
                  {roadmaps.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.title} {item.published ? '' : '(Draft)'}
                    </option>
                  ))}
                </select>
                {selectedId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="p-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-transparent hover:bg-zinc-100 dark:hover:bg-[#181f2e] text-zinc-700 dark:text-zinc-300 transition-colors"
                    title="Clear Selection"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {mode === 'form' ? (
              <div className="space-y-4 pt-1">
                {/* Title & Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Roadmap Title
                    </label>
                    <input
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (!selectedId) setSlug(slugify(e.target.value));
                      }}
                      placeholder="e.g. Frontend Developer"
                      className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      URL Slug
                    </label>
                    <input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="frontend-developer"
                      className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Card Overview */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Card Overview
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Brief summary shown on overview cards..."
                    className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Course Syllabus Details */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Full Course Syllabus Details
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={7}
                    placeholder="Provide in-depth details, prerequisites, weekly modules, etc..."
                    className="w-full bg-zinc-50 text-zinc-900 dark:bg-[#131823] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-xl p-3.5 text-xs placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>

                {/* Category Reordering */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <FolderTree className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Included Categories & Sequence
                    </label>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Order dictates step progression</span>
                  </div>

                  <div className="bg-zinc-50 dark:bg-[#131823] border border-zinc-200 dark:border-white/10 rounded-xl p-2.5 space-y-2 max-h-56 overflow-y-auto">
                    {categories.length ? (
                      categories.map((cat) => {
                        const index = categoryIds.indexOf(cat.id);
                        const isSelected = index !== -1;
                        return (
                          <div
                            key={cat.id}
                            className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30'
                                : 'bg-white border-zinc-200 dark:bg-[#181f2e]/50 dark:border-white/5'
                            }`}
                          >
                            <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-medium text-zinc-800 dark:text-zinc-300">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleCategory(cat.id)}
                                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-0 border-zinc-300 dark:border-white/20 bg-transparent"
                              />
                              <span>{cat.name}</span>
                            </label>

                            {isSelected && (
                              <div className="flex items-center gap-2">
                                <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded">
                                  Step #{index + 1}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() => moveCategory(index, 'up')}
                                    className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-20 text-zinc-600 dark:text-zinc-300"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={index === categoryIds.length - 1}
                                    onClick={() => moveCategory(index, 'down')}
                                    className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-20 text-zinc-600 dark:text-zinc-300"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 p-2">No categories created yet.</p>
                    )}
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="published-status"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-0 border-zinc-300 dark:border-white/20 bg-transparent cursor-pointer"
                  />
                  <label htmlFor="published-status" className="text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                    Publish roadmap to public catalog
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-3 border-t border-zinc-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={saveForm}
                    disabled={busy}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {busy ? 'Saving...' : selectedId ? 'Update Roadmap' : 'Create Roadmap'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiOpen(!aiOpen)}
                    className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#161b26] dark:hover:bg-[#1d2433] text-zinc-800 dark:text-zinc-200 font-medium text-xs px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-white/5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> AI Draft
                  </button>

                  {selectedId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex items-center gap-1.5 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 text-xs px-3 py-2 transition-colors ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Cancel
                    </button>
                  )}
                </div>

                {/* AI Drawer */}
                {aiOpen && (
                  <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-500/20 space-y-2.5">
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" /> AI Generator Instructions
                    </div>
                    <textarea
                      value={aiInstruction}
                      onChange={(e) => setAiInstruction(e.target.value)}
                      rows={2}
                      className="w-full bg-white text-zinc-900 dark:bg-[#0d111c] dark:text-zinc-200 border border-zinc-200 dark:border-white/10 rounded-lg p-2.5 text-xs focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={generateWithAi}
                      disabled={aiBusy}
                      className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-all disabled:opacity-50"
                    >
                      {aiBusy ? 'Generating...' : 'Generate Roadmap Draft'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* JSON View */
              <div className="space-y-4 pt-1">
                <textarea
                  value={jsonValue}
                  onChange={(e) => setJsonValue(e.target.value)}
                  rows={16}
                  className="w-full font-mono text-xs bg-zinc-950 text-emerald-400 p-4 rounded-xl border border-zinc-800 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={saveJson}
                  disabled={busy}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {busy ? 'Saving...' : selectedId ? 'Update Roadmap via JSON' : 'Create from JSON'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Catalog Panel */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0d111c] p-5 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-white/5">
              <h2 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Existing Catalog
              </h2>
              <span className="text-[10px] bg-zinc-100 text-zinc-600 dark:bg-[#161b26] dark:text-zinc-400 px-2 py-0.5 rounded-full font-semibold border border-zinc-200 dark:border-white/5">
                {roadmaps.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {roadmaps.length ? (
                roadmaps.map((item) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => selectRoadmap(item.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all space-y-1 ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 dark:bg-indigo-500/10 dark:border-indigo-500/40 dark:text-white'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:border-zinc-300 dark:bg-[#131823]/60 dark:border-white/5 dark:text-zinc-300 dark:hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold truncate">
                          {item.title}
                        </span>
                        {!item.published && (
                          <span className="text-[9px] bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 px-1.5 py-0.5 rounded font-medium">
                            Draft
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {item.categories?.map((c) => c.name).join(' • ') || 'No categories'}
                      </p>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">No roadmaps generated yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}