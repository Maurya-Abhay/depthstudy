import { ShieldCheck, FileText } from 'lucide-react';

export const metadata = {
  title: 'Terms and Conditions | Depth Study',
  description: 'Terms for using the Depth Study learning platform.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0d1117] dark:text-slate-100">
      <div className="mx-auto max-w-4xl px-2 py-4 sm:px-3 lg:px-4">
        
        {/* Header Section */}
        <header className="mb-8 border-b border-slate-200/80 pb-6 dark:border-slate-800">
          <h1 className="mt-3 text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
            Terms and Conditions
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
                Using Depth Study
              </h2>
              <p className="mt-2 leading-relaxed">
                Depth Study provides educational content, courses, practice problems, and progress tracking tools. By using the platform, you agree to use it lawfully and adhere to these terms.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Your Account
              </h2>
              <p className="mt-2 leading-relaxed">
                You are responsible for keeping your login credentials confidential and for all activities performed under your account. Please provide accurate information and notify an administrator immediately if you suspect unauthorized access.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Learning Content
              </h2>
              <p className="mt-2 leading-relaxed">
                Depth Study content is provided for learning and practice purposes. You may use it for personal educational use, but you may not copy, resell, redistribute, or present the content as your own without explicit permission.
              </p>
              <p className="mt-2 leading-relaxed">
                Practice results, certificates, and progress records depend on platform availability and accuracy.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Acceptable Behavior
              </h2>
              <ul className="mt-3 space-y-2 pl-4 list-disc marker:text-indigo-600 dark:marker:text-indigo-400">
                <li>Do not attempt to bypass authentication or access another user&apos;s data.</li>
                <li>Do not upload malicious code, harmful content, or material you do not have permission to use.</li>
                <li>Do not abuse, overload, scrape, or disrupt the service.</li>
                <li>Do not use certificates or assessment results deceptively.</li>
              </ul>
            </div>

            <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Availability and Changes
              </h2>
              <p className="mt-2 leading-relaxed">
                Features, content, and system availability may change during platform maintenance. We reserve the right to suspend access when necessary for security, system maintenance, or term violations.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Disclaimer
              </h2>
              <p className="mt-2 leading-relaxed">
                Depth Study is an educational tool and does not guarantee specific academic, employment, or examination outcomes. Use the content using your own judgment and verify critical information independently.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Contact Us
              </h2>
              <p className="mt-2 leading-relaxed">
                Questions about these terms should be directed to the Depth Study administrator or support contact provided by your organization.
              </p>
            </div>

          </section>

        </article>
      </div>
    </main>
  );
}