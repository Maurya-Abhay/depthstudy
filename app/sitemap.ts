import type { MetadataRoute } from 'next';
import { createServerSupabaseClient } from '@/services/supabase-server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  const staticRoutes = ['/', '/study', '/study/courses', '/about', '/login', '/register', '/terms', '/pricing', '/privacy', '/offline'];
  let urls: MetadataRoute.Sitemap = staticRoutes.map((route) => ({ url: `${base}${route}`, changeFrequency: route === '/' ? 'daily' : 'weekly', priority: route === '/' ? 1 : 0.7 }));
  try {
    const supabase = await createServerSupabaseClient();
    const [{ data: topics }, { data: categories }, { data: courses }] = await Promise.all([
      supabase.from('study_topics').select('slug,updated_at').eq('published', true),
      supabase.from('study_categories').select('slug,updated_at').eq('published', true),
      supabase.from('courses').select('slug,updated_at').eq('published', true),
    ]);
    urls = [
      ...urls,
      ...(categories ?? []).map((x) => ({ url: `${base}/study/category/${x.slug}`, changeFrequency: 'weekly' as const, priority: 0.8, ...(x.updated_at ? { lastModified: x.updated_at } : {}) })),
      ...(topics ?? []).map((x) => ({ url: `${base}/study/topic/${x.slug}`, changeFrequency: 'weekly' as const, priority: 0.8, ...(x.updated_at ? { lastModified: x.updated_at } : {}) })),
      ...(courses ?? []).map((x) => ({ url: `${base}/study/courses/${x.slug}`, changeFrequency: 'weekly' as const, priority: 0.9, ...(x.updated_at ? { lastModified: x.updated_at } : {}) })),
    ];
  } catch { /* Keep the static sitemap available when Supabase is offline. */ }
  return urls;
}
