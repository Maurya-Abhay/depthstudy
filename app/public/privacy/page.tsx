import { Shield, Lock } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Depth Study',
  description: 'How Depth Study handles account, learning and usage information.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0d1117] dark:text-slate-100">
      <div className="mx-auto max-w-4xl px-2 py-5 sm:px-3 lg:px-4">
        
        {/* Header Section */}
        <header className="mb-8 border-b border-slate-200/80 pb-6 dark:border-slate-800">
          <h1 className="mt-3 text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Last updated: September 6, 2026
          </p>
        </header>

        {/* Content Card */}
        <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-[#161b22] sm:p-8">
          <section className="space-y-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                What We Collect
              </h2>
              <p className="mt-2 leading-relaxed">
                Depth Study collects the information needed to provide the learning service, such as your name, email address, account details, course progress, notes, bookmarks, schedules, and test activity.
              </p>
              <p className="mt-2 leading-relaxed">
                Public pages can be viewed without an account. We do not need personal information to show published learning content.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                How We Use Information
              </h2>
              <ul className="mt-3 space-y-2 pl-4 list-disc marker:text-indigo-600 dark:marker:text-indigo-400">
                <li>To sign you in and keep your account secure.</li>
                <li>To save progress, notes, schedules, bookmarks, and certificates.</li>
                <li>To provide course, test, and coding features you choose to use.</li>
                <li>To maintain, troubleshoot, and improve the platform.</li>
              </ul>
            </div>

            <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Sharing and Storage
              </h2>
              <p className="mt-2 leading-relaxed">
                We do not sell your personal information. Account and learning data is stored with our service providers only as needed to operate Depth Study, authenticate users, and store application data.
              </p>
              <p className="mt-2 leading-relaxed">
                Your private learning data is intended to be available only to you and authorized administrators who need it to operate the service.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock size={16} className="text-indigo-500" /> Cookies and Sessions
              </h2>
              <p className="mt-2 leading-relaxed">
                Depth Study uses authentication cookies and session storage required to keep you signed in and protect private pages. Optional analytics or advertising cookies are not required for the core learning experience.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Your Choices
              </h2>
              <p className="mt-2 leading-relaxed">
                You can stop using the service at any time. For account-data questions or deletion requests, contact the Depth Study administrator through the account support channel provided by your organization.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Policy Updates
              </h2>
              <p className="mt-2 leading-relaxed">
                We may update this policy when the service changes. The latest version will always be available on this page with its update date.
              </p>
            </div>

          </section>
        </article>
      </div>
    </main>
  );
}