'use client';

import { useEffect, useState } from 'react';

export type OrgContext = { orgId: string; slug: string; role: 'owner' | 'admin' | 'mentor' | 'student'; loading: boolean; error: string | null };

/**
 * Client hook to resolve the current organization context for a slug.
 * Authorization is always enforced server-side by the API routes and layout;
 * this only supplies the orgId/role for rendering.
 */
export function useOrgContext(slug: string): OrgContext {
  const [state, setState] = useState<OrgContext>({ orgId: '', slug, role: 'student', loading: true, error: null });

  useEffect(() => {
    let mounted = true;
    fetch('/api/auth/workspace')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('unauthenticated'))))
      .then((data) => {
        if (!mounted) return;
        const memberships = (data.memberships ?? []) as Array<{ organization_id: string; slug: string; role: string; member_status: string; org_status: string }>;
        const match = memberships.find((m) => m.slug === slug && m.member_status === 'active' && m.org_status === 'active');
        if (!match) {
          setState({ orgId: '', slug, role: 'student', loading: false, error: 'Workspace not available' });
          return;
        }
        setState({ orgId: match.organization_id, slug, role: match.role as OrgContext['role'], loading: false, error: null });
      })
      .catch(() => {
        if (mounted) setState({ orgId: '', slug, role: 'student', loading: false, error: 'Unable to resolve workspace' });
      });
    return () => { mounted = false; };
  }, [slug]);

  return state;
}