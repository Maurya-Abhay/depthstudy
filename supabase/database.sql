-- ============================================================================
-- Depth Study — COMPLETE fresh database setup (single file).
-- New Supabase project -> SQL Editor -> paste ENTIRE file -> Run.
-- Safe to re-run: IF NOT EXISTS / OR REPLACE / DROP policy + CREATE.
-- ============================================================================
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role text not null default 'user' check (role in ('user','admin')),
  status text not null default 'active' check (status in ('active','suspended')),
  suspended_at timestamptz,
  suspended_by uuid references auth.users(id) on delete set null,
  suspension_reason text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.study_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  icon text not null default '•',
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

/* Legacy table kept only for old data compatibility. The application no longer exposes modules. */
create table if not exists public.study_modules (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.study_categories(id) on delete cascade,
  name text not null,
  slug text not null,
  description text not null default '',
  published boolean not null default true,
  sort_order int not null default 0,
  unique(category_id, slug)
);

create table if not exists public.study_topics (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.study_categories(id) on delete cascade,
  module_id uuid references public.study_modules(id) on delete set null,
  title text not null,
  slug text not null unique,
  difficulty text not null default 'Beginner',
  estimated_minutes int not null default 10,
  summary text not null default '',
  concept text not null default '',
  explanation text not null default '',
  mental_model text,
  real_example text,
  code_example text,
  code_language text,
  output text,
  common_mistakes jsonb not null default '[]'::jsonb,
  practice_task text,
  interview_questions jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  sort_order int not null default 0
);

alter table public.study_topics add column if not exists category_id uuid references public.study_categories(id) on delete cascade;
alter table public.study_topics add column if not exists module_id uuid references public.study_modules(id) on delete set null;
alter table public.study_topics alter column module_id drop not null;

update public.study_topics t
set category_id = m.category_id
from public.study_modules m
where t.category_id is null and t.module_id = m.id;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  access_type text not null default 'free' check (access_type in ('free','paid')),
  price numeric not null default 0,
  unlock_days int not null default 0,
  required_progress int not null default 100,
  passing_score int not null default 70,
  certificate_enabled boolean not null default true,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.course_categories (
  course_id uuid not null references public.courses(id) on delete cascade,
  category_id uuid not null references public.study_categories(id) on delete cascade,
  sort_order int not null default 0,
  primary key(course_id, category_id)
);

create table if not exists public.course_topics (
  course_id uuid not null references public.courses(id) on delete cascade,
  topic_id uuid not null references public.study_topics(id) on delete cascade,
  sort_order int not null default 0,
  primary key(course_id, topic_id)
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(user_id, course_id)
);

create table if not exists public.topic_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references public.study_topics(id) on delete cascade,
  progress int not null default 0 check(progress between 0 and 100),
  status text not null default 'not_started',
  last_studied_at timestamptz,
  completed_at timestamptz,
  primary key(user_id, topic_id)
);

create table if not exists public.study_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid references public.study_topics(id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  duration_minutes int not null default 30,
  status text not null default 'planned'
);

create table if not exists public.personal_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid references public.study_topics(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now(),
  unique(user_id, topic_id)
);

create table if not exists public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references public.study_topics(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, topic_id)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.study_categories(id) on delete set null,
  topic_id uuid references public.study_topics(id) on delete set null,
  prompt text not null,
  type text not null default 'mcq',
  options jsonb not null default '[]'::jsonb,
  answer jsonb not null default 'null'::jsonb,
  explanation text not null default '',
  difficulty int not null default 2 check (difficulty between 1 and 5),
  published boolean not null default false
);
alter table public.questions add column if not exists category_id uuid references public.study_categories(id) on delete set null;
alter table public.questions add column if not exists difficulty int not null default 2 check (difficulty between 1 and 5);

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  course_id uuid references public.courses(id) on delete cascade,
  topic_id uuid references public.study_topics(id) on delete set null,
  duration_minutes int not null default 30,
  passing_score int not null default 70,
  unlock_days int not null default 0,
  required_progress int not null default 100,
  max_attempts int not null default 1,
  random_questions boolean not null default true,
  random_options boolean not null default true,
  published boolean not null default false
);
alter table public.tests add column if not exists max_attempts int not null default 1;
alter table public.tests add column if not exists random_questions boolean not null default true;
alter table public.tests add column if not exists random_options boolean not null default true;

