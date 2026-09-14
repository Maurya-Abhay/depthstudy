# Depth Study — Final Production Audit

Date: 2026-09-14

## Completed in this pass

- Removed broken `profiles(email)` / `profiles(name,email)` PostgREST relationship assumptions.
- Centralized profile + Supabase Auth email lookup in `services/user-directory.ts`.
- Fixed organization member listing.
- Fixed faculty listing.
- Fixed mentor monitoring student lookup.
- Fixed batch member lookup.
- Fixed bulk-import existing-email detection.
- Hardened direct organization member creation so mentors/admins cannot create unauthorized admin roles.
- Made organization student login route resolve to `/user` instead of an organization route.
- Made certificate verification GET independent of a broken profile relationship and usable without requiring learner authentication.
- Added valid PNG PWA icons.
- Added a minimal safe service worker that avoids caching authenticated/API routes.
- Updated README database/migration and deployment guidance.
- Static TypeScript/TSX transpile check: 261 files, 0 syntax diagnostics.

## Database policy

No database reset is required for the code fixes in this pass.

The repository contains:
- `supabase/database.sql`
- `supabase/migrations/20260913_organization_b2b_completion.sql`
- `supabase/migrations/20260914_production_hardening.sql`

Apply only migrations that are not already applied to the target Supabase project.

## Verification boundary

The environment used for this pass did not have a fully installable dependency tree / live Supabase project / payment-provider credentials, so a live production smoke test was not possible here.

The codebase was statically scanned and all TypeScript/TSX files successfully passed a compiler transpile/syntax check.

Real payment collection is intentionally not faked. The provider abstraction requires a configured and implemented provider in the deployment environment.

Before launch, run:
- `npm ci`
- `npm run typecheck`
- `npm run build`
- `npm start`

Then smoke-test:
- public pages
- login/register/reset
- `/admin`
- organization create/provision
- owner login
- mentor scope
- student login
- assignments
- billing pages
- backup/restore
- certificate verification
- `/api/health`

