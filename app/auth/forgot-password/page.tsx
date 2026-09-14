'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Mail, Loader2, ArrowLeft, Send, Sparkles, KeyRound, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useToast } from '@/components/ui/toast-provider';

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      if (!url || !key) {
        showToast('error', 'Authentication is not configured.');
        setBusy(false);
        return;
      }

      const supabase = createBrowserClient(url, key);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      setSubmitted(true);
      showToast('success', 'If that email exists, a password reset link has been sent.');
    } catch (error) {
      showToast(
        'error',
        error instanceof Error ? error.message : 'Unable to send the reset link.'
      );
    } finally {
      setBusy(false);
    }
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
                <Mail size={20} />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Depth<span className="text-indigo-600 dark:text-indigo-400">Study</span>
              </span>
            </Link>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
              <Sparkles size={13} /> Account Recovery
            </span>
          </div>

          {/* Hero Content Section */}
          <div className="relative z-10 my-auto space-y-8 max-w-xl">
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white xl:text-5xl leading-tight">
                Securely recover access to <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">Your Workspace</span>.
              </h1>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Don&apos;t worry if you forgot your password. We&apos;ll send a safe, magic recovery link to reset your account password instantly.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-all hover:bg-slate-100/80 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Instant Reset Link</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Receive a one-time link directly in your inbox.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-all hover:bg-slate-100/80 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">End-to-End Encryption</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Your account data and learning progress remain completely safe.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="relative z-10 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
            <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span>Protected Password Reset Flow via Supabase Auth</span>
          </div>
        </div>

        {/* Right Side Form Panel (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-slate-50 dark:bg-[#07090e]">
          
          {/* Mobile Top Header */}
          <div className="flex lg:hidden items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                <Mail size={18} />
              </div>
              <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                Depth<span className="text-indigo-600 dark:text-indigo-400">Study</span>
              </span>
            </Link>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Password Recovery</span>
          </div>

          <div className="my-auto mx-auto w-full max-w-sm space-y-6">
            
            {/* Header Title */}
            <div className="space-y-1.5">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Reset password
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Enter your registered email address and we&apos;ll send recovery instructions.
              </p>
            </div>

            {submitted ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10 space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <CheckCircle2 size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Check your email</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    We sent a password reset link to <span className="font-semibold text-slate-900 dark:text-slate-200">{email}</span>.
                  </p>
                </div>
              </div>
            ) : (
              /* Form */
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {busy ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <Send size={15} className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
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