create table if not exists public.test_questions (
  test_id uuid not null references public.tests(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  sort_order int not null default 0,
  primary key(test_id, question_id)
);

create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_id uuid not null references public.tests(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score int,
  passed boolean,
  suspicious_events jsonb not null default '[]'::jsonb
);

create table if not exists public.test_answers (
  attempt_id uuid not null references public.test_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  answer jsonb not null default 'null'::jsonb,
  is_correct boolean,
  primary key(attempt_id, question_id)
);

create table if not exists public.dsa_topics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.dsa_problems (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.dsa_topics(id) on delete set null,
  title text not null,
  slug text not null unique,
  difficulty text not null default 'Easy',
  pattern text not null default '',
  summary text not null default '',
  problem text not null default '',
  examples text not null default '',
  constraints text not null default '',
  hint text not null default '',
  brute_force text not null default '',
  optimized text not null default '',
  time_complexity text not null default '',
  space_complexity text not null default '',
  starter_code text not null default '',
  solution text not null default '',
  test_cases jsonb not null default '[]'::jsonb,
  published boolean not null default false
);
alter table public.dsa_problems add column if not exists topic_id uuid references public.dsa_topics(id) on delete set null;

create table if not exists public.dsa_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.dsa_problems(id) on delete cascade,
  language text not null default 'java',
  source_code text not null,
  status text not null default 'queued',
  score int,
  runtime_ms int,
  memory_kb int,
  created_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_code text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  score int not null,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.activity_logs (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  kind text not null,
  title text not null,
  instruction text not null default '',
  output jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  kind text not null default 'general',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

/* RLS */
alter table public.profiles enable row level security;
alter table public.study_categories enable row level security;
alter table public.study_modules enable row level security;
alter table public.study_topics enable row level security;
alter table public.courses enable row level security;
alter table public.course_categories enable row level security;
alter table public.course_topics enable row level security;
alter table public.enrollments enable row level security;
alter table public.topic_progress enable row level security;
alter table public.study_schedules enable row level security;
alter table public.personal_notes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.questions enable row level security;
alter table public.tests enable row level security;
alter table public.test_questions enable row level security;
alter table public.test_attempts enable row level security;
alter table public.test_answers enable row level security;
alter table public.dsa_topics enable row level security;
alter table public.dsa_problems enable row level security;
alter table public.dsa_submissions enable row level security;
alter table public.certificates enable row level security;
alter table public.activity_logs enable row level security;
alter table public.ai_generations enable row level security;
alter table public.notifications enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin');
$$;

/* ---- FRESH-DB: suspension columns (also in old migrations) ---- */
alter table public.profiles add column if not exists suspended_at timestamptz;
alter table public.profiles add column if not exists suspended_by uuid references auth.users(id) on delete set null;
alter table public.profiles add column if not exists suspension_reason text;
/* ---- FRESH-DB: course detail content (also in old migrations) ---- */
alter table if exists public.courses add column if not exists content text not null default '';

drop policy if exists "public published categories" on public.study_categories;
create policy "public published categories" on public.study_categories for select using (published = true or public.is_admin());
drop policy if exists "public published topics" on public.study_topics;
create policy "public published topics" on public.study_topics for select using (published = true or public.is_admin());
drop policy if exists "public published courses" on public.courses;
create policy "public published courses" on public.courses for select using (published = true or public.is_admin());
drop policy if exists "public course topics" on public.course_topics;
create policy "public course topics" on public.course_topics for select using (exists(select 1 from public.courses c where c.id=course_id and (c.published=true or public.is_admin())));
drop policy if exists "public course categories" on public.course_categories;
create policy "public course categories" on public.course_categories for select using (exists(select 1 from public.courses c where c.id=course_id and (c.published=true or public.is_admin())));
drop policy if exists "public questions" on public.questions;
create policy "public questions" on public.questions for select using (published = true or public.is_admin());
drop policy if exists "public tests" on public.tests;
create policy "public tests" on public.tests for select using (published = true or public.is_admin());
drop policy if exists "public test questions" on public.test_questions;
create policy "public test questions" on public.test_questions for select using (exists(select 1 from public.tests t where t.id=test_id and (t.published=true or public.is_admin())));
drop policy if exists "public dsa topics" on public.dsa_topics;
create policy "public dsa topics" on public.dsa_topics for select using (published = true or public.is_admin());
drop policy if exists "public dsa problems" on public.dsa_problems;
create policy "public dsa problems" on public.dsa_problems for select using (published = true or public.is_admin());
/* ---- FRESH-DB FIX: profiles SELECT (login->profile redirect loop fix) ---- */
drop policy if exists "public profiles self" on public.profiles;
drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles for select using (id=auth.uid());
drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles" on public.profiles for select using (public.is_admin());

/* user-owned */
drop policy if exists "users own progress" on public.topic_progress;
create policy "users own progress" on public.topic_progress for all using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "users own enrollments" on public.enrollments;
create policy "users own enrollments" on public.enrollments for all using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "users own schedules" on public.study_schedules;
create policy "users own schedules" on public.study_schedules for all using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "users own notes" on public.personal_notes;
create policy "users own notes" on public.personal_notes for all using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "users own bookmarks" on public.bookmarks;
create policy "users own bookmarks" on public.bookmarks for all using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "users own attempts" on public.test_attempts;
create policy "users own attempts" on public.test_attempts for all using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "users own answers" on public.test_answers;
create policy "users own answers" on public.test_answers for all using (exists(select 1 from public.test_attempts a where a.id=attempt_id and a.user_id=auth.uid())) with check (exists(select 1 from public.test_attempts a where a.id=attempt_id and a.user_id=auth.uid()));
drop policy if exists "users own dsa submissions" on public.dsa_submissions;
create policy "users own dsa submissions" on public.dsa_submissions for all using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "users own certificates" on public.certificates;
create policy "users own certificates" on public.certificates for select using (user_id=auth.uid() or public.is_admin());
drop policy if exists "users own notifications" on public.notifications;
create policy "users own notifications" on public.notifications for all using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "users create own profile" on public.profiles;
create policy "users create own profile" on public.profiles for insert with check (id=auth.uid() and (role='user' or public.is_admin()));
drop policy if exists "admin profiles write" on public.profiles;
create policy "admin profiles write" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

/* admin */
drop policy if exists "admin categories write" on public.study_categories;
drop policy if exists "admin topics write" on public.study_topics;
drop policy if exists "admin courses write" on public.courses;
drop policy if exists "admin course topics write" on public.course_topics;
drop policy if exists "admin course categories write" on public.course_categories;
drop policy if exists "admin questions write" on public.questions;
drop policy if exists "admin tests write" on public.tests;
drop policy if exists "admin test questions write" on public.test_questions;
drop policy if exists "admin dsa topics write" on public.dsa_topics;
drop policy if exists "admin dsa write" on public.dsa_problems;
drop policy if exists "admin certificates write" on public.certificates;
drop policy if exists "admin activity read" on public.activity_logs;
drop policy if exists "admin activity write" on public.activity_logs;
drop policy if exists "admin ai write" on public.ai_generations;
create policy "admin categories write" on public.study_categories for all using (public.is_admin()) with check (public.is_admin());
create policy "admin topics write" on public.study_topics for all using (public.is_admin()) with check (public.is_admin());
create policy "admin courses write" on public.courses for all using (public.is_admin()) with check (public.is_admin());
create policy "admin course topics write" on public.course_topics for all using (public.is_admin()) with check (public.is_admin());
create policy "admin course categories write" on public.course_categories for all using (public.is_admin()) with check (public.is_admin());
create policy "admin questions write" on public.questions for all using (public.is_admin()) with check (public.is_admin());
create policy "admin tests write" on public.tests for all using (public.is_admin()) with check (public.is_admin());
create policy "admin test questions write" on public.test_questions for all using (public.is_admin()) with check (public.is_admin());
create policy "admin dsa topics write" on public.dsa_topics for all using (public.is_admin()) with check (public.is_admin());
create policy "admin dsa write" on public.dsa_problems for all using (public.is_admin()) with check (public.is_admin());
create policy "admin certificates write" on public.certificates for all using (public.is_admin()) with check (public.is_admin());
create policy "admin activity read" on public.activity_logs for select using (public.is_admin());
create policy "admin activity write" on public.activity_logs for insert with check (auth.uid() is not null);
create policy "admin ai write" on public.ai_generations for all using (public.is_admin()) with check (public.is_admin());

/* Public verification */
drop policy if exists "public certificate verification" on public.certificates;
create policy "public certificate verification" on public.certificates for select using (revoked_at is null);

create index if not exists idx_topics_category on public.study_topics(category_id, sort_order);
create index if not exists idx_topics_published on public.study_topics(published, category_id, sort_order);
create index if not exists idx_courses_published on public.courses(published, title);
create index if not exists idx_questions_category on public.questions(category_id, published);
create index if not exists idx_tests_course on public.tests(course_id, published);
create index if not exists idx_dsa_topics_order on public.dsa_topics(published, sort_order);
create index if not exists idx_dsa_problems_topic on public.dsa_problems(topic_id, difficulty, published);
create index if not exists idx_activity_created on public.activity_logs(created_at desc);

/* ---------------------------------------------------------------------
   Fast search: trigram indexes so ILIKE '%term%' search (categories,
   topics, courses, DSA problems) stays fast as content grows.
   Run this whole file again after upgrading from an older schema.
--------------------------------------------------------------------- */
create extension if not exists pg_trgm;

create index if not exists idx_categories_search_trgm on public.study_categories using gin ((name || ' ' || coalesce(description, '')) gin_trgm_ops);
create index if not exists idx_topics_search_trgm on public.study_topics using gin ((title || ' ' || coalesce(summary, '') || ' ' || coalesce(explanation, '')) gin_trgm_ops);
create index if not exists idx_courses_search_trgm on public.courses using gin ((title || ' ' || coalesce(description, '')) gin_trgm_ops);
create index if not exists idx_dsa_problems_search_trgm on public.dsa_problems using gin ((title || ' ' || coalesce(pattern, '') || ' ' || coalesce(summary, '')) gin_trgm_ops);

/* Roadmaps are modeled as courses (see course_categories / course_topics
   above) so a roadmap is: a course row + its linked categories/topics.
   These indexes keep the roadmap admin screen and the student
   /dashboard/roadmap page fast when listing/joining roadmaps. */
create index if not exists idx_course_categories_course on public.course_categories(course_id, sort_order);
create index if not exists idx_course_topics_course on public.course_topics(course_id, sort_order);
create index if not exists idx_enrollments_user on public.enrollments(user_id, course_id);
create index if not exists idx_topic_progress_user_topic on public.topic_progress(user_id, topic_id);

/* Detailed course/roadmap content: a large rich-text field so admins can
   explain the complete course/roadmap in depth (separate from the short
   card description). Safe to re-run. */
alter table if exists public.courses add column if not exists content text not null default '';

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  category text not null default 'general',
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.skill_topics (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  parent_id uuid references public.skill_topics(id) on delete set null,
  name text not null,
  slug text not null,
  description text not null default '',
  published boolean not null default true,
  sort_order int not null default 0,
  unique(skill_id, slug)
);

create table if not exists public.user_skill_mastery (
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  mastery_score int not null default 0 check (mastery_score between 0 and 100),
  confidence_score int not null default 0 check (confidence_score between 0 and 100),
  attempts int not null default 0,
  successful_attempts int not null default 0,
  last_activity_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

create table if not exists public.skill_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete set null,
  topic_id uuid references public.skill_topics(id) on delete set null,
  event_type text not null,
  score int check (score between 0 and 100),
  source text not null default 'system',
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.skill_gap_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  gap_score int not null default 0 check (gap_score between 0 and 100),
  priority text not null default 'medium'
    check (priority in ('low','medium','high','critical')),
  reason text not null default '',
  generated_at timestamptz not null default now()
);

create index if not exists idx_skill_events_user_skill on public.skill_events(user_id, skill_id, created_at desc);
create index if not exists idx_skill_events_user_created on public.skill_events(user_id, created_at desc);
create index if not exists idx_user_skill_mastery_user on public.user_skill_mastery(user_id, mastery_score desc);
create index if not exists idx_skill_topics_skill on public.skill_topics(skill_id, sort_order);
/* =====================================================================
   Run 2: Daily Missions + Mistake Intelligence + Adaptive Assessments
   ===================================================================== */

create table if not exists public.mistake_categories (
  code text primary key,
  label text not null,
  description text not null default ''
);

insert into public.mistake_categories (code, label, description) values
  ('concept_gap',    'Concept Gap',       'Fundamental misunderstanding of the underlying concept'),
  ('logic_error',    'Logic Error',       'Correct approach but flawed reasoning or algorithm'),
  ('edge_case',      'Edge Case',         'Missed boundary or special-case handling'),
  ('syntax_error',   'Syntax Error',      'Code does not compile or has language errors'),
  ('runtime_error',  'Runtime Error',     'Code crashes or throws an exception at runtime'),
  ('time_complexity','Time Complexity',   'Solution works but is not efficient enough'),
  ('wrong_output',   'Wrong Output',      'Produces incorrect results for given inputs'),
  ('knowledge_gap',  'Knowledge Gap',     'Missing knowledge required to solve the problem'),
  ('careless_error', 'Careless Error',    'Avoidable mistake due to oversight'),
  ('unknown',        'Unknown',           'Unclassified mistake')
on conflict (code) do nothing;

create table if not exists public.mistake_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'test'
    check (source in ('test','assessment','dsa','study','activity')),
  source_id uuid,
  skill_id uuid references public.skills(id) on delete set null,
  category text not null default 'unknown' references public.mistake_categories(code),
  severity int not null default 3 check (severity between 1 and 5),
  description text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_mistake_logs_user on public.mistake_logs(user_id, created_at desc);
create index if not exists idx_mistake_logs_skill on public.mistake_logs(skill_id, category);
create index if not exists idx_mistake_logs_category on public.mistake_logs(user_id, category, created_at desc);

create table if not exists public.learning_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_date date not null,
  title text not null,
  description text not null default '',
  status text not null default 'planned'
    check (status in ('planned','active','completed','skipped')),
  generated_by text not null default 'rule'
    check (generated_by in ('rule','ai')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, mission_date)
);

create table if not exists public.assessment_blueprints (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid references public.skills(id) on delete cascade,
  title text not null,
  description text not null default '',
  difficulty text not null default 'adaptive',
  question_count int not null default 10,
  passing_score int not null default 70,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.adaptive_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  blueprint_id uuid references public.assessment_blueprints(id) on delete set null,
  status text not null default 'active'
    check (status in ('active','submitted','expired')),
  current_difficulty int not null default 2
    check (current_difficulty between 1 and 5),
  score int,
  started_at timestamptz not null default now(),
  submitted_at timestamptz
);

create table if not exists public.adaptive_assessment_items (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.adaptive_assessments(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  position int not null,
  difficulty int not null default 2
    check (difficulty between 1 and 5),
  answered boolean not null default false,
  is_correct boolean,
  unique(assessment_id, position)
);

-- NOTE: this table must be created AFTER public.adaptive_assessments because
-- its assessment_id column references that table (fixed ordering bug that
-- previously broke fresh-database setup with "relation adaptive_assessments
-- does not exist").
create table if not exists public.learning_mission_items (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.learning_missions(id) on delete cascade,
  position int not null,
  item_type text not null
    check (item_type in ('lesson','practice','review','assessment','dsa')),
  skill_id uuid references public.skills(id) on delete set null,
  topic_id uuid references public.study_topics(id) on delete set null,
  dsa_problem_id uuid references public.dsa_problems(id) on delete set null,
  assessment_id uuid references public.adaptive_assessments(id) on delete set null,
  target_minutes int not null default 10,
  status text not null default 'pending'
    check (status in ('pending','active','completed','skipped')),
  completed_at timestamptz,
  unique(mission_id, position)
);

create index if not exists idx_learning_missions_user_date
  on public.learning_missions(user_id, mission_date desc);

create index if not exists idx_adaptive_assessments_user
  on public.adaptive_assessments(user_id, started_at desc);

create index if not exists idx_adaptive_assessment_items_assessment
  on public.adaptive_assessment_items(assessment_id, position);


create index if not exists idx_skill_gap_snapshots_user on public.skill_gap_snapshots(user_id, gap_score desc);

alter table public.skills enable row level security;
alter table public.skill_topics enable row level security;
alter table public.user_skill_mastery enable row level security;
alter table public.skill_events enable row level security;
alter table public.skill_gap_snapshots enable row level security;

drop policy if exists "public read published skills" on public.skills;
create policy "public read published skills" on public.skills for select using (published = true or public.is_admin());

drop policy if exists "admin skills write" on public.skills;
create policy "admin skills write" on public.skills for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read skill topics" on public.skill_topics;
create policy "public read skill topics" on public.skill_topics for select using (published = true or public.is_admin());

drop policy if exists "admin skill topics write" on public.skill_topics;
create policy "admin skill topics write" on public.skill_topics for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users own skill mastery" on public.user_skill_mastery;
create policy "users own skill mastery" on public.user_skill_mastery for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users own skill events" on public.skill_events;
create policy "users own skill events" on public.skill_events for select using (user_id = auth.uid());

drop policy if exists "admins read skill events" on public.skill_events;
create policy "admins read skill events" on public.skill_events for select using (public.is_admin());

drop policy if exists "users own skill gaps" on public.skill_gap_snapshots;
create policy "users own skill gaps" on public.skill_gap_snapshots for select using (user_id = auth.uid());

drop policy if exists "admins read skill gaps" on public.skill_gap_snapshots;
create policy "admins read skill gaps" on public.skill_gap_snapshots for select using (public.is_admin());

/* ── RLS for Run 2 tables ─────────────────────────────────────────────── */

alter table public.mistake_logs enable row level security;
alter table public.learning_missions enable row level security;
alter table public.learning_mission_items enable row level security;
alter table public.assessment_blueprints enable row level security;
alter table public.adaptive_assessments enable row level security;
alter table public.adaptive_assessment_items enable row level security;

drop policy if exists "users own mistake logs" on public.mistake_logs;
create policy "users own mistake logs" on public.mistake_logs for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "admins read mistake logs" on public.mistake_logs;
create policy "admins read mistake logs" on public.mistake_logs for select using (public.is_admin());

drop policy if exists "users own missions" on public.learning_missions;
create policy "users own missions" on public.learning_missions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users own mission items" on public.learning_mission_items;
create policy "users own mission items" on public.learning_mission_items for all using (
  exists (
    select 1 from public.learning_missions m
    where m.id = learning_mission_items.mission_id and m.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.learning_missions m
    where m.id = learning_mission_items.mission_id and m.user_id = auth.uid()
  )
);

drop policy if exists "admins read missions" on public.learning_missions;
create policy "admins read missions" on public.learning_missions for select using (public.is_admin());

drop policy if exists "public read assessment blueprints" on public.assessment_blueprints;
create policy "public read assessment blueprints" on public.assessment_blueprints for select using (published = true or public.is_admin());

drop policy if exists "admin assessment blueprints write" on public.assessment_blueprints;
create policy "admin assessment blueprints write" on public.assessment_blueprints for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users own adaptive assessments" on public.adaptive_assessments;
create policy "users own adaptive assessments" on public.adaptive_assessments for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users own adaptive assessment items" on public.adaptive_assessment_items;
create policy "users own adaptive assessment items" on public.adaptive_assessment_items for all using (
  exists (
    select 1 from public.adaptive_assessments a
    where a.id = adaptive_assessment_items.assessment_id and a.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.adaptive_assessments a
    where a.id = adaptive_assessment_items.assessment_id and a.user_id = auth.uid()
  )
);

/* ── Harden questions table: prevent answer exposure ──────────────────── */

drop policy if exists "public questions safe read" on public.questions;
create policy "public questions safe read" on public.questions for select
  using (published = true or public.is_admin());

/* Server-side answer access: only via admin client (service-role)        */
/* The answer column is never exposed to client queries.                   */

/* =====================================================================
   Run 3: Socratic AI Coach + Explanation + Recommendations
   ===================================================================== */

create table if not exists public.ai_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_type text not null
    check (session_type in ('socratic_coach','code_explanation','mistake_explanation','recommendation')),
  skill_id uuid references public.skills(id) on delete set null,
  topic_id uuid references public.study_topics(id) on delete set null,
  problem_id uuid references public.dsa_problems(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ai_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  token_count int,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.ai_sessions(id) on delete set null,
  rating smallint check (rating between 1 and 5),
  helpful boolean,
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.learning_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  topic_id uuid references public.study_topics(id) on delete cascade,
  recommendation_type text not null,
  title text not null,
  reason text not null default '',
  priority int not null default 0,
  source text not null default 'rule',
  expires_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_sessions_user on public.ai_sessions(user_id, created_at desc);
create index if not exists idx_ai_messages_session on public.ai_messages(session_id, created_at);
create index if not exists idx_recommendations_user on public.learning_recommendations(user_id, priority desc, created_at desc);

/* ── RLS ──────────────────────────────────────────────────────────────── */

alter table public.ai_sessions enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_feedback enable row level security;
alter table public.learning_recommendations enable row level security;

drop policy if exists "users own ai sessions" on public.ai_sessions;
create policy "users own ai sessions" on public.ai_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users own ai messages" on public.ai_messages;
create policy "users own ai messages" on public.ai_messages for all using (
  exists (select 1 from public.ai_sessions s where s.id = ai_messages.session_id and s.user_id = auth.uid())
) with check (
  exists (select 1 from public.ai_sessions s where s.id = ai_messages.session_id and s.user_id = auth.uid())
);

drop policy if exists "users own ai feedback" on public.ai_feedback;
create policy "users own ai feedback" on public.ai_feedback for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users own recommendations" on public.learning_recommendations;
create policy "users own recommendations" on public.learning_recommendations for all using (user_id = auth.uid()) with check (user_id = auth.uid());

/* Use questions_safe view for client-safe reads without answer column.    */
create or replace view public.questions_safe as
  select id, category_id, topic_id, prompt, type, options, explanation, difficulty, published
  from public.questions;

/* =====================================================================
   Run 4: Proof of Skill
   ===================================================================== */

create table if not exists public.skill_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  headline text not null default '',
  bio text not null default '',
  is_public boolean not null default false,
  share_slug text unique,
  updated_at timestamptz not null default now()
);

create table if not exists public.verified_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid references public.adaptive_assessments(id) on delete set null,
  skill_id uuid references public.skills(id) on delete cascade,
  score int not null check (score between 0 and 100),
  verification_code text not null unique,
  verified_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.skill_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  evidence_type text not null
    check (evidence_type in ('assessment', 'course', 'dsa', 'project', 'certificate')),
  entity_id uuid,
  score int check (score between 0 and 100),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.public_skill_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  share_slug text not null unique,
  enabled boolean not null default false,
  display_name text not null default '',
  headline text not null default '',
  generated_at timestamptz not null default now()
);

create index if not exists idx_verified_assessments_user
  on public.verified_assessments(user_id, verified_at desc);

create index if not exists idx_skill_evidence_user_skill
  on public.skill_evidence(user_id, skill_id, created_at desc);

create index if not exists idx_public_skill_profiles_slug
  on public.public_skill_profiles(share_slug);

/* RLS */
alter table public.skill_profiles enable row level security;
alter table public.verified_assessments enable row level security;
alter table public.skill_evidence enable row level security;
alter table public.public_skill_profiles enable row level security;

drop policy if exists "users own skill profile" on public.skill_profiles;
create policy "users own skill profile" on public.skill_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "public read shared profiles" on public.skill_profiles;
create policy "public read shared profiles" on public.skill_profiles for select using (is_public = true);

drop policy if exists "users own verified assessments" on public.verified_assessments;
create policy "users own verified assessments" on public.verified_assessments for select using (user_id = auth.uid());

drop policy if exists "admins manage verified assessments" on public.verified_assessments;
create policy "admins manage verified assessments" on public.verified_assessments for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users own skill evidence" on public.skill_evidence;
create policy "users own skill evidence" on public.skill_evidence for select using (user_id = auth.uid());

drop policy if exists "admins manage skill evidence" on public.skill_evidence;
create policy "admins manage skill evidence" on public.skill_evidence for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read enabled public profiles" on public.public_skill_profiles;
create policy "public read enabled public profiles" on public.public_skill_profiles for select using (enabled = true);



create table if not exists public.platform_settings (
  id integer primary key check (id = 1),
  brand text not null default 'Depth Study',
  maintenance boolean not null default false,
  notify_admin boolean not null default true,
  compact boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

/* =====================================================================
   Run 5: Onboarding + Diagnostic Flow
   ===================================================================== */

create table if not exists public.user_onboarding (
  user_id uuid primary key references auth.users(id) on delete cascade,
  interests text[] not null default '{}',
  current_level text not null default 'beginner'
    check (current_level in ('beginner','intermediate','advanced')),
  goals text[] not null default '{}',
  daily_minutes int not null default 30
    check (daily_minutes in (15,30,45,60,90)),
  learning_style text not null default 'balanced'
    check (learning_style in ('concept_first','practice_first','balanced')),
  diagnostic_completed boolean not null default false,
  diagnostic_assessment_id uuid,
  onboarding_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_onboarding_completed
  on public.user_onboarding(user_id, onboarding_completed);

alter table public.user_onboarding enable row level security;

drop policy if exists "users own onboarding" on public.user_onboarding;
create policy "users own onboarding" on public.user_onboarding for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "admins read onboarding" on public.user_onboarding;
create policy "admins read onboarding" on public.user_onboarding for select
  using (public.is_admin());

insert into public.platform_settings (id) values (1) on conflict (id) do nothing;
alter table public.platform_settings enable row level security;
drop policy if exists "admins manage platform settings" on public.platform_settings;
create policy "admins manage platform settings" on public.platform_settings for all using (public.is_admin()) with check (public.is_admin());

-- FRESH-DB: grants (anon/auth read published; authenticated CRUD own rows; RLS enforces)
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated;
-- FRESH-DB: undo old revoke on questions/DSA (server uses service_role for secrets anyway)
grant select on public.dsa_topics to anon, authenticated;
-- FRESH-DB: one active attempt + one active certificate guards
create unique index if not exists uq_active_test_attempt_per_user_test on public.test_attempts(user_id, test_id) where submitted_at is null;
create unique index if not exists uq_active_certificate_per_user_course on public.certificates(user_id, course_id) where revoked_at is null;
create unique index if not exists uq_certificate_code on public.certificates(certificate_code);
-- FRESH-DB: invalid progress guard
alter table public.topic_progress drop constraint if exists topic_progress_progress_range;
alter table public.topic_progress add constraint topic_progress_progress_range check (progress >= 0 and progress <= 100);
-- Depth Study — Product Foundation & Hardening
-- Safe to run after the existing database.sql.
-- Adds: spaced repetition, mistake analytics, content quality,
-- projects, interview/placement, organization/college workspace,
-- subscriptions/entitlements, plus critical RLS/view fixes.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Critical security repairs
-- ---------------------------------------------------------------------------

-- Never expose answer/solution-bearing base tables directly to browser roles.
revoke select on public.questions from anon, authenticated;
revoke select on public.dsa_problems from anon, authenticated;

create or replace view public.questions_safe as
  select id, category_id, topic_id, prompt, type, options, explanation, difficulty, published
  from public.questions
  where published = true or public.is_admin();

grant select on public.questions_safe to anon, authenticated;

-- Safe published DSA projection. Solution and hidden test cases never reach browser roles.
create or replace view public.dsa_problems_safe as
  select id, topic_id, title, slug, difficulty, pattern, summary, problem, examples, constraints, hint, starter_code, published
  from public.dsa_problems
  where published = true or public.is_admin();

revoke all on public.dsa_problems_safe from public;
grant select on public.dsa_problems_safe to anon, authenticated;


-- ai_messages stores only session_id; ownership is derived through ai_sessions.
drop policy if exists "users own ai messages" on public.ai_messages;
create policy "users own ai messages" on public.ai_messages
  for select using (
    exists (
      select 1 from public.ai_sessions s
      where s.id = ai_messages.session_id and s.user_id = auth.uid()
    )
  );
drop policy if exists "users create ai messages" on public.ai_messages;
create policy "users create ai messages" on public.ai_messages
  for insert with check (
    exists (
      select 1 from public.ai_sessions s
      where s.id = ai_messages.session_id and s.user_id = auth.uid()
    )
    and role in ('user','assistant')
  );
drop policy if exists "admins read ai messages" on public.ai_messages;
create policy "admins read ai messages" on public.ai_messages
  for select using (public.is_admin());

-- Repair platform_settings DDL/policies safely for databases whose original
-- single-file schema had an incomplete CREATE TABLE statement.
create table if not exists public.platform_settings (
  id integer primary key check (id = 1),
  brand text not null default 'Depth Study',
  maintenance boolean not null default false,
  notify_admin boolean not null default true,
  compact boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.platform_settings (id) values (1) on conflict (id) do nothing;
alter table public.platform_settings enable row level security;
drop policy if exists "admins manage platform settings" on public.platform_settings;
create policy "admins manage platform settings" on public.platform_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Spaced repetition
-- ---------------------------------------------------------------------------

create table if not exists public.learning_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete set null,
  topic_id uuid references public.study_topics(id) on delete set null,
  dsa_problem_id uuid references public.dsa_problems(id) on delete set null,
  source_type text not null check (source_type in ('topic','dsa','question','assessment','mission')),
  source_id uuid,
  stability numeric(8,3) not null default 1.0,
  difficulty numeric(6,3) not null default 5.0,
  interval_days int not null default 1 check (interval_days between 0 and 3650),
  repetitions int not null default 0 check (repetitions >= 0),
  lapses int not null default 0 check (lapses >= 0),
  last_reviewed_at timestamptz,
  due_at timestamptz not null default now(),
  last_grade int check (last_grade between 0 and 5),
  quality text check (quality in ('again','hard','good','easy','perfect')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_learning_reviews_user_source
  on public.learning_reviews(user_id, source_type, source_id)
  where source_id is not null;
create index if not exists idx_learning_reviews_due
  on public.learning_reviews(user_id, due_at);

alter table public.learning_reviews enable row level security;
drop policy if exists "users own learning reviews" on public.learning_reviews;
create policy "users own learning reviews" on public.learning_reviews
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Mistake trend analytics
-- ---------------------------------------------------------------------------

create table if not exists public.mistake_trends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  occurrence_count int not null default 0,
  resolved_count int not null default 0,
  severity_score int not null default 0 check (severity_score between 0 and 100),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique(user_id, category)
);
create index if not exists idx_mistake_trends_user
  on public.mistake_trends(user_id, severity_score desc);
alter table public.mistake_trends enable row level security;
drop policy if exists "users own mistake trends" on public.mistake_trends;
create policy "users own mistake trends" on public.mistake_trends
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Content/question quality analytics
-- ---------------------------------------------------------------------------

create table if not exists public.content_quality_metrics (
  content_type text not null check (content_type in ('question','dsa_problem','topic','course')),
  content_id uuid not null,
  attempts int not null default 0,
  successful_attempts int not null default 0,
  average_score numeric(6,2) not null default 0,
  average_time_seconds int not null default 0,
  report_count int not null default 0,
  quality_score int not null default 100 check (quality_score between 0 and 100),
  last_calculated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  primary key(content_type, content_id)
);
create index if not exists idx_content_quality_score
  on public.content_quality_metrics(content_type, quality_score);
alter table public.content_quality_metrics enable row level security;
drop policy if exists "admins manage content quality" on public.content_quality_metrics;
create policy "admins manage content quality" on public.content_quality_metrics
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  content_type text not null,
  content_id uuid not null,
  reason text not null,
  message text not null default '',
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists idx_content_reports_status on public.content_reports(status, created_at desc);
alter table public.content_reports enable row level security;
drop policy if exists "users create content reports" on public.content_reports;
create policy "users create content reports" on public.content_reports
  for insert with check (auth.uid() = user_id);
drop policy if exists "admins manage content reports" on public.content_reports;
create policy "admins manage content reports" on public.content_reports
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Projects / portfolio evidence
-- ---------------------------------------------------------------------------

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  difficulty text not null default 'Intermediate',
  skills jsonb not null default '[]'::jsonb,
  requirements jsonb not null default '[]'::jsonb,
  starter_repo_url text,
  published boolean not null default false,
  premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null default 'active' check (status in ('active','submitted','completed','abandoned')),
  progress int not null default 0 check (progress between 0 and 100),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(user_id, project_id)
);

create table if not exists public.project_submissions (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.project_enrollments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  repo_url text,
  demo_url text,
  notes text not null default '',
  status text not null default 'pending' check (status in ('pending','reviewed','approved','changes_requested')),
  score int check (score between 0 and 100),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists idx_project_enrollments_user on public.project_enrollments(user_id, status);
create index if not exists idx_project_submissions_user on public.project_submissions(user_id, submitted_at desc);

alter table public.projects enable row level security;
alter table public.project_enrollments enable row level security;
alter table public.project_submissions enable row level security;
drop policy if exists "public published projects" on public.projects;
create policy "public published projects" on public.projects for select using (published = true or public.is_admin());
drop policy if exists "users own project enrollments" on public.project_enrollments;
create policy "users own project enrollments" on public.project_enrollments for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "users own project submissions" on public.project_submissions;
create policy "users own project submissions" on public.project_submissions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "admins manage projects" on public.projects;
create policy "admins manage projects" on public.projects for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage project submissions" on public.project_submissions;
create policy "admins manage project submissions" on public.project_submissions for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Interview / placement readiness
-- ---------------------------------------------------------------------------

create table if not exists public.interview_tracks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  track_id uuid references public.interview_tracks(id) on delete cascade,
  category text not null,
  prompt text not null,
  difficulty int not null default 2 check (difficulty between 1 and 5),
  expected_points jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid references public.interview_tracks(id) on delete set null,
  mode text not null default 'practice' check (mode in ('practice','mock')),
  status text not null default 'active' check (status in ('active','submitted','completed')),
  score int check (score between 0 and 100),
  started_at timestamptz not null default now(),
  submitted_at timestamptz
);

create table if not exists public.interview_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.interview_questions(id) on delete cascade,
  answer text not null,
  score int check (score between 0 and 100),
  feedback text not null default '',
  created_at timestamptz not null default now(),
  unique(session_id, question_id)
);

create table if not exists public.placement_readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  overall_score int not null default 0 check (overall_score between 0 and 100),
  dsa_score int not null default 0 check (dsa_score between 0 and 100),
  core_cs_score int not null default 0 check (core_cs_score between 0 and 100),
  projects_score int not null default 0 check (projects_score between 0 and 100),
  assessment_score int not null default 0 check (assessment_score between 0 and 100),
  interview_score int not null default 0 check (interview_score between 0 and 100),
  consistency_score int not null default 0 check (consistency_score between 0 and 100),
  strengths jsonb not null default '[]'::jsonb,
  gaps jsonb not null default '[]'::jsonb,
  calculated_at timestamptz not null default now()
);
create index if not exists idx_placement_readiness_user on public.placement_readiness_snapshots(user_id, calculated_at desc);

alter table public.interview_tracks enable row level security;
alter table public.interview_questions enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.interview_answers enable row level security;
alter table public.placement_readiness_snapshots enable row level security;

drop policy if exists "public published interview tracks" on public.interview_tracks;
create policy "public published interview tracks" on public.interview_tracks for select using (published = true or public.is_admin());
drop policy if exists "public published interview questions" on public.interview_questions;
create policy "public published interview questions" on public.interview_questions for select using (published = true or public.is_admin());
drop policy if exists "users own interview sessions" on public.interview_sessions;
create policy "users own interview sessions" on public.interview_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "users own interview answers" on public.interview_answers;
create policy "users own interview answers" on public.interview_answers for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "users own readiness" on public.placement_readiness_snapshots;
create policy "users own readiness" on public.placement_readiness_snapshots for select using (user_id = auth.uid());
drop policy if exists "admins manage interview content" on public.interview_tracks;
create policy "admins manage interview content" on public.interview_tracks for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage interview questions" on public.interview_questions;
create policy "admins manage interview questions" on public.interview_questions for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Organization / college workspace
-- ---------------------------------------------------------------------------

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  kind text not null default 'college' check (kind in ('college','company','institute')),
  status text not null default 'active' check (status in ('active','suspended')),
  plan text not null default 'business' check (plan in ('business','enterprise')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','mentor','student')),
  joined_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index if not exists idx_org_members_user on public.organization_members(user_id, role);

create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text,
  role text not null check (role in ('admin','mentor','student')),
  token_hash text not null unique,
  created_by uuid not null references auth.users(id) on delete restrict,
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz
);
create index if not exists idx_org_invites_org on public.organization_invites(organization_id, created_at desc);
create index if not exists idx_org_invites_email on public.organization_invites(email);

create table if not exists public.organization_audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_org_audit_org_created on public.organization_audit_logs(organization_id, created_at desc);


create table if not exists public.organization_departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique(organization_id, name)
);

create table if not exists public.organization_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.organization_departments(id) on delete set null,
  name text not null,
  start_year int,
  end_year int,
  created_at timestamptz not null default now(),
  unique(organization_id, name)
);

