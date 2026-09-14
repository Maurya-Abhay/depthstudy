import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/dashboard', destination: '/user' },
        { source: '/dashboard/:path*', destination: '/user/:path*' },
        { source: '/profile', destination: '/user/profile' },
        { source: '/dsa', destination: '/user/dsa' },
        { source: '/dsa/:path*', destination: '/user/dsa/:path*' },
        { source: '/tests/:path*', destination: '/user/tests/:path*' },
        { source: '/study', destination: '/public/study' },
        { source: '/study/:path*', destination: '/public/study/:path*' },
        { source: '/privacy', destination: '/public/privacy' },
        { source: '/about', destination: '/public/about' },
        { source: '/terms', destination: '/public/terms' },
        { source: '/offline', destination: '/public/offline' },
        { source: '/login', destination: '/auth/login' },
        { source: '/register', destination: '/auth/register' },
        { source: '/forgot-password', destination: '/auth/forgot-password' },
        { source: '/reset-password', destination: '/auth/reset-password' },
        { source: '/', destination: '/public' },
      ],
    };
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
