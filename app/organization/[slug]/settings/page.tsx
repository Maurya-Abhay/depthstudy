'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  User, 
  FileText, 
  Save, 
  CheckCircle2, 
  Clock, 
  Sliders,
  Edit2,
  X
} from 'lucide-react';
import { 
  PageHeader, 
  Message, 
  Loading, 
  inputCls, 
  buttonCls, 
  borderCls, 
  apiPost, 
  useOrgFetch 
} from '../../_components/portal-ui';

type Organization = {
  name?: string;
  kind?: string;
  status?: string;
  phone?: string;
  official_email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  contact_person?: string;
  notes?: string;
  [key: string]: any;
};

type Provisioning = {
  status?: string;
  current_step?: number;
  total_steps?: number;
  onboarding_completed?: boolean;
};

type Data = { 
  organization: Organization; 
  provisioning: Provisioning 
};

export default function SettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { ctx, data, loading, error, reload } = useOrgFetch<Data>(slug, '/api/organization/settings');
  
  const [busy, setBusy] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [msg, setMsg] = useState<{ t: string; e: boolean } | null>(null);
  
  // Form state
  const [form, setForm] = useState<Record<string, string>>({});

  if (ctx.loading || loading) return <Loading />;
  if (ctx.error || error) return <Message text={ctx.error || error} error />;

  const canManage = ctx.role === 'owner' || ctx.role === 'admin';
  const org = data?.organization ?? {};
  const provisioning = data?.provisioning ?? {};

  const currentStep = provisioning.current_step ?? 1;
  const totalSteps = provisioning.total_steps ?? 11;
  const progressPercent = Math.min(Math.round((currentStep / totalSteps) * 100), 100);

  const fields = [
    { key: 'phone', label: 'Phone Number', icon: Phone, placeholder: '+1 (555) 000-0000' },
    { key: 'official_email', label: 'Official Email', icon: Mail, placeholder: 'contact@org.com' },
    { key: 'website', label: 'Website URL', icon: Globe, placeholder: 'https://org.com' },
    { key: 'contact_person', label: 'Contact Person', icon: User, placeholder: 'Full Name' },
    { key: 'address', label: 'Street Address', icon: MapPin, placeholder: '123 Main St' },
    { key: 'city', label: 'City', icon: MapPin, placeholder: 'City' },
    { key: 'state', label: 'State / Province', icon: MapPin, placeholder: 'State' },
    { key: 'country', label: 'Country', icon: MapPin, placeholder: 'Country' },
    { key: 'postal_code', label: 'Postal Code', icon: MapPin, placeholder: 'Zip Code' },
    { key: 'notes', label: 'Additional Notes', icon: FileText, placeholder: 'Internal remarks...' }
  ] as const;

  const startEdit = () => {
    // Populate form with existing org data
    const initialForm: Record<string, string> = {};
    fields.forEach(({ key }) => {
      initialForm[key] = org[key] ?? '';
    });
    setForm(initialForm);
    setIsEditing(true);
    setMsg(null);
  };

  const cancelEdit = () => {
    setForm({});
    setIsEditing(false);
  };

  async function save() {
    if (!ctx.orgId) return;
    setBusy(true); 
    setMsg(null);
    try { 
      await apiPost(ctx.orgId, '/api/organization/settings', form); 
      setMsg({ t: 'Organization profile updated successfully.', e: false }); 
      setIsEditing(false);
      await reload(); 
    } catch (e) { 
      setMsg({ t: e instanceof Error ? e.message : 'Failed to save settings.', e: true }); 
    } finally { 
      setBusy(false); 
    }
  }

  return (
    <div className="space-y-5 font-sans text-xs antialiased">
      {/* Page Header */}
      <PageHeader 
        title="Organization Settings" 
        subtitle={org?.name ? `${org.name} · ${org.kind || 'Institution'} · ${org.status || 'Active'}` : 'Manage organization profile and setup parameters'} 
        actions={
          canManage && !isEditing ? (
            <button onClick={startEdit} className={buttonCls}>
              <Edit2 size={13} />
              <span>Edit Profile</span>
            </button>
          ) : undefined
        }
      />

      {/* Message Banner */}
      <Message text={msg?.t ?? null} error={msg?.e ?? false} />

      {/* Setup & Provisioning Status */}
      <section className={`${borderCls} p-4 bg-slate-50/50 dark:bg-slate-900/40 space-y-3`}>
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">Setup & Provisioning Status</h2>
          </div>

          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            provisioning.onboarding_completed 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
          }`}>
            {provisioning.onboarding_completed ? <CheckCircle2 size={10} /> : <Clock size={10} />}
            {provisioning.onboarding_completed ? 'Onboarding Complete' : 'In Progress'}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Provisioning Status</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">
              {provisioning.status || 'Operational'}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Onboarding Step</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Step {currentStep} of {totalSteps}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Completion Progress</p>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{progressPercent}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div 
                className="h-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-500" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Organization Profile Section */}
      <section className={`${borderCls} p-4 space-y-4 bg-white dark:bg-slate-900`}>
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 dark:border-slate-800">
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">Organization Profile</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isEditing ? 'Update organization details below and click save.' : 'View official contact and location information.'}
            </p>
          </div>
          <Building2 size={16} className="text-slate-400" />
        </div>

        {/* Read-Only Mode vs Edit Mode */}
        {isEditing ? (
          /* Edit Mode Forms */
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fields.map(({ key, label, icon: Icon, placeholder }) => (
                <div key={key}>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    {label}
                  </label>
                  <div className="relative">
                    <input 
                      value={form[key] ?? ''} 
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })} 
                      placeholder={placeholder} 
                      className={`${inputCls} pl-8`} 
                    />
                    <Icon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button 
                type="button" 
                onClick={cancelEdit} 
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X size={13} />
                <span>Cancel</span>
              </button>

              <button 
                disabled={busy} 
                onClick={save} 
                className={buttonCls}
              >
                <Save size={13} />
                <span>{busy ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Default Read-Only Mode */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map(({ key, label, icon: Icon }) => {
              const val = org[key];
              return (
                <div key={key} className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800/80 dark:bg-slate-900/40">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Icon size={12} className="text-slate-400" />
                    <span>{label}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200 break-all">
                    {val ? val : <span className="font-normal italic text-slate-400">Not provided</span>}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}