create table if not exists public.batch_members (
  batch_id uuid not null references public.organization_batches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(batch_id, user_id)
);

create table if not exists public.organization_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  batch_id uuid references public.organization_batches(id) on delete cascade,
  title text not null,
  description text not null default '',
  target_type text not null check (target_type in ('course','topic','test','dsa','project','skill')),
  target_id uuid,
  due_at timestamptz,
  status text not null default 'draft' check (status in ('draft','published','closed')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.assignment_attempts (
  assignment_id uuid not null references public.organization_assignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score int check (score between 0 and 100),
  status text not null default 'started' check (status in ('started','submitted','reviewed')),
  submitted_at timestamptz,
  primary key(assignment_id, user_id)
);

create table if not exists public.organization_skill_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  batch_id uuid references public.organization_batches(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  average_score int not null default 0 check (average_score between 0 and 100),
  learner_count int not null default 0,
  calculated_at timestamptz not null default now()
);

create table if not exists public.organization_placement_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  batch_id uuid references public.organization_batches(id) on delete cascade,
  readiness_score int not null default 0 check (readiness_score between 0 and 100),
  learner_count int not null default 0,
  strengths jsonb not null default '[]'::jsonb,
  gaps jsonb not null default '[]'::jsonb,
  calculated_at timestamptz not null default now()
);

