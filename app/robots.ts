import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: ['/'], disallow: ['/admin/', '/dashboard/', '/profile/', '/api/', '/tests/', '/dsa/'] }], sitemap: '/sitemap.xml' };
}
