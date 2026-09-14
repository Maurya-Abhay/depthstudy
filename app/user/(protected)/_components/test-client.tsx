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
  Sparkles,
  ShieldAlert,
  Lock,
  CheckCircle2,
  Grid,
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

  // Submit Handler
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

  // Initial Fetch & Start Assessment
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

  // Timer & Auto Save Intervals
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

  // Auto-submit on timer expiry
  useEffect(() => {
    if (time === 0 && attemptId && !busy && startedRef.current) {
      void submit();
    }
  }, [time, attemptId, busy, submit]);

  // Fullscreen & Proctored Mode Handler
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

  // Heavy Anti-Cheat Enforcement Listeners
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

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('contextmenu', onContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('contextmenu', onContextMenu);
    };
  }, [attemptId]);

  // Navigation Guard Handler
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

  // Loading or Error Screen
  if (!test) {
    return (
      <UserShell>
        <div className="mx-auto my-16 max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0e131f] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-500 dark:text-rose-400">
            <ShieldAlert size={28} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 dark:text-rose-400">
            Proctored Session
          </span>
          <h1 className="mt-1 text-xl font-black text-zinc-900 dark:text-white">
            Test Access Error
          </h1>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{message}</p>
          <div className="mt-6 flex justify-center">
            {message.toLowerCase().includes('complete') ? (
              <Link
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500"
                href="/dashboard/courses"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-5 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition hover:bg-zinc-200 dark:hover:bg-zinc-700"
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
      className="h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-[#07090e] text-zinc-900 dark:text-zinc-200 select-none p-4 font-sans flex flex-col justify-center items-center"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="w-full max-w-5xl h-full flex flex-col justify-between space-y-3">
        {/* Top Control Bar */}
        <div className="flex shrink-0 items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800/80 pb-2.5">
          <Link
            href="/dashboard/tests"
            className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium"
          >
            <ArrowLeft size={14} /> Exit Test Environment
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-full px-2.5 py-0.5">
              <Lock size={10} /> Secure Anti-Cheat Active
            </span>
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-full px-2.5 py-0.5 animate-pulse">
                <AlertTriangle size={10} /> Warnings: {warningCount}
              </span>
            )}
          </div>
        </div>

        {/* Assessment Title Header */}
        <div className="flex shrink-0 flex-col gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111c] p-4 shadow-md sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Sparkles size={12} />
              <span>Assessment Portal</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white tracking-tight">
              {test.title}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total: {questions.length} questions <span className="mx-1">•</span> Passing Target:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">{test.passing_score}%</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/80 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white"
            >
              {focusMode ? <Minimize size={14} /> : <Maximize size={14} />}
              <span>{focusMode ? 'Exit Fullscreen' : 'Focus Screen'}</span>
            </button>

            {/* Timer Badge */}
            <div
              className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-1.5 ${
                isTimeCritical
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              <Clock size={15} className={isTimeCritical ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'} />
              <div className="text-right">
                <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Timer
                </div>
                <strong className="text-xs sm:text-sm font-black font-mono tracking-wider">
                  {minutes}:{seconds}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Question Palette Navigation Matrix */}
        <div className="shrink-0 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#0d111c] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <Grid size={12} /> Question Matrix
            </span>
            <span className="text-[10px] text-zinc-500">
              Answered: {Object.keys(answers).length} / {questions.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = idx === step;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setStep(idx)}
                  className={`h-7 w-7 rounded-lg text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-md'
                      : isAnswered
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                      : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="shrink-0 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800/60">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
            style={{
              width: `${questions.length ? ((step + 1) / questions.length) * 100 : 0}%`,
            }}
          />
        </div>

        {/* Active Question Main Card */}
        <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d111c] p-5 shadow-xl">
          {question ? (
            <div className="flex flex-col h-full justify-between overflow-hidden">
              {/* Question Header Status */}
              <div className="shrink-0 flex items-center justify-between text-xs border-b border-zinc-200 dark:border-zinc-800/80 pb-3 mb-3">
                <span className="rounded-md border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-0.5 font-bold text-indigo-600 dark:text-indigo-400">
                  Question {step + 1} of {questions.length}
                </span>
                <span className="font-semibold text-zinc-500 dark:text-zinc-400">
                  {Math.round(((step + 1) / questions.length) * 100)}% Completed
                </span>
              </div>

              {/* Scrollable Question Content (In case options are long) */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white leading-relaxed tracking-wide">
                  {question.prompt}
                </h2>

                <div className="space-y-2.5">
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
                        className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-950 dark:text-white shadow-md ring-1 ring-indigo-500/50'
                            : 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-800 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400'
                            }`}
                          >
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="text-xs sm:text-sm font-medium leading-normal">
                            {option}
                          </span>
                        </div>

                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-600 text-white'
                              : 'border-zinc-300 dark:border-zinc-700'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Control Actions */}
              <div className="shrink-0 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800/80 pt-3 mt-3">
                <button
                  type="button"
                  disabled={step === 0}
                  onClick={() => setStep((value) => value - 1)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                {step < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((value) => value + 1)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
                  >
                    Next Question <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:opacity-50"
                  >
                    <Send size={14} />
                    <span>{busy ? 'Submitting Test...' : 'Finish & Submit'}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500 dark:text-zinc-400">
              <HelpCircle size={32} className="mb-2 text-zinc-400 dark:text-zinc-500" />
              <p className="text-xs font-semibold">No questions available in this test.</p>
            </div>
          )}

          {/* Alert Message Box */}
          {message && (
            <div className="mt-2 shrink-0 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{message}</span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}