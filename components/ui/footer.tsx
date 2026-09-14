'use client';

import Link from 'next/link';
import { 
  Layers, 
  ArrowUpRight, 
  Github, 
  Twitter, 
  Linkedin, 
  Mail, 
  Send,
  Heart
} from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200/80 bg-zinc-50/50 text-zinc-600 transition-colors duration-300 dark:border-white/10 dark:bg-[#07090e] dark:text-zinc-400">
      
      {/* Bottom CTA Banner */}
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-8 shadow-2xl shadow-indigo-500/10 dark:from-indigo-950/80 dark:via-zinc-900 dark:to-purple-950/60 sm:p-12">
          
          <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                Start Learning Today
              </span>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                Join thousands of learners building their future with Depth Study.
              </h2>
              <p className="mt-2 text-xs font-medium text-indigo-100/80 dark:text-zinc-400 sm:text-sm">
                Free notes • Quality courses • Real DSA practice
              </p>
            </div>
            
            <Link
              href="/register"
              className="group inline-flex items-center gap-2.5 rounded-2xl bg-white px-6 py-3.5 text-xs font-extrabold text-zinc-900 shadow-xl transition-all duration-300 hover:bg-zinc-100 hover:shadow-2xl hover:shadow-white/20 active:scale-95 shrink-0"
            >
              Get Started Free 
              <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Glowing Background Elements */}
          <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-12 left-1/3 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          
          {/* Brand Info & Newsletter */}
          <div className="space-y-4 lg:col-span-5">
            <Link 
              href="/" 
              className="group inline-flex items-center gap-2.5 text-lg font-black tracking-tight text-zinc-900 dark:text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20 transition-transform duration-300 group-hover:scale-105">
                <Layers size={20} />
              </span>
              <span>Depth Study</span>
            </Link>

            <p className="max-w-sm text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Learn today, build tomorrow. Explore structured notes, expert courses, and practical Data Structures & Algorithms to level up your engineering skills.
            </p>

            {/* Mini Newsletter Input */}
            <div className="pt-2">
              <p className="mb-2 text-xs font-bold text-zinc-900 dark:text-white">Subscribe to product updates</p>
              <form onSubmit={(e) => e.preventDefault()} className="flex max-w-sm items-center gap-2">
                <div className="relative flex-1">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input 
                    type="email" 
                    placeholder="Enter your email"
                    className="h-9 w-full rounded-xl border border-zinc-200/80 bg-white pl-9 pr-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-zinc-900/60 dark:text-white dark:focus:border-indigo-500/50"
                  />
                </div>
                <button
                  type="submit"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95"
                  title="Subscribe"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              
              {/* Column 1 */}
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-white">
                  Library
                </span>
                <ul className="mt-4 space-y-3 text-xs font-medium">
                  <li>
                    <Link href="/study/courses" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                      Courses
                    </Link>
                  </li>
                  <li>
                    <Link href="/study/notes" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                      Notes
                    </Link>
                  </li>
                  <li>
                    <Link href="/dsa" className="inline-flex items-center gap-1.5 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                      DSA Practice
                      <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[9px] font-extrabold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                        HOT
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                      About Platform
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 2 */}
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-white">
                  Account
                </span>
                <ul className="mt-4 space-y-3 text-xs font-medium">
                  <li>
                    <Link href="/login" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                      Register
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/profile" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                      Settings
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 3 */}
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-white">
                  Legal & Social
                </span>
                <ul className="mt-4 space-y-3 text-xs font-medium">
                  <li>
                    <Link href="/privacy" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                      Terms of Service
                    </Link>
                  </li>
                </ul>

                {/* Social Icons */}
                <div className="mt-6 flex items-center gap-2">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-all hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                  >
                    <Github size={14} />
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-all hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                  >
                    <Twitter size={14} />
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-all hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                  >
                    <Linkedin size={14} />
                  </a>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-200/80 pt-8 text-xs font-medium text-zinc-500 dark:border-white/10 dark:text-zinc-500 sm:flex-row">
          <span>© 2026 Depth Study. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Built with <Heart size={12} className="fill-rose-500 text-rose-500" /> for passionate learners.
          </span>
        </div>

      </div>
    </footer>
  );
}