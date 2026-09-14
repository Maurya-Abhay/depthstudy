import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { ConfirmProvider } from '@/components/ui/confirm-dialog';
import { ToastProvider } from '@/components/ui/toast-provider';
import { PwaRegister } from '@/components/ui/pwa-register';
import { InstallPrompt } from '@/components/ui/install-prompt';

export const metadata: Metadata = {
  title: 'Depth Study — Learn, Practice, Master',
  description:
    'A dynamic learning platform with courses, topic workspaces, tests and DSA practice.',
  icons: { icon: '/icon.svg', apple: '/apple-touch-icon.png' },
  manifest: '/manifest.webmanifest',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  ),
  openGraph: {
    type: 'website',
    title: 'Depth Study — Learn, Practice, Master',
    description:
      'Focused learning for courses, topics, tests and coding practice.',
    siteName: 'Depth Study',
    images: [
      {
        url: '/study-hero.jpg',
        width: 1200,
        height: 630,
        alt: 'Depth Study learning workspace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Depth Study — Learn, Practice, Master',
    description:
      'Focused learning for courses, topics, tests and coding practice.',
    images: ['/study-hero.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0f19',
  colorScheme: 'dark light',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply saved theme BEFORE first paint — no dark flash, toggle works instantly */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('depth-study-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#0b0f19] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <ThemeProvider>
          <ConfirmProvider>
            <ToastProvider>
              <PwaRegister />
              {children}
              <InstallPrompt />
            </ToastProvider>
          </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}