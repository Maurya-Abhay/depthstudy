'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  UserPlus,
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Code2,
  Award,
  Sparkles,
  X,
  Check,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [msg, setMsg] = useState<{
    text: string;
    type: 'error' | 'warning' | 'success';
  } | null>(null);
  const [busy, setBusy] = useState(false);

  // Password strength score
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };

  const strength = getPasswordStrength();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    if (!agreeTerms) {
      setMsg({
        text: 'Please accept the Terms of Service and Privacy Policy.',
        type: 'warning',
      });
      return;
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ) {
      setMsg({
        text: 'Supabase environment variables missing. Configure them to enable registration.',
        type: 'warning',
      });
      return;
    }

    setMsg(null);
    setBusy(true);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      setMsg({
        text:
          error.status === 429
            ? 'Signup limit reached. Please wait a moment and try again.'
            : error.message,
        type: 'error',
      });
      setBusy(false);
      return;
    }

    if (data.session) {
      window.location.href = '/dashboard';
      return;
    }

    setMsg({
      text: 'Account created successfully! Disable email confirmation in Supabase to log in instantly.',
      type: 'success',
    });
    setBusy(false);
  }

  return (
    <main className="relative flex min-h-screen w-full bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#07090e] dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Floating Animated Toast Popup */}
      {msg && (
        <div className="fixed top-5 right-5 z-50 flex max-w-md items-start gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95 transition-all">
          <div className="mt-0.5">
            {msg.type === 'success' ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <CheckCircle2 size={18} />
              </span>
            ) : msg.type === 'warning' ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                <AlertCircle size={18} />
              </span>
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                <AlertCircle size={18} />
              </span>
            )}
          </div>

          <div className="space-y-0.5 text-xs">
            <h4 className="font-bold capitalize text-slate-900 dark:text-white">{msg.type}</h4>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">{msg.text}</p>
          </div>

          <button
            type="button"
            onClick={() => setMsg(null)}
            className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main 50/50 Split Layout */}
      <div className="grid w-full grid-cols-1 lg:grid-cols-12 min-h-screen">
        
        {/* Left Side Showcase Panel (7 Columns) */}
        <div className="relative hidden lg:col-span-7 lg:flex flex-col justify-between overflow-hidden border-r border-slate-200 bg-white p-12 xl:p-16 dark:border-white/10 dark:bg-[#0a0d15]">
          {/* Ambient Background Gradient Glows */}
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none dark:bg-indigo-600/15" />
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-purple-500/10 blur-[120px] pointer-events-none dark:bg-purple-600/15" />

          {/* Top Brand Header */}
          <div className="relative z-10 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 transition-transform group-hover:scale-105">
                <UserPlus size={20} />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Depth<span className="text-indigo-600 dark:text-indigo-400">Study</span>
              </span>
            </Link>
          </div>

          {/* Hero Content Section */}
          <div className="relative z-10 my-auto space-y-8 max-w-xl">
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white xl:text-5xl leading-tight">
                Master Computer Science with <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">Precision & Depth</span>.
              </h1>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Join thousands of engineers and learners building real expertise through structured study guides, curated DSA topics, and tracked progress.
              </p>
            </div>

            {/* Clean Feature List Cards */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-all hover:bg-slate-100/80 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Structured Study Sheets</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">In-depth topic breakdowns without unnecessary bloat.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-all hover:bg-slate-100/80 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Code2 size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Curated DSA Tracks</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Practice pattern-based questions organized by difficulty.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-all hover:bg-slate-100/80 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Award size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Verified Progress</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Track your learning streaks and earn certificates.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="relative z-10 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
            <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span>Secure Authentication Powered by Supabase</span>
          </div>
        </div>

        {/* Right Side Form Panel (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-slate-50 dark:bg-[#07090e]">
          
          {/* Mobile Top Header Bar */}
          <div className="flex lg:hidden items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                <UserPlus size={18} />
              </div>
              <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                Depth<span className="text-indigo-600 dark:text-indigo-400">Study</span>
              </span>
            </Link>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Free Account</span>
          </div>

          <div className="my-auto mx-auto w-full max-w-sm space-y-6">
            
            {/* Header Title */}
            <div className="space-y-1.5">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Create an account
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Enter your details to get started with Depth Study.
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={submit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  required
                  placeholder="e.g. name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    minLength={8}
                    required
                    placeholder="Min 8 characters"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-1 pt-1">
                    <div className="flex h-1 w-full gap-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className={`h-full transition-all duration-300 ${strength >= 1 ? 'w-1/4 bg-rose-500' : 'w-0'}`} />
                      <div className={`h-full transition-all duration-300 ${strength >= 2 ? 'w-1/4 bg-amber-500' : 'w-0'}`} />
                      <div className={`h-full transition-all duration-300 ${strength >= 3 ? 'w-1/4 bg-blue-500' : 'w-0'}`} />
                      <div className={`h-full transition-all duration-300 ${strength >= 4 ? 'w-1/4 bg-emerald-500' : 'w-0'}`} />
                    </div>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-500 text-right">
                      {strength === 1 && 'Weak'}
                      {strength === 2 && 'Fair'}
                      {strength === 3 && 'Good'}
                      {strength === 4 && 'Strong'}
                    </p>
                  </div>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setAgreeTerms(!agreeTerms)}
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                    agreeTerms
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
                  }`}
                >
                  {agreeTerms && <Check size={12} />}
                </button>
                <label 
                  className="text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer select-none" 
                  onClick={() => setAgreeTerms(!agreeTerms)}
                >
                  I agree to Depth Study&apos;s{' '}
                  <span className="font-semibold text-slate-900 dark:text-slate-200 underline">Terms of Service</span> and{' '}
                  <span className="font-semibold text-slate-900 dark:text-slate-200 underline">Privacy Policy</span>.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={busy}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busy ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Sign in Link */}
            <div className="border-t border-slate-200 dark:border-slate-900 pt-6 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Footer Copyright */}
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 lg:hidden pt-6">
            © {new Date().getFullYear()} Depth Study Inc.
          </p>
        </div>
      </div>
    </main>
  );
}