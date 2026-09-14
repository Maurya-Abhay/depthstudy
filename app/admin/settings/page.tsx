'use client';

import { useEffect, useState } from 'react';
import {
  Settings,
  Bell,
  Palette,
  ShieldCheck,
  Save,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

import { AdminShell } from '@/app/admin/_components/admin-shell';
import { useToast } from '@/components/ui/toast-provider';

type SettingsState = {
  brand: string;
  maintenance: boolean;
  notifyAdmin: boolean;
  compact: boolean;
};

const defaults: SettingsState = {
  brand: 'Depth Study',
  maintenance: false,
  notifyAdmin: true,
  compact: false,
};

export default function SettingsPage() {
  const { showToast } = useToast();

  const [settings, setSettings] = useState<SettingsState>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings', {
          method: 'GET',
          cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || 'Settings could not be loaded.'
          );
        }

        if (active && data?.settings) {
          setSettings({
            brand:
              typeof data.settings.brand === 'string'
                ? data.settings.brand
                : defaults.brand,
            maintenance: Boolean(data.settings.maintenance),
            notifyAdmin: Boolean(data.settings.notifyAdmin),
            compact: Boolean(data.settings.compact),
          });
        }
      } catch (error) {
        if (!active) return;

        showToast(
          'error',
          error instanceof Error
            ? error.message
            : 'Settings could not be loaded.'
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadSettings();

    return () => {
      active = false;
    };
  }, [showToast]);

  const updateSetting = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const save = async () => {
    if (saving || loading) return;

    const brand = settings.brand.trim();

    if (!brand) {
      showToast('error', 'Platform name cannot be empty.');
      return;
    }

    if (brand.length > 80) {
      showToast(
        'error',
        'Platform name must be 80 characters or less.'
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Silent-Toast': '1',
        },
        body: JSON.stringify({
          ...settings,
          brand,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || 'Settings could not be saved.'
        );
      }

      if (data?.settings) {
        setSettings({
          brand:
            typeof data.settings.brand === 'string'
              ? data.settings.brand
              : brand,
          maintenance: Boolean(data.settings.maintenance),
          notifyAdmin: Boolean(data.settings.notifyAdmin),
          compact: Boolean(data.settings.compact),
        });
      } else {
        setSettings((current) => ({
          ...current,
          brand,
        }));
      }

      showToast('success', 'Platform settings saved.');
    } catch (error) {
      showToast(
        'error',
        error instanceof Error
          ? error.message
          : 'Settings could not be saved.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto space-y-6 font-sans text-xs pb-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0d111c] p-4 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm">
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              Settings
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Manage shared platform controls and administrator preferences.
            </p>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving || loading}
            aria-busy={saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[11px] shrink-0"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saving ? 'Saving…' : 'Save Settings'}</span>
          </button>
        </div>

        {/* Settings Sections Grid */}
        <div className="space-y-4">
          {/* Brand Card */}
          <section className="bg-white dark:bg-[#0d111c] p-5 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-sm font-bold text-zinc-900 dark:text-white block">
                  Brand Identity
                </strong>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                  Identity shown across the platform navbar and metadata.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <label className="block space-y-1.5">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 text-[11px]">
                  Platform Name
                </span>
                <input
                  type="text"
                  value={settings.brand}
                  maxLength={80}
                  disabled={loading || saving}
                  onChange={(event) =>
                    updateSetting('brand', event.target.value)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 text-[11px]"
                  placeholder="e.g. Depth Study"
                />
              </label>
            </div>
          </section>

          {/* Notifications Card */}
          <section className="bg-white dark:bg-[#0d111c] p-5 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-sm font-bold text-zinc-900 dark:text-white block">
                  Notifications
                </strong>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                  Configure administrator notification preferences.
                </p>
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer">
                <span className="font-medium text-zinc-700 dark:text-zinc-200 text-[11px]">
                  Show admin notifications
                </span>
                <input
                  type="checkbox"
                  checked={settings.notifyAdmin}
                  disabled={loading || saving}
                  onChange={(event) =>
                    updateSetting('notifyAdmin', event.target.checked)
                  }
                  className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 transition-all cursor-pointer"
                />
              </label>
            </div>
          </section>

          {/* Safety & Operational Controls Card */}
          <section className="bg-white dark:bg-[#0d111c] p-5 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-sm font-bold text-zinc-900 dark:text-white block">
                  Safety & Density
                </strong>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                  Shared operational controls and UI display preferences.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer">
                <div>
                  <span className="font-medium text-zinc-700 dark:text-zinc-200 block text-[11px]">
                    Maintenance mode
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Restrict platform access during updates.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.maintenance}
                  disabled={loading || saving}
                  onChange={(event) =>
                    updateSetting('maintenance', event.target.checked)
                  }
                  className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 transition-all cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer">
                <div>
                  <span className="font-medium text-zinc-700 dark:text-zinc-200 block text-[11px]">
                    Prefer compact admin density
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Reduce padding across admin data tables and panels.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.compact}
                  disabled={loading || saving}
                  onChange={(event) =>
                    updateSetting('compact', event.target.checked)
                  }
                  className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 transition-all cursor-pointer"
                />
              </label>
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}