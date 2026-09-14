'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  LockKeyhole,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from '@/components/ui/toast-provider';

export default function ResetPasswordPage() {
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [ready, setReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      setCheckingSession(false);
      return;
    }

    const supabase = createBrowserClient(url, key);
    
    // Check initial session
    supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session));
      setCheckingSession(false);
    });

    // Listen for auth state changes (e.g. when recovery token is processed)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      showToast('error', 'Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      showToast('error', 'Passwords do not match.');
      return;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      showToast('error', 'Authentication is not configured.');
      return;
    }

    setBusy(true);
    const supabase = createBrowserClient(url, key);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      showToast('error', error.message);
      setBusy(false);
      return;
    }

    showToast('success', 'Password updated successfully. Redirecting...');
    setTimeout(() => window.location.assign('/login'), 1000);
  }

  return (
    <main className="relative flex min-h-screen w-full bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#07090e] dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* 50/50 Split Grid */}
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
                <LockKeyhole size={20} />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Depth<span className="text-indigo-600 dark:text-indigo-400">Study</span>
              </span>
            </Link>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
              <Sparkles size={13} /> Security Portal
            </span>
          </div>

          {/* Hero Content Section */}
          <div className="relative z-10 my-auto space-y-8 max-w-xl">
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white xl:text-5xl leading-tight">
                Update your account <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">Credentials</span>.
              </h1>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Set a strong, unique password to safeguard your learning dashboard, solution code, and progress logs.
              </p>
            </div>

            {/* Feature/Guidelines Card */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-all hover:bg-slate-100/80 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Password Requirements</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Must contain at least 8 characters. Mix numbers & letters for security.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-all hover:bg-slate-100/80 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Instant Sync</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Updating your password will sync across all active user sessions.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="relative z-10 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
            <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span>Secure Password Encryption via Supabase Auth</span>
          </div>
        </div>

        {/* Right Side Form Panel (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-slate-50 dark:bg-[#07090e]">
          
          {/* Mobile Top Header */}
          <div className="flex lg:hidden items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                <LockKeyhole size={18} />
              </div>
              <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                Depth<span className="text-indigo-600 dark:text-indigo-400">Study</span>
              </span>
            </Link>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Reset Password</span>
          </div>

          <div className="my-auto mx-auto w-full max-w-sm space-y-6">
            
            {/* Header Title */}
            <div className="space-y-1.5">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Choose New Password
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Enter and confirm your new password below.
              </p>
            </div>

            {checkingSession ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 size={24} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Verifying session token...</p>
              </div>
            ) : ready ? (
              /* Form */
              <form onSubmit={submit} className="space-y-4">
                {/* New Password Input */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
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

                {/* Confirm Password Input */}
                <div className="space-y-1.5">
                  <label htmlFor="confirm" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Re-enter your new password"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
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
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <>
                      <span>Update Password</span>
                      <CheckCircle2 size={15} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Invalid Session Fallback Notice */
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-center dark:border-amber-500/20 dark:bg-amber-500/10 space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                  <AlertCircle size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Invalid Recovery Session</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Please open the password recovery link sent to your email to continue resetting your password.
                  </p>
                </div>
              </div>
            )}

            {/* Back to Login Link */}
            <div className="border-t border-slate-200 dark:border-slate-900 pt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back to login</span>
              </Link>
            </div>
          </div>

          {/* Mobile Footer */}
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 lg:hidden pt-6">
            © {new Date().getFullYear()} Depth Study Inc.
          </p>
        </div>
      </div>
    </main>
  );
}