create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = target_org and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_manager(target_org uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.role in ('owner','admin','mentor')
  );
$$;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_departments enable row level security;
alter table public.organization_batches enable row level security;
alter table public.batch_members enable row level security;
alter table public.organization_assignments enable row level security;
alter table public.assignment_attempts enable row level security;
alter table public.organization_skill_snapshots enable row level security;
alter table public.organization_placement_snapshots enable row level security;

drop policy if exists "org members read organization" on public.organizations;
create policy "org members read organization" on public.organizations for select using (public.is_org_member(id) or public.is_admin());
drop policy if exists "org managers update organization" on public.organizations;
create policy "org managers update organization" on public.organizations for update using (public.is_org_manager(id) or public.is_admin()) with check (public.is_org_manager(id) or public.is_admin());
drop policy if exists "org members read memberships" on public.organization_members;
create policy "org members read memberships" on public.organization_members for select using (user_id = auth.uid() or public.is_org_manager(organization_id) or public.is_admin());
drop policy if exists "admins read organization invites" on public.organization_invites;
alter table public.organization_invites enable row level security;
create policy "admins read organization invites" on public.organization_invites for select using (public.is_org_manager(organization_id) or public.is_admin());

drop policy if exists "admins manage organization invites" on public.organization_invites;
create policy "admins manage organization invites" on public.organization_invites for all using (public.is_admin() or exists (select 1 from public.organization_members m where m.organization_id = organization_invites.organization_id and m.user_id = auth.uid() and m.role in ('owner','admin'))) with check (public.is_admin() or exists (select 1 from public.organization_members m where m.organization_id = organization_invites.organization_id and m.user_id = auth.uid() and m.role in ('owner','admin')));

