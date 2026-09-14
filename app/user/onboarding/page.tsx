import { redirect } from 'next/navigation';
import { requireLearner } from '@/services/auth';
import { getOnboardingStatus } from '@/services/onboarding';
import { OnboardingWizard } from './_components/onboarding-wizard';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Compass, Target, Rocket } from 'lucide-react';

export default async function OnboardingPage() {
  const user = await requireLearner();

  // If onboarding already completed, redirect to user dashboard
  const status = await getOnboardingStatus(user.id);
  if (status.isCompleted) {
    redirect('/dashboard');
  }

  return (
    <main className="relative flex min-h-screen w-full bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#07090e] dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* 50/50 Split Screen Layout */}
      <div className="grid w-full grid-cols-1 lg:grid-cols-12 min-h-screen">
        
        {/* Left Side Branding & Value Props Panel (7 Columns) */}
        <div className="relative hidden lg:col-span-7 lg:flex flex-col justify-between overflow-hidden border-r border-slate-200 bg-white p-12 xl:p-16 dark:border-white/10 dark:bg-[#0a0d15]">
          {/* Ambient Glowing Background Accents */}
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none dark:bg-indigo-600/15" />
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-purple-500/10 blur-[120px] pointer-events-none dark:bg-purple-600/15" />

          {/* Top Brand Header */}
          <div className="relative z-10 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 transition-transform group-hover:scale-105">
                <Sparkles size={20} />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Depth<span className="text-indigo-600 dark:text-indigo-400">Study</span>
              </span>
            </Link>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
              <Compass size={13} /> Personal Setup
            </span>
          </div>

          {/* Center Showcase Section */}
          <div className="relative z-10 my-auto space-y-8 max-w-xl">
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white xl:text-5xl leading-tight">
                Craft your tailored <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">Learning Path</span>.
              </h1>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Help us understand your goals and current expertise so we can build a structured curriculum optimized just for you.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-all hover:bg-slate-100/80 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Target size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Customized Roadmaps</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Topics aligned directly with your preferred career domain.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-all hover:bg-slate-100/80 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Rocket size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Paced Learning</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Daily goal tracking matched to your personal schedule.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Security Badge */}
          <div className="relative z-10 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
            <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span>Fast setup — Less than 2 minutes</span>
          </div>
        </div>

        {/* Right Side Onboarding Form Panel (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-slate-50 dark:bg-[#07090e]">
          
          {/* Mobile Top Header */}
          <div className="flex lg:hidden items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                <Sparkles size={18} />
              </div>
              <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                Depth<span className="text-indigo-600 dark:text-indigo-400">Study</span>
              </span>
            </Link>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Onboarding</span>
          </div>

          {/* Wizard Card Container */}
          <div className="my-auto mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl dark:border-slate-800/80 dark:bg-[#0f141c] sm:p-8">
              <OnboardingWizard />
            </div>
          </div>

          {/* Footer Copyright */}
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 pt-6">
            © {new Date().getFullYear()} Depth Study Inc.
          </p>
        </div>
      </div>
    </main>
  );
}