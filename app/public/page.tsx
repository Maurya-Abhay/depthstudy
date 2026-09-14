import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
  GraduationCap,
  Layers,
  PlayCircle,
  Search,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';

import { getStudyLibrary } from '@/services/study';
import { CategoryCard } from '@/app/public/_components/category-card';
import { CourseCard } from '@/app/public/_components/course-card';
import { createServerSupabaseClient } from '@/services/supabase-server';

export default async function Home() {
  const { categories = [], topics = [], error } = await getStudyLibrary();

  let resolvedFeaturedCourses: Array<{
    id: string;
    title: string;
    slug: string;
    description: string;
    access_type: string;
    price: number;
  }> = [];

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from('courses')
      .select('id, title, slug, description, access_type, price')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(4);

    resolvedFeaturedCourses = data ?? [];
  }

  const totalMinutes = topics.reduce(
    (total, topic) => total + (topic.estimatedMinutes ?? 0),
    0
  );

  const learningHours =
    totalMinutes > 0 ? Math.max(1, Math.round(totalMinutes / 60)) : 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100/60 text-slate-900 transition-colors duration-500 dark:bg-[#030712] dark:text-slate-100">
      
      {/* Dynamic Ambient Background Lights */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[650px] w-[950px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-500/25 via-purple-500/20 to-pink-500/20 blur-[140px] dark:from-indigo-600/30 dark:via-purple-600/25 dark:to-pink-600/20" />
      <div className="pointer-events-none absolute top-[550px] -left-48 -z-10 h-[500px] w-[500px] rounded-full bg-sky-400/20 blur-[130px] dark:bg-indigo-500/15" />
      <div className="pointer-events-none absolute top-[1200px] -right-48 -z-10 h-[500px] w-[500px] rounded-full bg-purple-500/20 blur-[130px] dark:bg-purple-900/20" />

      {/* HERO SECTION */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold text-indigo-700 shadow-sm backdrop-blur-xl dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-300">
                <GraduationCap size={16} className="text-indigo-600 dark:text-indigo-400" />
                <span>Your Ultimate Learning Companion</span>
              </div>

              <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-6xl lg:text-7xl dark:text-white">
                Learn.{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                  Practice.
                </span>
                <br />
                Master.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
                Structured courses, active recall practice, and curated DSA problem sets designed to level up your software skills seamlessly.
              </p>

              {/* Glass Search Bar */}
              <div className="mt-8 max-w-lg">
                <form action="/study" method="get" className="group relative flex items-center">
                  <Search
                    size={18}
                    className="absolute left-4.5 text-slate-400 transition-colors group-focus-within:text-indigo-500 dark:text-slate-500 dark:group-focus-within:text-indigo-400"
                  />
                  <input
                    name="q"
                    type="search"
                    placeholder="Search topics, courses, or DSA problems..."
                    className="w-full rounded-2xl border border-white/80 bg-white/60 py-4 pl-12 pr-20 text-sm text-slate-900 shadow-2xl shadow-indigo-500/5 outline-none backdrop-blur-2xl transition-all focus:border-indigo-500 focus:bg-white/90 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-900/40 dark:text-white dark:shadow-none dark:focus:border-indigo-400 dark:focus:bg-slate-900/80 dark:focus:ring-indigo-400/20"
                  />
                  <kbd className="absolute right-4 hidden rounded-lg border border-slate-200/80 bg-slate-100/80 px-2 py-1 text-[10px] font-bold text-slate-500 backdrop-blur-md sm:inline-block dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-400">
                    ⌘ K
                  </kbd>
                </form>
              </div>
            </div>

            {/* Hero Right Visual: Glass Student Active Study Hub */}
            <div className="relative lg:col-span-5">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-2xl dark:opacity-30" />
              
              <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/40 p-6 shadow-2xl shadow-indigo-500/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/40 dark:shadow-none">
                
                {/* Header: User Goal & Streak */}
                <div className="flex items-center justify-between border-b border-slate-200/50 pb-4 dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                      <Target size={20} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        Today's Study Goal
                      </h3>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        2 / 3 Topics Completed
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 backdrop-blur-md dark:text-amber-400">
                    <Flame size={15} className="animate-bounce fill-amber-500 text-amber-500" />
                    <span>7 Day Streak</span>
                  </div>
                </div>

                {/* Glass Progress Bar */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-indigo-600 dark:text-indigo-400">Daily Target</span>
                    <span className="text-slate-600 dark:text-slate-300">66%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/60 p-0.5 backdrop-blur-md dark:bg-slate-800/80">
                    <div className="h-full w-[66%] rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700" />
                  </div>
                </div>

                {/* Interactive Glass Topic Cards */}
                <div className="mt-5 space-y-2.5">
                  <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 backdrop-blur-md dark:border-emerald-500/20 dark:bg-emerald-500/10">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-emerald-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Arrays & HashMaps</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Data Structures • 25 mins</p>
                      </div>
                    </div>
                    <span className="rounded-lg bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400">
                      DONE
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-3.5 shadow-lg shadow-indigo-500/5 backdrop-blur-md dark:border-indigo-400/30 dark:bg-indigo-500/15">
                    <div className="flex items-center gap-3">
                      <PlayCircle size={18} className="text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Dynamic Programming Intro</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Algorithms • In Progress</p>
                      </div>
                    </div>
                    <span className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[10px] font-extrabold text-white shadow-md shadow-indigo-600/30">
                      CONTINUE
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-slate-100/40 p-3.5 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-800/20">
                    <div className="flex items-center gap-3">
                      <Clock size={18} className="text-slate-400" />
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">System Design Patterns</p>
                        <p className="text-[10px] text-slate-400">Up Next • 45 mins</p>
                      </div>
                    </div>
                    <span className="rounded-lg bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      LATER
                    </span>
                  </div>
                </div>

                {/* Footer Glass Stat Pills */}
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200/50 pt-4 dark:border-slate-800/60">
                  <div className="flex items-center gap-2.5 rounded-2xl border border-white/60 bg-white/50 p-3 backdrop-blur-md dark:border-white/5 dark:bg-slate-800/40">
                    <Trophy size={16} className="text-amber-500" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">XP Points</p>
                      <p className="text-xs font-black text-slate-900 dark:text-white">1,480 XP</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-2xl border border-white/60 bg-white/50 p-3 backdrop-blur-md dark:border-white/5 dark:bg-slate-800/40">
                    <Zap size={16} className="text-indigo-500" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Total Hours</p>
                      <p className="text-xs font-black text-slate-900 dark:text-white">{learningHours}h Mastered</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* BENTO STATS SECTION */}
          <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/40 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-slate-900/40 dark:shadow-none">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 transition-transform group-hover:scale-110 dark:bg-indigo-500/20 dark:text-indigo-400">
                  <BookOpen size={24} />
                </div>
                <div>
                  <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{categories.length}</div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Published Categories
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/40 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-slate-900/40 dark:shadow-none">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 transition-transform group-hover:scale-110 dark:bg-indigo-500/20 dark:text-indigo-400">
                  <Compass size={24} />
                </div>
                <div>
                  <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{topics.length}</div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Interactive Topics
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/40 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10 sm:col-span-2 lg:col-span-1 dark:border-white/10 dark:bg-slate-900/40 dark:shadow-none">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 transition-transform group-hover:scale-110 dark:bg-purple-500/20 dark:text-purple-400">
                  <Sparkles size={24} />
                </div>
                <div>
                  <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {learningHours}
                    <span className="ml-1 text-base font-bold text-slate-500">hrs</span>
                  </div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Estimated Content
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section className="relative py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                Study Categories
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Select a topic path and start learning at your own pace.
              </p>
            </div>
            <Link
              href="/study"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white/60 px-5 py-3 text-xs font-bold text-slate-700 shadow-lg shadow-slate-200/30 backdrop-blur-xl transition-all hover:border-indigo-500 hover:text-indigo-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-400"
            >
              <span>View All Libraries</span> <ArrowRight size={14} />
            </Link>
          </div>

          {error ? (
            <div className="rounded-3xl border border-white/60 bg-white/40 p-12 text-center shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/40">
              <Search size={32} className="mx-auto mb-3 text-slate-400" />
              <strong className="block text-slate-900 dark:text-white">
                Study library temporarily unavailable
              </strong>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Please check back in a few moments or verify backend connection.
              </p>
            </div>
          ) : categories.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories.map((category) => (
                <CategoryCard key={category.id} item={category} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/60 bg-white/40 p-12 text-center shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/40">
              <BookOpen size={32} className="mx-auto mb-3 text-slate-400" />
              <strong className="block text-slate-900 dark:text-white">
                No published categories yet
              </strong>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Categories created from the admin workspace will appear here.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* FEATURED COURSES SECTION */}
      <section className="relative pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                Featured Courses
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Follow comprehensive learning tracks crafted for core mastery.
              </p>
            </div>
            <Link
              href="/study/courses"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white/60 px-5 py-3 text-xs font-bold text-slate-700 shadow-lg shadow-slate-200/30 backdrop-blur-xl transition-all hover:border-indigo-500 hover:text-indigo-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-400"
            >
              <span>Browse All Courses</span> <ArrowRight size={14} />
            </Link>
          </div>

          {resolvedFeaturedCourses.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {resolvedFeaturedCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/60 bg-white/40 p-12 text-center shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/40">
              <strong className="block text-slate-900 dark:text-white">
                No courses published yet
              </strong>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Publish courses from the admin panel to display them on the homepage.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}