alter table public.organization_audit_logs enable row level security;
drop policy if exists "org managers read audit" on public.organization_audit_logs;
create policy "org managers read audit" on public.organization_audit_logs for select using (public.is_org_manager(organization_id) or public.is_admin());
drop policy if exists "org managers write memberships" on public.organization_members;
create policy "org managers write memberships" on public.organization_members for all using (
  public.is_admin() or exists (select 1 from public.organization_members actor where actor.organization_id = organization_members.organization_id and actor.user_id = auth.uid() and (actor.role = 'owner' or actor.role = 'admin'))
) with check (
  public.is_admin() or exists (select 1 from public.organization_members actor where actor.organization_id = organization_members.organization_id and actor.user_id = auth.uid() and ((actor.role = 'owner') or (actor.role = 'admin' and role in ('mentor','student'))))
);
drop policy if exists "org members read departments" on public.organization_departments;
create policy "org members read departments" on public.organization_departments for select using (public.is_org_member(organization_id) or public.is_admin());
drop policy if exists "org managers write departments" on public.organization_departments;
create policy "org managers write departments" on public.organization_departments for all using (public.is_org_manager(organization_id) or public.is_admin()) with check (public.is_org_manager(organization_id) or public.is_admin());
drop policy if exists "org members read batches" on public.organization_batches;
create policy "org members read batches" on public.organization_batches for select using (public.is_org_member(organization_id) or public.is_admin());
drop policy if exists "org managers write batches" on public.organization_batches;
create policy "org managers write batches" on public.organization_batches for all using (public.is_org_manager(organization_id) or public.is_admin()) with check (public.is_org_manager(organization_id) or public.is_admin());
drop policy if exists "batch members access" on public.batch_members;
create policy "batch members access" on public.batch_members for all using (
  user_id = auth.uid()
  or exists (select 1 from public.organization_batches b where b.id = batch_members.batch_id and public.is_org_manager(b.organization_id))
  or public.is_admin()
) with check (
  user_id = auth.uid()
  or exists (select 1 from public.organization_batches b where b.id = batch_members.batch_id and public.is_org_manager(b.organization_id))
  or public.is_admin()
);
drop policy if exists "org members read assignments" on public.organization_assignments;
create policy "org members read assignments" on public.organization_assignments for select using (public.is_org_member(organization_id) or public.is_admin());
drop policy if exists "org managers write assignments" on public.organization_assignments;
create policy "org managers write assignments" on public.organization_assignments for all using (public.is_org_manager(organization_id) or public.is_admin()) with check (public.is_org_manager(organization_id) or public.is_admin());
drop policy if exists "assignment attempts own" on public.assignment_attempts;
create policy "assignment attempts own" on public.assignment_attempts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "org managers read attempts" on public.assignment_attempts;
create policy "org managers read attempts" on public.assignment_attempts for select using (
  exists (
    select 1 from public.organization_assignments a
    where a.id = assignment_attempts.assignment_id and public.is_org_manager(a.organization_id)
  ) or public.is_admin()
);
drop policy if exists "org managers read skill snapshots" on public.organization_skill_snapshots;
create policy "org managers read skill snapshots" on public.organization_skill_snapshots for select using (public.is_org_manager(organization_id) or public.is_admin());
drop policy if exists "org managers read placement snapshots" on public.organization_placement_snapshots;
create policy "org managers read placement snapshots" on public.organization_placement_snapshots for select using (public.is_org_manager(organization_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- Feature entitlements / monetization foundation (no payment provider yet)
-- ---------------------------------------------------------------------------

create table if not exists public.user_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  status text not null default 'active' check (status in ('active','past_due','canceled')),
  current_period_end timestamptz,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_entitlements (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  plan text not null default 'business' check (plan in ('business','enterprise')),
  status text not null default 'active' check (status in ('active','past_due','canceled')),
  seats_limit int not null default 100 check (seats_limit > 0),
  current_period_end timestamptz,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  updated_at timestamptz not null default now()
);

alter table public.user_entitlements enable row level security;
alter table public.organization_entitlements enable row level security;
drop policy if exists "users own entitlements" on public.user_entitlements;
create policy "users own entitlements" on public.user_entitlements for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "admins manage user entitlements" on public.user_entitlements;
create policy "admins manage user entitlements" on public.user_entitlements for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "org managers read entitlements" on public.organization_entitlements;
create policy "org managers read entitlements" on public.organization_entitlements for select using (public.is_org_manager(organization_id) or public.is_admin());
drop policy if exists "admins manage organization entitlements" on public.organization_entitlements;
create policy "admins manage organization entitlements" on public.organization_entitlements for all using (public.is_admin()) with check (public.is_admin());

-- Helpful performance indexes
create index if not exists idx_user_skill_mastery_user on public.user_skill_mastery(user_id, mastery_score desc);
create index if not exists idx_skill_events_user_created on public.skill_events(user_id, created_at desc);
create index if not exists idx_mistake_logs_user_created on public.mistake_logs(user_id, created_at desc);
create index if not exists idx_learning_missions_date on public.learning_missions(user_id, mission_date desc);
create index if not exists idx_test_attempts_user on public.test_attempts(user_id, started_at desc);
create index if not exists idx_dsa_submissions_user on public.dsa_submissions(user_id, created_at desc);

-- Seed basic interview tracks.
insert into public.interview_tracks (name, slug, description, published)
values
  ('Software Engineering Basics', 'software-engineering-basics', 'Core technical interview practice.', true),
  ('DSA Interview', 'dsa-interview', 'Data structures and algorithms interview practice.', true),
  ('Frontend Interview', 'frontend-interview', 'JavaScript, React and browser fundamentals.', true)
on conflict (slug) do nothing;

insert into public.projects (title, slug, description, difficulty, skills, requirements, published, premium)
values
  ('React Analytics Dashboard', 'react-analytics-dashboard', 'Build a responsive analytics dashboard with reusable React components, filters and charts.', 'Intermediate', '["React","JavaScript","UI"]'::jsonb, '["Responsive layout","Accessible components","Data visualization"]'::jsonb, true, false),
  ('DSA Visualizer', 'dsa-visualizer', 'Create visual explanations for arrays, stacks, queues and graph traversal.', 'Intermediate', '["DSA","JavaScript"]'::jsonb, '["Interactive controls","Complexity explanation","Mobile support"]'::jsonb, true, false),
  ('Full-stack Placement Tracker', 'fullstack-placement-tracker', 'Build a full-stack tracker for applications, interview rounds and skill readiness.', 'Advanced', '["Next.js","Supabase","SQL"]'::jsonb, '["Auth","CRUD","Analytics","Deployment"]'::jsonb, true, true)
on conflict (slug) do nothing;

insert into public.interview_questions (track_id, category, prompt, difficulty, expected_points, published)
select t.id, 'DSA', 'Explain how you would approach finding the first repeated element in an array and discuss time/space trade-offs.', 2, '["Correct approach","Complexity","Edge cases"]'::jsonb, true
from public.interview_tracks t where t.slug = 'dsa-interview'
and not exists (select 1 from public.interview_questions q where q.prompt = 'Explain how you would approach finding the first repeated element in an array and discuss time/space trade-offs.');

insert into public.interview_questions (track_id, category, prompt, difficulty, expected_points, published)
select t.id, 'Frontend', 'What is the difference between controlled and uncontrolled inputs in React, and when would you use each?', 2, '["Definition","Trade-offs","Example"]'::jsonb, true
from public.interview_tracks t where t.slug = 'frontend-interview'
and not exists (select 1 from public.interview_questions q where q.prompt = 'What is the difference between controlled and uncontrolled inputs in React, and when would you use each?');

insert into public.interview_questions (track_id, category, prompt, difficulty, expected_points, published)
select t.id, 'Core CS', 'Explain a database index and one situation where an index can make a query slower.', 2, '["Index concept","Read performance","Write trade-off"]'::jsonb, true
from public.interview_tracks t where t.slug = 'software-engineering-basics'
and not exists (select 1 from public.interview_questions q where q.prompt = 'Explain a database index and one situation where an index can make a query slower.');


-- FINAL PRODUCTION HARDENING

alter table public.mistake_categories enable row level security;
drop policy if exists "public mistake categories" on public.mistake_categories;
create policy "public mistake categories" on public.mistake_categories for select using (true);
drop policy if exists "admins manage mistake categories" on public.mistake_categories;
create policy "admins manage mistake categories" on public.mistake_categories for all using (public.is_admin()) with check (public.is_admin());

-- Never expose interview scoring rubrics to client-side queries.
create or replace view public.interview_questions_safe as
select id, track_id, category, prompt, difficulty, published, created_at
from public.interview_questions
where published = true;
revoke all on public.interview_questions from anon, authenticated;
grant select on public.interview_questions_safe to anon, authenticated;

-- Organization creation is platform-controlled; normal learners cannot create tenants.
drop policy if exists "platform admins create organizations" on public.organizations;
create policy "platform admins create organizations" on public.organizations for insert with check (public.is_admin());

-- Helpful uniqueness and lookup indexes.
create index if not exists idx_org_assignments_batch on public.organization_assignments(batch_id, status, due_at);
create index if not exists idx_batch_members_user on public.batch_members(user_id, batch_id);
create index if not exists idx_interview_answers_session on public.interview_answers(session_id, created_at);
create index if not exists idx_learning_reviews_due on public.learning_reviews(user_id, due_at);
create index if not exists idx_project_submissions_project on public.project_submissions(project_id, status, submitted_at desc);


-- ---------------------------------------------------------------------------
-- Project delivery depth: milestones + learner progress
-- ---------------------------------------------------------------------------
create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text not null default '',
  sort_order int not null default 0,
  target_minutes int not null default 30 check (target_minutes > 0),
  required boolean not null default true,
  created_at timestamptz not null default now(),
  unique(project_id, sort_order)
);

create table if not exists public.project_milestone_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  milestone_id uuid not null references public.project_milestones(id) on delete cascade,
  enrollment_id uuid not null references public.project_enrollments(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','active','completed')),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(user_id, milestone_id)
);

alter table public.project_milestones enable row level security;
alter table public.project_milestone_progress enable row level security;

drop policy if exists "public project milestones" on public.project_milestones;
create policy "public project milestones" on public.project_milestones for select using (
  exists(select 1 from public.projects p where p.id = project_id and (p.published = true or public.is_admin()))
);
drop policy if exists "admins manage project milestones" on public.project_milestones;
create policy "admins manage project milestones" on public.project_milestones for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "users own project milestone progress" on public.project_milestone_progress;
create policy "users own project milestone progress" on public.project_milestone_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "admins read project milestone progress" on public.project_milestone_progress;
create policy "admins read project milestone progress" on public.project_milestone_progress for select using (public.is_admin());

create index if not exists idx_project_milestones_project on public.project_milestones(project_id, sort_order);
create index if not exists idx_project_milestone_progress_enrollment on public.project_milestone_progress(enrollment_id, status);

insert into public.project_milestones(project_id,title,description,sort_order,target_minutes,required)
select p.id, m.title, m.description, m.sort_order, m.target_minutes, true
from public.projects p
cross join (values
  ('Plan & scope','Define the architecture, data model and acceptance criteria.',1,30),
  ('Build core','Implement the primary product workflow and validation.',2,90),
  ('Polish & test','Responsive UI, error states, accessibility and tests.',3,60),
  ('Ship & prove','Deploy, document and submit evidence.',4,45)
) as m(title,description,sort_order,target_minutes)
where not exists (select 1 from public.project_milestones pm where pm.project_id = p.id);


-- Final product hardening: prevent client writes to derived review/proof metrics and expose only safe interview fields.
revoke all on public.interview_questions from anon, authenticated;
grant select on public.interview_questions_safe to anon, authenticated;

create unique index if not exists uq_content_quality_metric on public.content_quality_metrics(content_type, content_id);
create index if not exists idx_project_enrollment_user_project on public.project_enrollments(user_id, project_id);
create index if not exists idx_interview_sessions_user_status on public.interview_sessions(user_id, status, submitted_at desc);
create index if not exists idx_mistake_trends_user_severity on public.mistake_trends(user_id, severity_score desc);


-- REVOKE ORGANIZATION MANAGEMENT WRITES FROM BROWSER ROLES.
-- All organization management mutations go through authenticated server APIs.
revoke insert, update, delete on public.organization_members from anon, authenticated;
revoke insert, update, delete on public.organizations from anon, authenticated;
revoke insert, update, delete on public.organization_departments from anon, authenticated;
revoke insert, update, delete on public.organization_batches from anon, authenticated;
revoke insert, update, delete on public.organization_assignments from anon, authenticated;
revoke insert, update, delete on public.organization_invites from anon, authenticated;
revoke insert, update, delete on public.organization_audit_logs from anon, authenticated;
revoke insert, update, delete on public.organization_placement_snapshots from anon, authenticated;
revoke insert, update, delete on public.organization_skill_snapshots from anon, authenticated;
revoke insert, update, delete on public.dsa_problems from anon, authenticated;
revoke select on public.dsa_problems from anon, authenticated;
revoke select on public.questions from anon, authenticated;

create index if not exists idx_org_invites_token_hash on public.organization_invites(token_hash);
create index if not exists idx_assignment_attempts_assignment_status on public.assignment_attempts(assignment_id, status, submitted_at desc);
