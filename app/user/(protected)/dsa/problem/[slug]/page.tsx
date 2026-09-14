import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, BrainCircuit } from 'lucide-react';
import { getDsaProblem } from '@/services/dsa';
import { ProblemWorkspace } from '@/app/user/(protected)/_components/problem-workspace';

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { problem } = await getDsaProblem(slug);

  if (!problem) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0b0f17] text-slate-800 dark:text-slate-200">
      <div className="mx-auto max-w-[1600px] space-y-4">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400"
        >
          <Link
            href="/dsa"
            className="flex items-center gap-1.5 transition hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <BrainCircuit size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span>DSA</span>
          </Link>

          <ChevronRight size={13} className="text-slate-400 dark:text-slate-600" />

          <Link
            href="/dsa"
            className="transition hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            Problems
          </Link>

          <ChevronRight size={13} className="text-slate-400 dark:text-slate-600" />

          <span className="truncate font-semibold text-slate-900 dark:text-white">
            {problem.title}
          </span>
        </nav>

        {/* Interactive Workspace Component Wrapper */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#121824] p-2 shadow-xl dark:shadow-2xl">
          <ProblemWorkspace problem={problem} />
        </div>
      </div>
    </main>
  );
}