'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BrainCircuit,
  Check,
  FilePlus2,
  Layers3,
  Sparkles,
  Wand2,
  AlertCircle,
  Loader2,
  Code2,
} from 'lucide-react';
import { AdminShell } from '@/app/admin/_components/admin-shell';

type Generated = Record<string, unknown>;
type Course = { id: string; title: string };
type Category = { id: string; name: string };
type Topic = { id: string; title: string };

const defaultInstruction =
  'Create a beginner-friendly draft with a clear concept, simple explanation, mental model, practical example, common mistakes, practice task and interview questions.';

export default function AiPage() {
  const [kind, setKind] = useState('topic');
  const [title, setTitle] = useState('HTML Forms');
  const [instruction, setInstruction] = useState(defaultInstruction);
  const [categoryId, setCategoryId] = useState('');
  const [quizTopicId, setQuizTopicId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [testCourseId, setTestCourseId] = useState('');
  const [result, setResult] = useState<Generated | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const preview = useMemo(
    () => (result ? JSON.stringify(result, null, 2) : ''),
    [result]
  );

  const modeHint =
    kind === 'topic-outline'
      ? 'AI will create a complete roadmap for the selected category.'
      : kind === 'topic'
      ? 'AI will write one complete lesson for the selected category.'
      : kind === 'quiz'
      ? 'AI will create questions for the selected topic.'
      : kind === 'test'
      ? 'AI will create questions and assessment rules for the selected course.'
      : 'AI will create a coding problem with a solution and test cases.';

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/categories').then((response) => response.json()),
      fetch('/api/admin/content?kind=topics').then((response) => response.json()),
      fetch('/api/admin/content?kind=tests').then((response) => response.json()),
    ])
      .then(([categoryData, topicData, testData]) => {
        setCategories(categoryData.categories ?? []);
        setTopics(
          (topicData.items ?? []).map((item: { id: string; title: string }) => ({
            id: item.id,
            title: item.title,
          }))
        );
        setCourses(
          (testData.parents ?? []).map(
            (item: { id: string; name?: string; title?: string }) => ({
              id: item.id,
              title: item.name ?? item.title ?? 'Course',
            })
          )
        );
      })
      .catch(() => {
        setCategories([]);
        setTopics([]);
      });
  }, []);

  async function generate() {
    setBusy(true);
    setMessage('');
    setResult(null);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, title, instruction }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI generation failed.');
      setResult(data.content);
      setMessage('Draft generated. Review it before saving.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'AI service unavailable.');
    } finally {
      setBusy(false);
    }
  }

  async function improve() {
    const nextInstruction = `${instruction}\nImprove the current draft: make it clearer, more accurate, and more useful without changing the topic.`;
    setInstruction(nextInstruction);
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, title, instruction: nextInstruction }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI improvement failed.');
      setResult(data.content);
      setMessage('Improved draft generated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'AI service unavailable.');
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft() {
    if (!result) return;
    const response = await fetch('/api/ai/save', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind, title, instruction, output: result }),
    });
    const data = await response.json();
    setMessage(
      response.ok
        ? `Review draft saved: ${data.id}`
        : data.error || 'Unable to save draft.'
    );
  }

  async function saveTopic() {
    if (!result) return;
    if (!categoryId) {
      setMessage('Choose a category before saving this as a topic.');
      return;
    }
    const text = (key: string) =>
      typeof result[key] === 'string' ? (result[key] as string) : '';
    const list = (key: string) => (Array.isArray(result[key]) ? result[key] : []);
    const response = await fetch('/api/admin/content?kind=topics', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: text('title') || title,
        description: text('summary'),
        categoryId,
        published: false,
        details: {
          summary: text('summary'),
          concept: text('concept'),
          explanation: text('explanation'),
          mental_model: text('mentalModel') || null,
          real_example: text('realExample') || null,
          code_example: text('codeExample') || null,
          code_language: text('codeLanguage') || null,
          output: text('output') || null,
          common_mistakes: list('commonMistakes'),
          practice_task: text('practiceTask') || null,
          interview_questions: list('interviewQuestions'),
        },
      }),
    });
    const data = await response.json();
    setMessage(
      response.ok
        ? 'Topic saved as an unpublished draft. Review it in Topics.'
        : data.error || 'Unable to save topic.'
    );
  }

  async function saveGenerated() {
    if (!result) return;
    const text = (key: string) =>
      typeof result[key] === 'string' ? (result[key] as string) : '';
    const list = (key: string) => (Array.isArray(result[key]) ? result[key] : []);

    if (kind === 'topic-outline') {
      if (!categoryId || !Array.isArray(result.topics)) {
        setMessage('Choose a category and generate a topic outline first.');
        return;
      }
      const responses = await Promise.all(
        (result.topics as Array<Record<string, unknown>>).map((item) =>
          fetch('/api/admin/content?kind=topics', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              name: String(item.title || 'Untitled topic'),
              description: String(item.summary || ''),
              categoryId,
              published: false,
              details: {
                summary: String(item.summary || ''),
                difficulty: String(item.difficulty || 'Beginner'),
                estimated_minutes: Number(item.estimatedMinutes) || 10,
              },
            }),
          })
        )
      );
      const failed = responses.filter((response) => !response.ok).length;
      setMessage(
        failed
          ? `${responses.length - failed} topics saved, ${failed} failed. Open Topics to review.`
          : `${responses.length} topic drafts added to the category.`
      );
      return;
    }

    if (kind === 'dsa') {
      const response = await fetch('/api/admin/content?kind=dsa', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: text('title') || title,
          description: text('summary'),
          published: false,
          details: {
            difficulty: text('difficulty') || 'Easy',
            pattern: text('pattern'),
            summary: text('summary'),
            problem: text('problem'),
            examples: text('examples'),
            constraints: text('constraints'),
            hint: text('hint'),
            brute_force: text('bruteForce'),
            optimized: text('optimized'),
            time_complexity: text('timeComplexity'),
            space_complexity: text('spaceComplexity'),
            starter_code: text('starterCode'),
            solution: text('solution'),
            test_cases: list('testCases'),
          },
        }),
      });
      setMessage(
        response.ok
          ? 'DSA problem draft added to the database.'
          : 'Unable to save DSA draft.'
      );
      return;
    }

    if (kind === 'quiz') {
      if (!quizTopicId || !Array.isArray(result.questions)) {
        setMessage('Choose a topic and generate quiz questions first.');
        return;
      }
      const responses = await Promise.all(
        (result.questions as Array<Record<string, unknown>>).map((question) =>
          fetch('/api/admin/content?kind=questions', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              name: String(question.prompt || 'Question'),
              description: String(question.explanation || ''),
              parentId: quizTopicId,
              published: false,
              details: {
                type: String(question.type || 'mcq'),
                options: Array.isArray(question.options) ? question.options : [],
                answer: question.answer ?? null,
                explanation: String(question.explanation || ''),
              },
            }),
          })
        )
      );
      setMessage(
        responses.every((response) => response.ok)
          ? `${responses.length} question drafts added.`
          : 'Some questions could not be saved.'
      );
      return;
    }

    if (kind === 'test') {
      if (!testCourseId || !Array.isArray(result.questions)) {
        setMessage('Choose a course and generate test questions first.');
        return;
      }
      const questionIds: string[] = [];
      for (const question of result.questions as Array<Record<string, unknown>>) {
        const response = await fetch('/api/admin/content?kind=questions', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: String(question.prompt || 'Question'),
            description: String(question.explanation || ''),
            published: false,
            details: {
              type: String(question.type || 'mcq'),
              options: Array.isArray(question.options) ? question.options : [],
              answer: question.answer ?? null,
              explanation: String(question.explanation || ''),
            },
          }),
        });
        const data = await response.json();
        if (response.ok && data.item?.id) questionIds.push(data.item.id);
      }
      const response = await fetch('/api/admin/content?kind=tests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: String(result.title || title),
          description: String(result.description || ''),
          parentId: testCourseId,
          published: false,
          questionIds,
          details: {
            duration_minutes: Number(result.durationMinutes) || 30,
            passing_score: Number(result.passingScore) || 70,
            unlock_days: Number(result.unlockDays) || 0,
            required_progress: Number(result.requiredProgress) || 100,
          },
        }),
      });
      setMessage(
        response.ok
          ? `Test draft saved with ${questionIds.length} questions.`
          : 'Unable to save test draft.'
      );
    }
  }

  async function saveDetailedOutline() {
    if (!result || !categoryId || !Array.isArray(result.topics)) {
      setMessage('Choose a category and generate a topic outline first.');
      return;
    }
    setBusy(true);
    setMessage('Generating detailed content for every topic...');
    let saved = 0;
    try {
      for (const item of result.topics as Array<Record<string, unknown>>) {
        const topicTitle = String(item.title || 'Untitled topic');
        const generation = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            kind: 'topic',
            title: topicTitle,
            instruction: `Create a complete detailed lesson for ${topicTitle}. Include a clear concept, explanation, mental model, practical example, code example when useful, expected output, common mistakes, practice task, and interview questions.`,
          }),
        });
        const generated = await generation.json();
        if (!generation.ok || !generated.content) continue;
        const content = generated.content as Record<string, unknown>;
        const text = (key: string) =>
          typeof content[key] === 'string' ? (content[key] as string) : '';
        const list = (key: string) =>
          Array.isArray(content[key]) ? content[key] : [];
        const savedResponse = await fetch('/api/admin/content?kind=topics', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: text('title') || topicTitle,
            description: text('summary'),
            categoryId,
            published: false,
            details: {
              summary: text('summary'),
              concept: text('concept'),
              explanation: text('explanation'),
              mental_model: text('mentalModel') || null,
              real_example: text('realExample') || null,
              code_example: text('codeExample') || null,
              code_language: text('codeLanguage') || null,
              output: text('output') || null,
              common_mistakes: list('commonMistakes'),
              practice_task: text('practiceTask') || null,
              interview_questions: list('interviewQuestions'),
            },
          }),
        });
        if (savedResponse.ok) saved += 1;
      }
      setMessage(`${saved} detailed topic drafts added to the selected category.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto space-y-5 font-sans text-xs pb-12">
        {/* Page Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0d111c] p-4 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm">
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              Create learning content faster
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Generate a structured draft, review the output, then send it into your live topic library.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Admin-only workspace
          </span>
        </div>

        {/* Workspace Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Builder Section */}
          <section className="bg-white dark:bg-[#0d111c] p-5 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-4">
            <div className="border-b border-zinc-100 dark:border-white/5 pb-3">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                Give the studio direction
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {modeHint}
              </p>
            </div>

            <div className="space-y-3">
              {/* Generation Kind Select */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Generation type
                </label>
                <select
                  value={kind}
                  onChange={(event) => setKind(event.target.value)}
                  className="w-full bg-zinc-50 dark:bg-[#131823] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="topic-outline">All topics for category</option>
                  <option value="topic">Detailed topic</option>
                  <option value="quiz">Quiz questions</option>
                  <option value="test">Complete test</option>
                  <option value="dsa">DSA problem</option>
                </select>
              </div>

              {/* Dynamic Inputs based on Kind */}
              {kind !== 'test' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                    className="w-full bg-zinc-50 dark:bg-[#131823] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Choose category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {kind === 'quiz' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Quiz topic
                  </label>
                  <select
                    value={quizTopicId}
                    onChange={(event) => setQuizTopicId(event.target.value)}
                    className="w-full bg-zinc-50 dark:bg-[#131823] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Choose topic</option>
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {kind === 'test' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Test course
                  </label>
                  <select
                    value={testCourseId}
                    onChange={(event) => setTestCourseId(event.target.value)}
                    className="w-full bg-zinc-50 dark:bg-[#131823] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Choose course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Title / Subject
                </label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. HTML Forms"
                  className="w-full bg-zinc-50 dark:bg-[#131823] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Instruction Textarea */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Instruction
                </label>
                <textarea
                  rows={4}
                  value={instruction}
                  onChange={(event) => setInstruction(event.target.value)}
                  className="w-full bg-zinc-50 dark:bg-[#131823] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/10 rounded-lg p-3 focus:outline-none focus:border-indigo-500 transition-colors resize-y leading-relaxed"
                />
              </div>
            </div>

            {/* Builder Form Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setKind('dsa')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 font-medium transition-colors text-[11px]"
              >
                <BrainCircuit className="w-3.5 h-3.5 text-indigo-500" /> DSA Mode
              </button>

              <button
                type="button"
                onClick={generate}
                disabled={busy}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-1.5 rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                <span>{busy ? 'Generating…' : 'Generate with AI'}</span>
              </button>
            </div>
          </section>

          {/* Output Preview Panel */}
          <section className="bg-white dark:bg-[#0d111c] p-5 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-4 flex flex-col justify-between min-h-[460px]">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-3">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                    Structured Output
                  </h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Nothing is published automatically.
                  </p>
                </div>
                {result && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                    <Check className="w-3 h-3" /> Ready to review
                  </span>
                )}
              </div>

              {/* Structured JSON Output Display */}
              <div className="relative">
                <pre className="bg-zinc-950 text-zinc-200 p-4 rounded-lg text-[11px] font-mono leading-relaxed overflow-x-auto max-h-[320px] min-h-[220px] border border-zinc-800 scrollbar-thin">
                  {preview || (
                    <span className="text-zinc-600 flex items-center gap-2">
                      <Code2 className="w-4 h-4" />
                      Your generated content will appear here as a structured JSON draft.
                    </span>
                  )}
                </pre>
              </div>
            </div>

            {/* Response Banner Notice */}
            {message && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-xs bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20">
                <AlertCircle className="w-4 h-4 shrink-0 text-indigo-500" />
                <span>{message}</span>
              </div>
            )}
          </section>
        </div>

        {/* Step 3: Save & Publish Actions Panel */}
        {result && (
          <section className="bg-white dark:bg-[#0d111c] p-5 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase block">
                03 / Send it somewhere useful
              </span>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Save this work
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Review first, then add drafts to the selected category or topic.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={improve}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 font-medium transition-colors disabled:opacity-50 text-[11px]"
              >
                <Wand2 className="w-3.5 h-3.5 text-indigo-500" /> Improve
              </button>

              <button
                type="button"
                onClick={saveDraft}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 font-medium transition-colors text-[11px]"
              >
                <FilePlus2 className="w-3.5 h-3.5 text-zinc-500" /> Save Review Draft
              </button>

              {kind === 'topic' && (
                <button
                  type="button"
                  onClick={saveTopic}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3.5 py-1.5 rounded-lg shadow-sm transition-all text-[11px]"
                >
                  <span>Save Topic Draft</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {kind === 'topic-outline' && (
                <>
                  <button
                    type="button"
                    onClick={saveGenerated}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 font-medium transition-colors disabled:opacity-50 text-[11px]"
                  >
                    <Layers3 className="w-3.5 h-3.5" /> Save Outline
                  </button>
                  <button
                    type="button"
                    onClick={saveDetailedOutline}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3.5 py-1.5 rounded-lg shadow-sm transition-all disabled:opacity-50 text-[11px]"
                  >
                    <span>Generate & Save Detailed Topics</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {kind !== 'topic' && kind !== 'topic-outline' && (
                <button
                  type="button"
                  onClick={saveGenerated}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3.5 py-1.5 rounded-lg shadow-sm transition-all text-[11px]"
                >
                  <Layers3 className="w-3.5 h-3.5" /> Add to Database
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </AdminShell>
  );
}