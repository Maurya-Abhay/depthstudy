'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';

export default function CreateOrganization() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [kind, setKind] = useState('college');
  const [legalName, setLegalName] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [postalCode, setPostalCode] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [notes, setNotes] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  // Auto-generate slug from name if slug hasn't been manually edited heavily
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
    }
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || name.trim().length < 2 || slug.trim().length < 2) return;

    setBusy(true);
    setMessage(null);

    try {
      const r = await fetch('/api/organization', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, slug, kind, legalName, officialEmail, phone, website, address, city, state, country, postalCode, contactPerson, notes, ownerName, ownerEmail, ownerPhone }),
      });
      const d = await r.json();

      if (r.ok) {
        const ownerCreated = d.organization?.ownerCreated as boolean | undefined;
        setMessage({ text: ownerCreated ? `Organization created. Owner account ready: ${ownerEmail}` : 'Organization created successfully. Owner baad me Owner & Access tab se add karo.', isError: false });
        setName('');
        setSlug('');
        setLegalName(''); setOfficialEmail(''); setPhone(''); setWebsite('');
        setAddress(''); setCity(''); setState(''); setPostalCode('');
        setContactPerson(''); setNotes('');
        setOwnerName(''); setOwnerEmail(''); setOwnerPhone('');
        // Navigate first, then refresh so the new org is visible on arrival.
        if (d.organization?.id) router.push(`/admin/organizations/${d.organization.id}`);
        else router.refresh();

      } else {
        setMessage({ text: d.error ?? 'Could not create organization', isError: true });
      }
    } catch {
      setMessage({ text: 'Network error. Please try again.', isError: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-900/50 dark:bg-indigo-950/50 dark:text-indigo-400">
          <Building2 size={16} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Create New Organization
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Setup a new tenant workspace for a college, institute, or enterprise.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          {/* Organization Name */}
          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Workspace Name
            </label>
            <input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Stanford University"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white dark:placeholder:text-slate-600 dark:focus:bg-slate-900"
            />
          </div>

          {/* Unique Slug */}
          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              URL Slug
            </label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="stanford-univ"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white dark:placeholder:text-slate-600 dark:focus:bg-slate-900"
            />
          </div>

          {/* Type Select */}
          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Type
            </label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-900"
            >
              <option value="college">College</option>
              <option value="institute">Institute</option>
              <option value="company">Company</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">Legal Name</label>
            <input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Registered legal name" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-900/50 dark:text-white" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">Official Email</label>
            <input value={officialEmail} onChange={(e) => setOfficialEmail(e.target.value)} type="email" placeholder="office@college.edu" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-900/50 dark:text-white" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Institution phone" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-900/50 dark:text-white" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">Website</label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-900/50 dark:text-white" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full institution address" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-900/50 dark:text-white" />
          </div>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-900/50 dark:text-white" />
          <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-900/50 dark:text-white" />
          <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-900/50 dark:text-white" />
          <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Postal code" className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-900/50 dark:text-white" />
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <div className="mb-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">First organization owner (optional)</h3>
            <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">Owner ka account direct banta hai (email + default password). Password baad me Owner &amp; Access tab se set/reset kar sakte ho. Platform admin owner nahi banta.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner name" className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
            <input value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} type="email" placeholder="owner@college.edu" className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
            <input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="Owner phone" className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">Internal Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Internal platform notes" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-900/50 dark:text-white" />
        </div>

        {/* Action & Feedback Row */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={busy || name.trim().length < 2 || slug.trim().length < 2}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            {busy ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus size={14} />
                <span>Create Organization</span>
              </>
            )}
          </button>

          {message && (
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold ${
                message.isError
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {message.isError ? (
                <AlertCircle size={14} />
              ) : (
                <CheckCircle2 size={14} />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </div>
      </form>
    </section>
  );
}