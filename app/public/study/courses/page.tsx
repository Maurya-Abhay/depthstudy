import { createServerSupabaseClient } from '@/services/supabase-server';
import { CourseCard } from '@/app/public/_components/course-card';
import { BookOpen } from 'lucide-react';

export default async function CoursesPage() {
  let courses: Array<{
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
      .select('id,title,slug,description,access_type,price')
      .eq('published', true)
      .order('title');

    courses = data ?? [];
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0d1117] dark:text-slate-100">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-3 lg:px-4">
        
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-3 dark:border-slate-800">
          <div>
            <h1 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              All Courses
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Choose a structured curriculum and start learning step-by-step.
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
            <BookOpen size={14} />
            {courses.length} {courses.length === 1 ? 'Course' : 'Courses'} Available
          </span>
        </div>

        {/* Course Cards Grid */}
        {courses.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <BookOpen size={24} />
            </div>
            <strong className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              No published courses yet
            </strong>
            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              We are working on adding new courses. Check back soon!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}