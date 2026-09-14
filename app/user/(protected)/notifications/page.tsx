import { Bell, Circle, Sparkles, Inbox } from 'lucide-react';
import { UserShell } from '@/app/user/(protected)/_components/user-shell';
import { NotificationsList } from '@/app/user/(protected)/_components/notifications-list';
import { createServerSupabaseClient } from '@/services/supabase-server';

export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('notifications')
    .select('id,title,message,kind,created_at,read_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const notifications = data ?? [];
  const unread = notifications.filter((item) => !item.read_at).length;

  return (
    <UserShell>
      <div className="mx-auto max-w-7xl space-y-3 text-slate-900 dark:text-slate-100">
        {/* Compact Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 dark:border-slate-800/80">
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Notifications
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Useful updates about your learning activity and account.
            </p>
          </div>
          {unread > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
              <Sparkles size={10} /> {unread} Unread
            </span>
          )}
        </div>

        {/* Compact Stats Summary */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
              <Bell size={16} />
            </span>
            <div>
              <div className="text-sm font-bold leading-none text-slate-900 dark:text-white">
                {notifications.length}
              </div>
              <div className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Total Updates
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
              <Circle size={14} className="fill-amber-500/20 dark:fill-amber-400/20" />
            </span>
            <div>
              <div className="text-sm font-bold leading-none text-slate-900 dark:text-white">
                {unread}
              </div>
              <div className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Unread Updates
              </div>
            </div>
          </div>
        </div>

        {/* Compact Notifications List Container */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800/60">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                Inbox Activity
              </h2>
            </div>
          </div>

          <NotificationsList initial={notifications} />
        </div>
      </div>
    </UserShell>
  );
}