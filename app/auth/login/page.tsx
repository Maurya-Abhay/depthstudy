'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  LogIn,
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Code2,
  Award,
  Sparkles,
  X,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export default function Login() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState<{
    text: string;
    type: 'error' | 'warning' | 'success';
  } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setMsg(null);

    if (!supabaseUrl || !supabaseKey) {
      setMsg({
        text: 'Supabase is not configured. Add your environment variables to enable login.',
        type: 'warning',
      });
      return;
    }

    setBusy(true);
    const supabase = createBrowserClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const errorText =
        'Unable to sign in with those details. Check your email and password.';
      setMsg({ text: errorText, type: 'error' });
      showToast('error', errorText);
      setBusy(false);
      return;
    }

    const requestedNext =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('next')
        : null;
    if (
      requestedNext &&
      requestedNext.startsWith('/') &&
      !requestedNext.startsWith('//')
    ) {
      window.location.href = requestedNext;
      return;
    }

    try {
      const r = await fetch('/api/auth/workspace');
      if (r.ok) {
        const w = await r.json();
        if (w.destination) {
          window.location.href = w.destination;
          return;
        }
      }
    } catch {
      // Fallback to role-based check
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile?.role === 'admin') {
      window.location.href = '/admin';
      return;
    }

    if (profile?.role === 'user') {
      window.location.href = '/user';
      return;
    }

    await supabase.auth.signOut();
    const roleError =
      'Your account role is not configured. Contact an administrator.';
    showToast('error', roleError);
    setMsg({ text: roleError, type: 'error' });
    setBusy(false);
  }

  return (
    <main className="relative flex min-h-screen w-full bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#07090e] dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Toast Popup Notification */}
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
            <h4 className="font-bold capitalize text-slate-900 dark:text-white">
              {msg.type}
            </h4>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              {msg.text}
            </p>
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

      {/* Main 50/50 Split Grid */}
      <div className="grid w-full grid-cols-1 lg:grid-cols-12 min-h-screen">
        
        {/* Left Side Showcase Panel (7 Columns) */}
        <div className="relative hidden lg:col-span-7 lg:flex flex-col justify-between overflow-hidden border-r border-slate-200 bg-white p-12 xl:p-16 dark:border-white/10 dark:bg-[#0a0d15]">
          {/* Ambient Background Glows */}
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none dark:bg-indigo-600/15" />
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-purple-500/10 blur-[120px] pointer-events-none dark:bg-purple-600/15" />

          {/* Top Brand Header */}
          <div className="relative z-10 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 transition-transform group-hover:scale-105">
                <LogIn size={20} />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Depth<span className="text-indigo-600 dark:text-indigo-400">Study</span>
              </span>
            </Link>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 my-auto space-y-8 max-w-xl">
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white xl:text-5xl leading-tight">
                Resume your learning with <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">Total Sync</span>.
              </h1>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Log in to access your saved notes, continue your DSA problem streaks, and pick up right where you left off.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-all hover:bg-slate-100/80 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Saved Progress</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Instant access to bookmarked topics and custom study lists.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-all hover:bg-slate-100/80 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Code2 size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Tracked Submissions</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Review your past code implementations and solutions.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-all hover:bg-slate-100/80 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Award size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Personal Dashboard</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Monitor completion rates and unlock skill badges.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="relative z-10 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
            <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span>Encrypted Session Management via Supabase</span>
          </div>
        </div>

        {/* Right Side Form Panel (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-slate-50 dark:bg-[#07090e]">
          
          {/* Mobile Top Header Bar */}
          <div className="flex lg:hidden items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                <LogIn size={18} />
              </div>
              <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                Depth<span className="text-indigo-600 dark:text-indigo-400">Study</span>
              </span>
            </Link>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Sign In</span>
          </div>

          <div className="my-auto mx-auto w-full max-w-sm space-y-6">
            
            {/* Form Title */}
            <div className="space-y-1.5">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Welcome Back
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Enter your credentials to access your account dashboard.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={submit} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
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
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Sign Up Link */}
            <div className="border-t border-slate-200 dark:border-slate-900 pt-6 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                New here?{' '}
                <Link
                  href="/register"
                  className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>

          {/* Footer Copyright for Mobile */}
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 lg:hidden pt-6">
            © {new Date().getFullYear()} Depth Study Inc.
          </p>
        </div>
      </div>
    </main>
  );
}