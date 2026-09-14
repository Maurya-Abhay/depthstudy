'use client';

import Link from 'next/link';
import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  StickyNote,
  Terminal,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  HelpCircle,
  Code2,
  Briefcase,
} from 'lucide-react';
import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import type { Category, Topic } from '@/types';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

type StudyTopic = {
  id: string;
  title: string;
  slug: string;
  categoryName: string;
  progress: number;
};

type Props = {
  topic: Topic;
  category?: Category;
  prev?: Topic;
  next?: Topic;
  initialProgress?: number;
  initialNote?: string;
  initialBookmarked?: boolean;
  portalPath?: string;
  courseTitle?: string;
  courseTopics?: StudyTopic[];
  library?: {
    topics: Topic[];
  };
  fit?: boolean;
};

export function TopicWorkspace({
  topic: initialTopic,
  category,
  initialProgress = 0,
  initialNote = '',
  initialBookmarked = false,
  portalPath = '/study/topic',
  courseTitle,
  courseTopics = [],
  library,
  fit = false,
}: Props) {
  const [activeTopic, setActiveTopic] = useState<Topic>(initialTopic);
  const topic = activeTopic;

  const [progress, setProgress] = useState(initialProgress);
  const [message, setMessage] = useState('');
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState(initialTopic.output ?? 'No output yet.');
  const [note, setNote] = useState(initialNote);
  const [notesOpen, setNotesOpen] = useState(Boolean(initialNote));
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingTopic, setLoadingTopic] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    setIsFullscreen(localStorage.getItem('workspace_fullscreen') === 'true');
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      localStorage.setItem('workspace_fullscreen', active ? 'true' : 'false');
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    const next = !isFullscreen;
    setIsFullscreen(next);
    localStorage.setItem('workspace_fullscreen', next ? 'true' : 'false');
    if (next) {
      document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    if (initialTopic.id === activeTopic.id) return;
    setActiveTopic(initialTopic);
    setProgress(initialProgress);
    setNote(initialNote);
    setNotesOpen(Boolean(initialNote));
    setBookmarked(initialBookmarked);
    setOutput(initialTopic.output ?? 'No output yet.');
    setMessage('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopic.id, initialProgress, initialNote, initialBookmarked]);

  const normalizedTopics: StudyTopic[] = courseTopics.length
    ? courseTopics
    : (library?.topics || []).map((t) => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        categoryName: category?.name || 'Curriculum',
        progress: t.id === topic.id ? progress : 0,
      }));

  const [courseItems, setCourseItems] = useState<StudyTopic[]>(normalizedTopics);
  const categoryNames = [...new Set(courseItems.map((item) => item.categoryName))];
  const [openCategories, setOpenCategories] = useState<string[]>(categoryNames);

  function toggleCategory(cat: string) {
    setOpenCategories((current) =>
      current.includes(cat) ? current.filter((item) => item !== cat) : [...current, cat]
    );
  }

  function announceTopicChange(data: { topic: Topic; category?: { name?: string; slug?: string } | null; progress: number }) {
    window.dispatchEvent(
      new CustomEvent('study-topic-change', {
        detail: {
          title: data.topic.title,
          categoryName: data.category?.name,
          categorySlug: data.category?.slug,
          difficulty: data.topic.difficulty,
          estimatedMinutes: data.topic.estimatedMinutes,
          progress: data.progress,
        },
      })
    );
  }

  // Topic URL builder — supports both path style (/study/topic/slug)
  // and query style (/dashboard/notes?topic=slug) portals.
  function topicHref(slug: string) {
    return portalPath.endsWith('=')
      ? `${portalPath}${encodeURIComponent(slug)}`
      : `${portalPath}/${slug}`;
  }


  async function goToTopic(slug: string) {
    if (slug === topic.slug || loadingTopic) return;
    setLoadingTopic(true);
    try {
      const response = await fetch(`/api/study/topic?slug=${encodeURIComponent(slug)}`);
      if (!response.ok) throw new Error('Topic request failed.');
      const data = await response.json();
      window.history.pushState(null, '', topicHref(slug));
      setActiveTopic(data.topic);
      setProgress(data.progress ?? 0);
      setNote(data.note ?? '');
      setNotesOpen(Boolean(data.note));
      setBookmarked(Boolean(data.bookmarked));
      setOutput(data.topic?.output ?? 'No output yet.');
      setMessage('');
      setCourseItems((items) =>
        items.map((item) => (item.id === data.topic.id ? { ...item, progress: data.progress ?? 0 } : item))
      );
      announceTopicChange(data);
      contentRef.current?.scrollTo({ top: 0 });
    } catch {
      window.location.assign(topicHref(slug));
    } finally {
      setLoadingTopic(false);
    }
  }

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get('topic') ?? window.location.pathname.split('/').filter(Boolean).pop();
      if (slug && slug !== topic.slug) goToTopic(slug);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  });

  async function toggleBookmark() {
    if (bookmarkBusy) return;
    setBookmarkBusy(true);
    try {
      const response = await fetch(
        `/api/bookmarks${bookmarked ? `?topicId=${encodeURIComponent(topic.id)}` : ''}`,
        {
          method: bookmarked ? 'DELETE' : 'POST',
          headers: bookmarked ? undefined : { 'content-type': 'application/json' },
          body: bookmarked ? undefined : JSON.stringify({ topicId: topic.id }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setBookmarked(Boolean(data.bookmarked));
        setMessage(data.bookmarked ? 'Saved to bookmarks.' : 'Removed from bookmarks.');
      }
    } finally {
      setBookmarkBusy(false);
    }
  }

  async function complete() {
    const response = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ topicId: topic.id, progress: 100 }),
    });
    const data = await response.json();
    if (response.ok) {
      const nextProgress = data.progress ?? 100;
      setProgress(nextProgress);
      setCourseItems((items) =>
        items.map((item) => (item.id === topic.id ? { ...item, progress: nextProgress } : item))
      );
      announceTopicChange({ topic, progress: nextProgress });
      setMessage('Marked as complete!');
    }
  }

  async function runCode() {
    if (!topic.codeExample) return;
    setRunning(true);
    try {
      const response = await fetch('/api/code', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          source: topic.codeExample,
          stdin: '',
          language: topic.codeLanguage ?? 'javascript',
        }),
      });
      const data = await response.json();
      setOutput(data.output || data.error || 'No output returned.');
    } catch {
      setOutput('Code execution error.');
    } finally {
      setRunning(false);
    }
  }

  async function saveNote() {
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ topicId: topic.id, content: note }),
    });
    if (response.ok) setMessage('Note saved successfully.');
  }

  const anchors = [
    ['concept', 'Concept', Boolean(topic.concept)],
    ['explanation', 'Explanation', Boolean(topic.explanation)],
    ['mental-model', 'Mental Model', Boolean(topic.mentalModel)],
    ['example', 'Example', Boolean(topic.realExample)],
    ['code', 'Code Workspace', Boolean(topic.codeExample)],
    ['mistakes', 'Mistakes', Boolean(topic.commonMistakes?.length)],
    ['practice', 'Practice', Boolean(topic.practiceTask)],
    ['questions', 'Interview Qs', Boolean(topic.interviewQuestions?.length)],
    ['notes', 'Notes', true],
  ] as const;

  const completedTopics = courseItems.filter((item) => item.progress === 100).length;
  const courseProgress = courseItems.length
    ? Math.round(courseItems.reduce((sum, item) => sum + item.progress, 0) / courseItems.length)
    : progress;

  const currentIndex = courseItems.findIndex((item) => item.id === topic.id);
  const prevItem = currentIndex > 0 ? courseItems[currentIndex - 1] : undefined;
  const nextItem = currentIndex >= 0 && currentIndex < courseItems.length - 1 ? courseItems[currentIndex + 1] : undefined;

  return (
    <div
      className={`flex w-full gap-2 font-sans transition-all bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen p-3' : fit ? 'h-full p-2' : 'h-[calc(100vh-3.5rem)] p-2'
      }`}
    >
      {/* LEFT SIDEBAR */}
      <aside
        className={`flex shrink-0 flex-col rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#07090e] shadow-sm transition-all duration-300 ${
          sidebarOpen ? 'w-72' : 'w-12'
        }`}
      >
        <div className="flex h-11 items-center justify-between border-b border-zinc-200 dark:border-white/10 px-3">
          {sidebarOpen && (
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {courseTitle || 'Modules'}
            </span>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>

        {sidebarOpen ? (
          <div className="flex flex-1 flex-col overflow-y-auto p-2.5">
            <div className="mb-3 rounded-lg border border-zinc-200 bg-zinc-100/70 dark:border-white/5 dark:bg-zinc-900/60 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-600 dark:text-zinc-400">Total Progress</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{courseProgress}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                  style={{ width: `${courseProgress}%` }}
                  className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                {completedTopics}/{courseItems.length} finished
              </p>
            </div>

            <div className="space-y-2">
              {categoryNames.map((cat) => {
                const categoryItems = courseItems.filter((item) => item.categoryName === cat);
                const isOpen = openCategories.includes(cat);
                const categoryDone = categoryItems.filter((item) => item.progress === 100).length;

                return (
                  <div key={cat} className="overflow-hidden rounded-lg border border-zinc-200 dark:border-white/5">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between bg-zinc-100 dark:bg-zinc-900/40 px-3 py-2 text-left hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50"
                      onClick={() => toggleCategory(cat)}
                    >
                      <div className="truncate pr-2">
                        <strong className="block truncate text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          {cat}
                        </strong>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {categoryDone}/{categoryItems.length} finished
                        </span>
                      </div>
                      <ChevronDown
                        size={14}
                        className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isOpen && (
                      <div className="space-y-1 bg-white dark:bg-zinc-950/80 p-1.5">
                        {categoryItems.map((item) => {
                          const isCurrent = item.id === topic.id;
                          return (
                            <Link
                              key={item.id}
                              href={topicHref(item.slug)}
                              onClick={(event) => {
                                event.preventDefault();
                                goToTopic(item.slug);
                              }}
                              className={`flex items-center gap-2 rounded-md px-2.5 py-2 transition text-xs font-medium ${
                                isCurrent
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold dark:bg-indigo-600/20 dark:text-indigo-300 dark:border-indigo-500/30'
                                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                              }`}
                            >
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                                  item.progress === 100
                                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                    : 'border-zinc-300 dark:border-zinc-700'
                                }`}
                              >
                                {item.progress === 100 ? <Check size={10} /> : null}
                              </span>
                              <span className="truncate">{item.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center pt-4">
            <BookOpen size={18} className="text-zinc-400" />
          </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#07090e] shadow-sm">
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50/80 dark:border-white/10 dark:bg-zinc-900/40 px-4">
          <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{topic.title}</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
              title="Full Screen Workspace"
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            <button
              onClick={toggleBookmark}
              disabled={bookmarkBusy}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
            >
              <Bookmark size={14} className={bookmarked ? 'fill-indigo-500 text-indigo-500' : ''} />
              <span>{bookmarked ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={complete}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
            >
              <CheckCircle2 size={14} />
              <span>Complete</span>
            </button>
          </div>
        </div>

        <div
          ref={contentRef}
          className={`flex-1 overflow-y-auto p-6 space-y-6 transition-opacity duration-200 ${
            loadingTopic ? 'pointer-events-none opacity-40' : 'opacity-100'
          }`}
        >
          {/* Quick Jump Bar */}
          <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
            {anchors
              .filter(([, , present]) => present)
              .map(([id, label]) => (
                <a
                  href={`#${id}`}
                  key={id}
                  className="rounded-md border border-zinc-200 bg-zinc-100/80 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-indigo-50 hover:text-indigo-600 dark:border-white/5 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300 transition"
                >
                  {label}
                </a>
              ))}
          </div>

          {/* 1. Concept */}
          {topic.concept && (
            <section id="concept">
              <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                <BookOpen size={20} className="text-indigo-500" /> Concept
              </h2>
              <p className="mt-2 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">{topic.concept}</p>
            </section>
          )}

          {/* 2. Explanation */}
          {topic.explanation && (
            <section id="explanation" className="border-t border-zinc-200 dark:border-white/5 pt-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                <Lightbulb size={20} className="text-amber-500" /> Explanation
              </h2>
              <p className="mt-2 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">{topic.explanation}</p>
            </section>
          )}

          {/* 3. Mental Model */}
          {topic.mentalModel && (
            <section id="mental-model" className="border-t border-zinc-200 dark:border-white/5 pt-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                <HelpCircle size={20} className="text-sky-500" /> Mental Model
              </h2>
              <div className="mt-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 text-base leading-relaxed text-indigo-900 dark:border-indigo-500/20 dark:bg-indigo-950/20 dark:text-indigo-200">
                {topic.mentalModel}
              </div>
            </section>
          )}

          {/* 4. Example */}
          {topic.realExample && (
            <section id="example" className="border-t border-zinc-200 dark:border-white/5 pt-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                <Briefcase size={20} className="text-emerald-500" /> Real-World Example
              </h2>
              <p className="mt-2 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">{topic.realExample}</p>
            </section>
          )}

          {/* 5. Code Workspace */}
          {topic.codeExample && (
            <section id="code" className="border-t border-zinc-200 dark:border-white/5 pt-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  <Terminal size={20} className="text-indigo-500" /> Code Workspace
                </h2>
                <button
                  onClick={runCode}
                  disabled={running}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
                >
                  <Play size={12} fill="currentColor" /> {running ? 'Running...' : 'Run Code'}
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-zinc-300 bg-zinc-900 text-zinc-100 dark:border-white/10 dark:bg-[#040508]">
                <pre className="p-4 font-mono text-sm leading-relaxed overflow-x-auto text-emerald-400">
                  {topic.codeExample}
                </pre>
              </div>

              <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-100 p-4 font-mono text-xs text-zinc-800 dark:border-white/10 dark:bg-[#040508] dark:text-zinc-300">
                <strong className="block text-[11px] text-zinc-500 dark:text-zinc-400">OUTPUT:</strong>
                <pre className="mt-1.5 whitespace-pre-wrap">{output}</pre>
              </div>
            </section>
          )}

          {/* 6. Mistakes */}
          {topic.commonMistakes?.length ? (
            <section id="mistakes" className="border-t border-zinc-200 dark:border-white/5 pt-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-rose-500">
                <AlertTriangle size={20} /> Common Mistakes
              </h2>
              <ul className="mt-3 space-y-2 text-base text-zinc-700 dark:text-zinc-300">
                {topic.commonMistakes.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="mt-2 h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* 7. Practice */}
          {topic.practiceTask && (
            <section id="practice" className="border-t border-zinc-200 dark:border-white/5 pt-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                <Code2 size={20} className="text-purple-500" /> Practice Task
              </h2>
              <div className="mt-2.5 rounded-xl border border-purple-200 bg-purple-50/50 p-4 text-base text-purple-900 dark:border-purple-500/20 dark:bg-purple-950/20 dark:text-purple-200">
                {topic.practiceTask}
              </div>
            </section>
          )}

          {/* 8. Interview Questions */}
          {topic.interviewQuestions?.length ? (
            <section id="questions" className="border-t border-zinc-200 dark:border-white/5 pt-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                <HelpCircle size={20} className="text-teal-500" /> Interview Questions
              </h2>
              <ul className="mt-3 space-y-2.5 text-base text-zinc-700 dark:text-zinc-300">
                {topic.interviewQuestions.map((q, idx) => (
                  <li key={idx} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-white/5 dark:bg-zinc-900/40">
                    <strong className="text-zinc-900 dark:text-zinc-100">Q{idx + 1}: </strong>
                    {q}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* 9. Personal Notes */}
          <section id="notes" className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/30 overflow-hidden">
            <button
              type="button"
              className="flex w-full items-center justify-between p-4 text-left transition hover:bg-zinc-100 dark:hover:bg-zinc-900/60"
              onClick={() => setNotesOpen((v) => !v)}
            >
              <span className="flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                <StickyNote size={16} className="text-indigo-500" /> Personal Notes
              </span>
              <ChevronRight size={16} className={`text-zinc-400 transition-transform ${notesOpen ? 'rotate-90' : ''}`} />
            </button>

            {notesOpen && (
              <div className="border-t border-zinc-200 dark:border-white/10 p-4">
                <textarea
                  className="h-28 w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-800 outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Notes..."
                />
                <button
                  onClick={saveNote}
                  className="mt-2.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
                >
                  Save Note
                </button>
              </div>
            )}
          </section>

          {message && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-100 p-3 text-xs text-zinc-800 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
              {message}
            </div>
          )}

          {/* Footer Nav */}
          <div className="flex items-center justify-between border-t border-zinc-200 dark:border-white/10 pt-5">
            {prevItem ? (
              <button
                type="button"
                onClick={() => goToTopic(prevItem.slug)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition"
              >
                <ChevronLeft size={16} /> {prevItem.title}
              </button>
            ) : <span />}

            {nextItem ? (
              <button
                type="button"
                onClick={() => goToTopic(nextItem.slug)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition"
              >
                {nextItem.title} <ChevronRight size={16} />
              </button>
            ) : <span />}
          </div>
        </div>
      </main>
    </div>
  );
}