import Link from 'next/link';
import {
  BookOpen,
  Code2,
  Layers,
  Award,
  ArrowRight,
  Target,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const metadata = {
  title: 'About | Depth Study',
  description: 'Learn what Depth Study is and how to use the platform.',
};

const features = [
  {
    icon: BookOpen,
    title: 'Structured Notes',
    text: 'Category-wise topics with concept breakdown, explanation, and practical code examples.',
  },
  {
    icon: Layers,
    title: 'Guided Courses',
    text: 'Step-by-step path from basics to completion with real-time progress tracking.',
  },
  {
    icon: Code2,
    title: 'DSA Practice',
    text: 'Solve problems topic-wise and keep track of your accepted solutions and time complexity.',
  },
  {
    icon: Award,
    title: 'Tests & Certificates',
    text: 'Attempt tests, assess your score, and earn verifiable certificates upon completion.',
  },
];

const usageSteps = [
  {
    step: '1',
    title: 'Explore Library',
    desc: 'Browse categories and courses instantly. No login required to start reading.',
  },
  {
    step: '2',
    title: 'Create Free Account',
    desc: 'Register to save your learning progress, bookmarks, personal notes, and test history.',
  },
  {
    step: '3',
    title: 'Learn & Practice',
    desc: 'Read modules, enroll in curated courses, attempt quizzes, and master DSA concepts.',
  },
];

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 transition-colors duration-300 dark:bg-[#07090e] dark:text-zinc-100 sm:px-6 lg:px-8">
      {/* Background Radial Glow Effect */}
      <div className="absolute left-1/2 top-12 -translate-x-1/2 h-72 w-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none dark:bg-indigo-600/15" />

      <div className="relative z-10 mx-auto max-w-5xl space-y-8">
        {/* Page Header */}
        <header className="space-y-3 border-b border-zinc-200 pb-8 dark:border-white/10">
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
            Learn today, build tomorrow.
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Depth Study is a focused learning workspace — curated notes, expert courses, DSA practice, and tests, all in one distraction-free platform.
          </p>
        </header>

        {/* Main Content Article */}
        <article className="rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm space-y-8 sm:p-8 dark:border-white/10 dark:bg-[#0d111c]">
          {/* Mission Section */}
          <section className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
              <Target size={22} />
            </span>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                Our Mission
              </h2>
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-sm">
                Learning resources are scattered everywhere. Depth Study brings them together in a structured, distraction-free environment — so you always know what to learn next without losing context.
              </p>
            </div>
          </section>

          {/* Features Grid */}
          <section className="border-t border-zinc-100 pt-8 dark:border-white/5">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Core Features
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 space-y-2.5 transition-colors hover:border-zinc-300 dark:border-white/5 dark:bg-zinc-900/30 dark:hover:border-white/10"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-200/60 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
                    <f.icon size={18} />
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white sm:text-sm">
                      {f.title}
                    </h3>
                    <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-xs">
                      {f.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* How To Use Steps */}
          <section className="border-t border-zinc-100 pt-8 space-y-4 dark:border-white/5">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
              How to use Depth Study
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {usageSteps.map((s) => (
                <div
                  key={s.step}
                  className="relative rounded-xl border border-zinc-200/70 bg-zinc-50/30 p-4 space-y-2 dark:border-white/5 dark:bg-zinc-900/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-[11px] font-bold text-white shadow-sm">
                      {s.step}
                    </span>
                    <CheckCircle2 size={14} className="text-zinc-300 dark:text-zinc-700" />
                  </div>
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 sm:text-sm">
                    {s.title}
                  </h3>
                  <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Action Links */}
          <footer className="flex flex-wrap items-center gap-2.5 border-t border-zinc-100 pt-6 dark:border-white/5">
            <Link
              href="/study"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            >
              Explore Study <ArrowRight size={14} />
            </Link>
            <Link
              href="/study/courses"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            >
              Courses
            </Link>
            <Link
              href="/terms"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-600 shadow-sm transition-all hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-600 shadow-sm transition-all hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            >
              Privacy
            </Link>
          </footer>
        </article>
      </div>
    </main>
  );
}