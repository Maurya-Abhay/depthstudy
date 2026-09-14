'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Target,
  Clock,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Check,
  Loader2,
  Zap,
} from 'lucide-react';
import {
  ONBOARDING_INTERESTS,
  ONBOARDING_LEVELS,
  ONBOARDING_GOALS,
  ONBOARDING_DAILY_MINUTES,
  ONBOARDING_LEARNING_STYLES,
  type OnboardingInterest,
  type OnboardingLevel,
  type OnboardingGoal,
  type OnboardingDailyMinutes,
  type OnboardingLearningStyle,
} from '@/types/onboarding';

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'interests', title: 'Interests', icon: Target },
  { id: 'level', title: 'Level', icon: BrainCircuit },
  { id: 'goals', title: 'Goals', icon: BookOpen },
  { id: 'schedule', title: 'Schedule', icon: Clock },
  { id: 'style', title: 'Style', icon: Zap },
] as const;

interface FormData {
  interests: OnboardingInterest[];
  currentLevel: OnboardingLevel;
  goals: OnboardingGoal[];
  dailyMinutes: OnboardingDailyMinutes;
  learningStyle: OnboardingLearningStyle;
}

const emptyForm: FormData = {
  interests: [],
  currentLevel: 'beginner',
  goals: [],
  dailyMinutes: 30,
  learningStyle: 'balanced',
};

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = STEPS.length;
  const currentStep = STEPS[step];
  const isLastStep = step === totalSteps - 1;
  const progressPercent = ((step + 1) / totalSteps) * 100;

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleArrayItem = <T,>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const canProceed = (): boolean => {
    switch (currentStep.id) {
      case 'welcome':
        return true;
      case 'interests':
        return form.interests.length > 0;
      case 'level':
        return !!form.currentLevel;
      case 'goals':
        return form.goals.length > 0;
      case 'schedule':
        return true;
      case 'style':
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (!canProceed()) return;
    if (isLastStep) {
      await handleSave();
    } else {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.errors?.join(', ') || data.error || 'Failed to save setup.');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Step Counter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          <span>Step {step + 1} of {totalSteps}</span>
          <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            {currentStep.title}
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step Contents */}
      <div className="py-2 min-h-[280px] flex flex-col justify-center">
        {currentStep.id === 'welcome' && (
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-inner">
              <Sparkles className="h-8 w-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                Welcome to Depth Study
              </h1>
              <p className="max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
                Let&apos;s personalize your learning experience. This setup takes less than 2 minutes.
              </p>
            </div>
          </div>
        )}

        {currentStep.id === 'interests' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">What do you want to learn?</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Select one or more categories that interest you.</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
              {ONBOARDING_INTERESTS.map((interest) => {
                const selected = form.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => update('interests', toggleArrayItem(form.interests, interest))}
                    className={`group flex items-center justify-between rounded-xl border p-3 text-left text-xs font-semibold transition-all duration-200 ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 dark:border-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300'
                        : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className="truncate pr-1">{interest}</span>
                    <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                      selected ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {selected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentStep.id === 'level' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">What&apos;s your current level?</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Choose the option that best describes your baseline.</p>
            </div>
            <div className="space-y-2.5">
              {ONBOARDING_LEVELS.map((level) => {
                const selected = form.currentLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => update('currentLevel', level)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 dark:border-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300'
                        : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className="capitalize">{level}</span>
                    <div className={`flex h-4 w-4 items-center justify-center rounded-full border transition-all ${
                      selected ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {selected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentStep.id === 'goals' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">What are your primary goals?</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Select all objectives you wish to achieve.</p>
            </div>
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {ONBOARDING_GOALS.map((goal) => {
                const selected = form.goals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => update('goals', toggleArrayItem(form.goals, goal))}
                    className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 dark:border-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300'
                        : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span>{goal.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                    <div className={`flex h-4 w-4 items-center justify-center rounded-full border transition-all ${
                      selected ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {selected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentStep.id === 'schedule' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">Daily time commitment?</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Set a realistic learning goal that fits your routine.</p>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {ONBOARDING_DAILY_MINUTES.map((mins) => {
                const selected = form.dailyMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => update('dailyMinutes', mins)}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all duration-200 ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 dark:border-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300'
                        : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xl font-black">{mins}</span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">mins / day</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentStep.id === 'style' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">Preferred learning style?</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Choose how material is presented to you.</p>
            </div>
            <div className="space-y-2.5">
              {ONBOARDING_LEARNING_STYLES.map((style) => {
                const selected = form.learningStyle === style;
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => update('learningStyle', style)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 dark:border-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300'
                        : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span>{style.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                    <div className={`flex h-4 w-4 items-center justify-center rounded-full border transition-all ${
                      selected ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {selected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-center text-xs font-semibold text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Footer Controls */}
      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80 pt-4">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0 || saving}
          className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-0 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed() || saving}
          className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving...
            </>
          ) : isLastStep ? (
            <>
              <span>Complete Setup</span>
              <CheckCircle2 className="h-4 w-4" />
            </>
          ) : (
            <>
              <span>Continue</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}