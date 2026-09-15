'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Send,
  Clock,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { UserShell } from '@/app/user/(protected)/_components/user-shell';
import { useConfirm } from '@/components/ui/confirm-dialog';

type Question = {
  id: string;
  prompt: string;
  type: string;
  options: string[];
};

const TYPE_LABELS: Record<string, string> = {
  mcq: 'MCQ',
  true_false: 'True / False',
  code_output: 'Code Output',
  code_fix: 'Code Fix',
  scenario: 'Scenario Based',
  debugging: 'Debugging',
  best_practice: 'Best Practice',
  accessibility: 'Accessibility',
  seo: 'SEO',
  single: 'Single Choice',
  text: 'Text Answer',
};

function typeLabel(type: string) {
  return TYPE_LABELS[type] ?? 'MCQ';
}

type Test = {
  id: string;
  title: string;
  duration_minutes: number;
  passing_score: number;
};

export default function SecureTestPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const confirm = useConfirm();

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [attemptId, setAttemptId] = useState('');
  const [step, setStep] = useState(0);
  const [time, setTime] = useState(0);
  const [message, setMessage] = useState('Initializing secure environment...');
  const [busy, setBusy] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [focusMode, setFocusMode] = useState(false);
  const [warningCount, setWarningCount] = useState(0);

  const startedRef = useRef(false);

  const submit = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          testId: params.id,
          attemptId,
          answers,
          suspiciousEvents: events,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Unable to submit assessment.');
      } else {
        router.replace(
          `/tests/${params.id}/result?attemptId=${encodeURIComponent(data.attemptId)}`
        );
      }
    } catch {
      setMessage('Network error while submitting assessment.');
    } finally {
      setBusy(false);
    }
  }, [busy, params.id, attemptId, answers, events, router]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/tests?id=${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          setMessage(data.error || 'Unable to load assessment.');
          return;
        }

        setTest(data.test);
        setQuestions(data.questions ?? []);
        setTime(data.test.duration_minutes * 60);

        const start = await fetch('/api/tests', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'start', testId: params.id }),
        });
        const started = await start.json();

        if (cancelled) return;

        if (!start.ok) {
          setMessage(started.error || 'Unable to start assessment.');
          return;
        }

        setAttemptId(started.attempt.id);

        const startedAt = new Date(started.attempt.started_at).getTime();
        const remaining = Math.max(
          0,
          Math.ceil((data.test.duration_minutes * 60_000 - (Date.now() - startedAt)) / 1000)
        );

        setTime(remaining);
        setMessage('');
        startedRef.current = true;
      } catch {
        if (!cancelled) setMessage('Network error loading test.');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    if (!attemptId) return;

    const timer = setInterval(() => {
      setTime((value) => {
        if (value <= 1) {
          clearInterval(timer);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    const save = setInterval(() => {
      void fetch('/api/tests', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Silent-Toast': '1',
        },
        body: JSON.stringify({
          action: 'save',
          testId: params.id,
          attemptId,
          answers,
          suspiciousEvents: events,
        }),
      });
    }, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(save);
    };
  }, [attemptId, params.id, answers, events]);

  useEffect(() => {
    if (time === 0 && attemptId && !busy && startedRef.current) {
      void submit();
    }
  }, [time, attemptId, busy, submit]);

  useEffect(() => {
    const onFullscreenChange = () => setFocusMode(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (focusMode) {
      if (document.fullscreenElement) await document.exitFullscreen();
      else setFocusMode(false);
      return;
    }
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      setFocusMode(true);
    }
  };

  useEffect(() => {
    if (!attemptId) return;

    const recordViolation = (type: string) => {
      setWarningCount((prev) => prev + 1);
      setEvents((prev) => [...prev, `${type}_at_${new Date().toISOString()}`].slice(-50));
    };

    const onVisibilityChange = () => {
      if (document.hidden) recordViolation('tab_hidden');
    };

    const onWindowBlur = () => {
      recordViolation('window_blur');
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isCmdOrCtrl = event.ctrlKey || event.metaKey;

      if (isCmdOrCtrl && ['c', 'v', 'x', 'a', 'p', 's', 'u'].includes(key)) {
        event.preventDefault();
        recordViolation(`keyboard_shortcut_${key}`);
      }

      if (
        event.key === 'F12' ||
        (isCmdOrCtrl && event.shiftKey && ['i', 'j', 'c'].includes(key))
      ) {
        event.preventDefault();
        recordViolation('devtools_attempt');
      }

      if (event.key === 'PrintScreen') {
        event.preventDefault();
        recordViolation('printscreen_attempt');
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      recordViolation('right_click');
    };

    const onSelectStart = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') e.preventDefault();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('selectstart', onSelectStart);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('selectstart', onSelectStart);
    };
  }, [attemptId]);

  useEffect(() => {
    const onExitClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href="/dashboard/tests"]');
      if (!link) return;
      event.preventDefault();
      void confirm({
        title: 'Exit Proctored Test?',
        message:
          'Your assessment timer will continue to run. Are you sure you want to navigate away?',
        confirmLabel: 'Leave Test',
        cancelLabel: 'Stay & Complete',
      }).then((ok) => {
        if (ok) router.replace('/dashboard/tests');
      });
    };
    document.addEventListener('click', onExitClick);
    return () => document.removeEventListener('click', onExitClick);
  }, [confirm, router]);

  if (!test) {
    return (
      <UserShell>
        <div className="mx-auto my-20 max-w-md rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#121824] p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <ShieldAlert size={24} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
            Proctored Session
          </span>
          <h1 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            Test Access Error
          </h1>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{message}</p>
          <div className="mt-6 flex justify-center">
            {message.toLowerCase().includes('complete') ? (
              <Link
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500"
                href="/dashboard/courses"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 transition hover:bg-slate-200 dark:hover:bg-slate-700"
                href="/dashboard/tests"
              >
                Back to Tests
              </Link>
            )}
          </div>
        </div>
      </UserShell>
    );
  }

  const question = questions[step];
  const minutes = String(Math.floor(time / 60)).padStart(2, '0');
  const seconds = String(time % 60).padStart(2, '0');
  const isTimeCritical = time < 300;

  return (
    <main
      className="min-h-screen w-screen overflow-x-hidden bg-slate-100 dark:bg-[#07090e] text-slate-900 dark:text-slate-200 select-none p-3 sm:p-4 font-sans flex flex-col items-center justify-center"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="w-full max-w-4xl space-y-3">
        
        {/* Streamlined Single-Line Header */}
        <header className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#121824] px-3.5 py-2.5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            
            {/* Left Section: Exit + Title + Status */}
            <div className="flex items-center gap-2.5 min-w-0">
              <Link
                href="/dashboard/tests"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <ArrowLeft size={13} /> Exit
              </Link>

              <div className="min-w-0 flex items-center gap-2">
                <h1 className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  {test.title}
                </h1>
                
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                  <span>•</span>
                  <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
                    <Lock size={10} /> Secure Mode
                  </span>
                  {warningCount > 0 && (
                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold animate-pulse">
                      • <AlertTriangle size={10} /> {warningCount} warning{warningCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Section: Focus Toggle + Timer */}
            <div className="flex shrink-0 items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {focusMode ? <Minimize size={13} /> : <Maximize size={13} />}
                <span className="hidden sm:inline text-xs">{focusMode ? 'Exit' : 'Focus'}</span>
              </button>

              <div
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 ${
                  isTimeCritical
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200'
                }`}
              >
                <Clock size={13} className={isTimeCritical ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'} />
                <strong className="text-xs font-mono font-bold tracking-wider">{minutes}:{seconds}</strong>
              </div>
            </div>

          </div>
        </header>

        {/* Question Matrix & Progress Bar */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#121824] px-3.5 py-2 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1 max-h-[42px] overflow-y-auto">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === step;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setStep(idx)}
                    className={`h-5 w-5 rounded-md text-[10px] font-bold transition-all ${
                      isCurrent
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/50 shadow-xs'
                        : isAnswered
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <span className="shrink-0 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              {Object.keys(answers).length}/{questions.length} answered
            </span>
          </div>

          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
              style={{
                width: `${questions.length ? ((step + 1) / questions.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Compact Question Body & Options Container */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#121824] p-4 shadow-sm">
          {question ? (
            <div className="space-y-3">
              
              {/* Question Subheader */}
              <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <span className="rounded-md border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 font-bold text-indigo-600 dark:text-indigo-400 text-[10px]">
                  Question {step + 1} of {questions.length}
                </span>
                <span className="rounded-md border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 font-bold text-amber-600 dark:text-amber-400 text-[10px]">
                  {typeLabel(question.type)}
                </span>
              </div>

              {/* Question Text */}
              <h2 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-normal">
                {question.prompt}
              </h2>

              {/* Options Section */}
              {question.type === 'true_false' ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {['True', 'False'].map((option) => {
                    const isSelected = answers[question.id] === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setAnswers((current) => ({ ...current, [question.id]: option }))
                        }
                        className={`flex items-center justify-center gap-1.5 rounded-lg border p-2.5 text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-600 text-white shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <CheckCircle2 className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        {option}
                      </button>
                    );
                  })}
                </div>
              ) : question.type === 'text' ? (
                <input
                  type="text"
                  value={typeof answers[question.id] === 'string' ? (answers[question.id] as string) : ''}
                  onChange={(e) =>
                    setAnswers((current) => ({ ...current, [question.id]: e.target.value }))
                  }
                  placeholder="Type your answer here..."
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              ) : (
                <div className="space-y-1.5 pt-0.5">
                  {question.options?.map((option, index) => {
                    const isSelected = answers[question.id] === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setAnswers((current) => ({
                            ...current,
                            [question.id]: option,
                          }))
                        }
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/80 dark:bg-indigo-500/10 text-indigo-950 dark:text-white shadow-xs ring-1 ring-indigo-500/30'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-300 hover:border-slate-300 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                            }`}
                          >
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="text-xs font-medium leading-normal whitespace-pre-wrap">
                            {option}
                          </span>
                        </div>

                        <div
                          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-600 text-white'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Navigation Footer Buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5 mt-2">
                <button
                  type="button"
                  disabled={step === 0}
                  onClick={() => setStep((value) => value - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} /> Previous
                </button>

                {step < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((value) => value + 1)}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-500"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-500 disabled:opacity-50"
                  >
                    <Send size={12} />
                    <span>{busy ? 'Submitting...' : 'Finish & Submit'}</span>
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 dark:text-slate-400">
              <HelpCircle size={28} className="mb-2 text-slate-400 dark:text-slate-500" />
              <p className="text-xs font-medium">No questions available in this test.</p>
            </div>
          )}

          {message && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-2 text-xs font-medium text-amber-700 dark:text-amber-300">
              <AlertTriangle size={13} className="shrink-0" />
              <span>{message}</span>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}