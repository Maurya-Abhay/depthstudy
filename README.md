# Depth Study

A production-oriented adaptive learning platform built with **Next.js 16, React 19, TypeScript, Supabase, and Tailwind CSS 4**.

Depth Study combines structured learning, adaptive assessments, DSA practice, AI coaching, projects, interview preparation, placement readiness, skill intelligence, and multi-tenant organization/college workspaces in one application.

---

## Table of Contents

- [Overview](#overview)
- [Core capabilities](#core-capabilities)
- [Tech stack](#tech-stack)
- [Application architecture](#application-architecture)
- [Portal and role model](#portal-and-role-model)
- [Folder structure](#folder-structure)
- [Request and data flow](#request-and-data-flow)
- [Organization / college architecture](#organization--college-architecture)
- [Database architecture](#database-architecture)
- [Authentication and authorization](#authentication-and-authorization)
- [API architecture](#api-architecture)
- [Services layer](#services-layer)
- [Configuration and environment variables](#configuration-and-environment-variables)
- [Database setup](#database-setup)
- [Local development](#local-development)
- [Verification and production checks](#verification-and-production-checks)
- [Deployment notes](#deployment-notes)
- [Security rules](#security-rules)
- [Development rules](#development-rules)
- [How to update the product safely](#how-to-update-the-product-safely)
- [Known external dependencies](#known-external-dependencies)
- [Production checklist](#production-checklist)

---

## Overview

Depth Study is designed as a single Next.js application with:

- a **platform administration portal**
- a **learner portal**
- a **public learning surface**
- protected **organization / college workspaces**
- a shared Supabase authentication and database layer
- server-side business logic in `services/`
- API routes for client-side mutations

The platform supports both individual learners and organizations/colleges without creating separate applications.

### High-level model

```text
                         DEPTH STUDY
                              |
             +----------------+----------------+
             |                                 |
        Platform Admin                    Learner / Org
             |                                 |
           /admin                    +----------+----------+
                                     |                     |
                              Organization            Individual
                             /organization            /user
                                /[slug]
```

---

## Core capabilities

### Learning

- Courses and study topics
- Structured progress tracking
- Tests and assessments
- DSA practice and submissions
- Roadmaps and schedules
- Notes and bookmarks
- Certificates
- Notifications
- Adaptive assessment flow
- Daily missions
- Skill mastery and skill gaps
- Mistake intelligence
- Spaced repetition / review scheduling

### AI

- Socratic learning coach
- AI learning assistance
- AI feedback flows
- Centralized OpenRouter integration
- AI sessions and message history
- Server-only API key handling

### Proof and career readiness

- Projects and milestones
- Project evidence/submissions
- Interview tracks and practice
- Placement readiness
- Public proof-of-skill/profile surfaces
- Skill evidence and verified assessment foundations

### Organization / college

- Organization provisioning
- Owner / admin / mentor / student roles
- Organization invitations
- Departments
- Batches
- Faculty / mentor assignment
- Student one-by-one and bulk import flows
- Organization assignments
- Student progress monitoring
- Skill and placement snapshots
- Organization audit logs
- Organization plans and service entitlements
- Usage and seat tracking
- Billing / subscription / invoice foundations
- Organization suspension and resume controls

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| UI | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| Server DB access | `@supabase/ssr` + `@supabase/supabase-js` |
| Charts | Recharts |
| Code editor | Monaco Editor |
| PDF | jsPDF |
| QR | QRCode |
| AI | OpenRouter |
| Runtime | Node.js |
| PWA | Web App Manifest / service-worker-compatible structure |

---

## Application architecture

```text
Browser / Client
       |
       +------------------------------+
       |                              |
       | Server Component / Page      | Client mutation
       |                              |
       v                              v
   services/*.ts                  app/api/**/route.ts
       |                              |
       |                              v
       |                         services/*.ts
       |                              |
       +--------------+---------------+
                      |
                      v
                 Supabase
             Auth + PostgreSQL
```

### Rules

- Server pages call services directly.
- Do not create HTTP loopback from a server component into `app/api`.
- Client-side mutations use `app/api/**/route.ts`.
- API routes delegate business logic to `services/`.
- Database access and authorization decisions live in server-side services/RLS.
- `supabase-admin.ts` is server-only and must never be imported into client code.
- Tailwind is the styling system.
- Feature-specific components live close to their feature in `_components/`.
- Generic UI primitives live under `components/ui/`.

---

# Portal and role model

Depth Study has two different meanings of "admin". They must remain separate.

## 1. Platform Admin

The platform admin controls Depth Study itself.

```text
/auth/login
      |
      v
profiles.role = admin
      |
      v
/admin
```

Typical platform controls:

- Organizations
- Platform users
- Content
- AI/content controls
- Analytics
- Audit
- Backup / restore
- Platform settings
- Organization provisioning
- Organization plan/service controls
- Organization billing visibility
- Organization suspension/resume

## 2. Organization Owner / Admin

These users belong to an individual organization.

```text
/auth/login
      |
      v
organization_members
role = owner | admin
      |
      v
/organization/[slug]
```

They manage their organization, not the whole platform.

## 3. Organization Mentor / Faculty

```text
/auth/login
      |
      v
organization_members.role = mentor
      |
      v
/organization/[slug]
```

Mentors should only see the organization data they are authorized to see, especially assigned departments/batches/students.

## 4. Student

```text
/auth/login
      |
      v
organization_members.role = student
      |
      v
/user
```

Students continue using the normal learner experience.

### Important routing rule

The URL `/organization/[slug]` is a **tenant workspace**, not a "platform admin" portal. Owner, organization admin, and mentor can use the same base workspace route while receiving different navigation and permissions based on their organization role.

The platform admin portal remains `/admin`.

---

# Folder structure

The repository keeps business logic separate from route/UI concerns.

```text
depth-study/
├── app/
│   ├── layout.tsx
│   ├── not-found.tsx
│   ├── robots.ts
│   ├── sitemap.ts
│   │
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── organizations/
│   │   ├── ai/
│   │   ├── analytics/
│   │   ├── audit/
│   │   ├── backup/
│   │   ├── categories/
│   │   ├── certificates/
│   │   ├── courses/
│   │   ├── dsa/
│   │   ├── profile/
│   │   ├── questions/
│   │   ├── roadmaps/
│   │   ├── settings/
│   │   ├── tests/
│   │   ├── topics/
│   │   ├── users/
│   │   └── _components/
│   │
│   ├── organization/
│   │   ├── _components/
│   │   ├── [slug]/
│   │   └── invite/
│   │
│   ├── user/
│   │   ├── page.tsx
│   │   ├── bookmarks/
│   │   ├── certificates/
│   │   ├── courses/
│   │   ├── dsa/
│   │   ├── notes/
│   │   ├── notifications/
│   │   ├── profile/
│   │   ├── progress/
│   │   ├── roadmap/
│   │   ├── schedule/
│   │   ├── tests/
│   │   └── _components/
│   │
│   ├── public/
│   │   ├── page.tsx
│   │   ├── about/
│   │   ├── offline/
│   │   ├── privacy/
│   │   ├── terms/
│   │   ├── study/
│   │   └── _components/
│   │
│   ├── auth/
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot/
│   │   └── reset/
│   │
│   └── api/
│       ├── admin/
│       ├── auth/
│       ├── organization/
│       ├── ai/
│       ├── bookmarks/
│       ├── certificates/
│       ├── dsa/
│       ├── enrollments/
│       ├── notes/
│       ├── progress/
│       ├── tests/
│       ├── profile/
│       ├── health/
│       └── ...
│
├── components/
│   ├── ui/
│   └── layout/
│
├── services/
│   ├── auth.ts
│   ├── security.ts
│   ├── http.ts
│   ├── supabase-admin.ts
│   ├── supabase-browser.ts
│   ├── supabase-server.ts
│   ├── organization.ts
│   ├── workspace.ts
│   ├── org-members.ts
│   ├── org-students.ts
│   ├── org-faculty.ts
│   ├── org-structure.ts
│   ├── org-monitoring.ts
│   ├── org-audit.ts
│   ├── org-settings.ts
│   ├── organization-usage.ts
│   ├── org-provisioning.ts
│   ├── entitlements.ts
│   ├── plans.ts
│   ├── billing.ts
│   ├── billing-math.ts
│   ├── invoices.ts
│   ├── payments-provider.ts
│   ├── study.ts
│   ├── dashboard.ts
│   ├── activity.ts
│   ├── dsa.ts
│   └── ...
│
├── supabase/
│   ├── database.sql
│   └── migrations/
│
├── types/
├── examples/
├── public/
├── proxy.ts
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── package.json
└── README.md
```

### Rule for future files

Do not create a new architectural top-level folder unless the existing architecture genuinely cannot support the requirement.

---

# Request and data flow

## Server page

```text
app/**/page.tsx
        |
        v
services/*.ts
        |
        v
Supabase
```

## Client mutation

```text
Client component
      |
      | fetch()
      v
app/api/**/route.ts
      |
      v
services/*.ts
      |
      v
Supabase
```

## Authorization

Authorization must be checked on the server.

Do not rely on:

- hidden buttons
- disabled UI
- client-only redirects
- browser-supplied role claims

The server must resolve the authenticated user and organization membership.

---

# Organization / college architecture

An organization is a tenant inside the same Depth Study application/database.

```text
Depth Study Platform
        |
        +--- ABC College
        |      |
        |      +--- Owner
        |      +--- Admin
        |      +--- Mentors
        |      +--- Students
        |
        +--- XYZ College
               |
               +--- Owner
               +--- Admin
               +--- Mentors
               +--- Students
```

### Organization creation

Platform admin creates the organization.

The platform admin **must not automatically become the organization owner**.

Owner provisioning is separate:

```text
Create organization
      |
      v
Provision / invite owner
      |
      v
organization_members.role = owner
```

### Organization portal

```text
/organization/[slug]
```

Owner/admin features can include:

- Dashboard
- Members
- Students
- Faculty
- Departments
- Batches
- Assignments
- Courses
- Tests
- DSA
- Projects
- Skill Analytics
- Placement Readiness
- Invitations
- Billing & Usage
- Audit
- Settings

Mentor navigation is intentionally narrower.

Students continue using `/user`.

---

# Database architecture

The Supabase database contains both platform and tenant-scoped learning data.

## Identity and authentication

### Supabase managed

```text
auth.users
```

Stores authentication identity and account-level credentials.

### Public profile

```text
public.profiles
```

Stores application profile information and the platform-level role.

Do not assume `profiles.email` exists. Email belongs to the Supabase Auth user.

---

## Platform tables

Examples:

```text
profiles
platform_settings
user_entitlements
```

Platform-wide administration must remain separate from organization membership.

---

## Organization tables

Core tenant:

```text
organizations
```

Important organization fields include:

```text
id
name
slug
kind
status
plan
created_at
updated_at

legal_name
phone
official_email
website
address
city
state
country
postal_code
contact_person
notes
internal_notes
suspended_reason
suspended_at
plan_id
```

Members:

```text
organization_members
```

Roles:

```text
owner
admin
mentor
student
```

Invitations:

```text
organization_invites
```

Organizations can also use:

```text
organization_departments
organization_batches
batch_members
faculty_assignments
organization_assignments
assignment_attempts
organization_audit_logs
organization_skill_snapshots
organization_placement_snapshots
organization_provisioning
organization_import_jobs
organization_import_rows
```

---

# Billing / commercial domain

Where present in the repository, organization commercial data is kept separate from core organization identity:

```text
organization_plan_definitions
organization_feature_entitlements
organization_entitlements
organization_billing_profiles
organization_subscriptions
organization_invoices
organization_invoice_items
organization_payments
billing_events
organization_usage
organization_usage_events
```

### Billing model

The code supports a provider-neutral billing domain. A deployment may configure a real payment provider separately.

Do not treat provider-neutral database records as proof that a live payment gateway is configured.

---

# Learning domain

The core learner experience is backed by tables for areas such as:

```text
study_categories
study_modules
study_topics
courses
course_categories
course_topics
enrollments
topic_progress
study_schedules
personal_notes
bookmarks
questions
tests
test_attempts
dsa_problems
dsa_submissions
```

Advanced learning intelligence includes:

```text
skills
skill_topics
user_skill_mastery
skill_events
skill_gap_snapshots
learning_missions
learning_mission_items
mistake_categories
mistake_logs
mistake_trends
learning_reviews
```

Project, interview, proof and placement functionality uses its own related tables.

---

# Authentication and authorization

## Main authentication flow

All users use the same application authentication entry point.

Conceptually:

```text
/auth/login
      |
      v
Supabase Auth
      |
      +----------------------+
      |                      |
      v                      v
profiles                 organization_members
      |                      |
platform role           organization role
      |                      |
      +-----------+----------+
                  |
                  v
          workspace resolver
                  |
       +----------+----------+
       |          |          |
       v          v          v
    /admin   /organization   /user
```

### Platform admin

Controlled by the platform-level profile role.

### Organization member

Controlled by:

```text
organization_members.organization_id
organization_members.user_id
organization_members.role
```

### Security rule

A user being an organization owner/admin does not make them a platform admin.

A platform admin creating an organization does not automatically become its owner.

---

# API architecture

API routes are the boundary for client mutations.

Typical patterns:

```text
app/api/admin/**/route.ts
app/api/organization/**/route.ts
app/api/auth/**/route.ts
app/api/ai/**/route.ts
app/api/tests/**/route.ts
app/api/dsa/**/route.ts
...
```

### Route responsibilities

An API route should:

1. authenticate the caller
2. resolve platform or organization context
3. validate input
4. enforce role/tenant/service permissions
5. call a service
6. return a stable JSON response

Business logic should stay in `services/`.

---

# Services layer

The services directory is the main server-side business layer.

### Authentication / security

```text
services/auth.ts
services/security.ts
services/workspace.ts
```

Responsibilities:

- current user
- admin checks
- learner checks
- workspace resolution
- organization membership
- secure API identity

### Supabase clients

```text
services/supabase-browser.ts
services/supabase-server.ts
services/supabase-admin.ts
```

`supabase-admin.ts` is privileged and server-only.

Never expose the service-role key to the browser.

### Organization services

```text
services/organization.ts
services/org-members.ts
services/org-students.ts
services/org-faculty.ts
services/org-structure.ts
services/org-monitoring.ts
services/org-audit.ts
services/org-settings.ts
services/organization-usage.ts
services/org-provisioning.ts
```

Responsibilities include:

- organization membership
- owner/admin/mentor/student lifecycle
- invitations
- departments
- batches
- faculty assignments
- students / imports
- monitoring
- audit
- provisioning
- usage

### Commercial services

```text
services/plans.ts
services/entitlements.ts
services/billing.ts
services/billing-math.ts
services/invoices.ts
services/payments-provider.ts
```

Responsibilities include:

- plan definitions
- service entitlements
- usage checks
- billing calculations
- invoice domain
- provider abstraction

A real payment provider still requires production credentials/configuration and provider-specific runtime verification.

---

# Configuration and environment variables

Use:

```text
.env.local
```

Locally.

Do not commit secrets.

At minimum, the application requires the Supabase project variables used by the existing codebase, typically:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Server-side AI configuration:

```env
OPENROUTER_API_KEY=
```

Payment-provider configuration is deployment-specific. When the corresponding provider implementation is enabled/configured, keep credentials server-only.

Never use:

```text
NEXT_PUBLIC_OPENROUTER_API_KEY
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_*_SECRET
```

for secrets.

---

# Database setup

## Fresh Supabase project

The repository intends `supabase/database.sql` to be the baseline consolidated schema.

However, because the product has additive B2B hardening/provisioning migrations, **always inspect the current `supabase/migrations/` directory and the migration instructions shipped with the exact release you are deploying**.

Do not blindly run old historical migration files in an arbitrary order.

For the current codebase, the shipped additive migrations are:

```text
supabase/migrations/20260913_organization_b2b_completion.sql
supabase/migrations/20260914_production_hardening.sql
```

Apply only migrations that are not already present in your target database. The safe rule is:

```text
database.sql
   +
required current additive migrations
   ↓
current application schema
```

Never:

```text
DROP SCHEMA public CASCADE
```

to "fix" a migration unless you are intentionally rebuilding a disposable development database.

### Existing Supabase project

Apply only the migrations that have not already been applied.

Before running a migration:

- read it
- confirm its dependencies
- confirm it is additive/idempotent
- verify the target objects are not already present in a conflicting form

---

# Local development

```bash
npm ci
npm run dev
```

Application:

```text
http://localhost:3000
```

---

# Verification and production checks

Required local checks:

```bash
npm run typecheck
npm run build
npm start
```

Recommended smoke-test routes:

```text
/
/study
/auth/login
/user
/admin
/admin/organizations
/organization/<slug>
/api/health
```

For organization flows also manually verify:

```text
Platform admin
  -> create organization
  -> provision owner
  -> owner login
  -> organization dashboard
  -> add faculty
  -> add/import students
  -> create batch
  -> create assignment
  -> student sees assignment
  -> mentor sees authorized students
```

For production billing, also test the actual configured provider in a non-production/sandbox environment before enabling live charges.

---

# Deployment notes

Before production deployment:

1. Configure production Supabase variables.
2. Configure server-only secrets.
3. Apply the correct database baseline/migrations.
4. Run typecheck and build.
5. Run application smoke tests against a real Supabase project.
6. Verify RLS and tenant isolation.
7. Verify organization owner/admin/mentor/student routing.
8. Verify billing provider configuration, webhooks and idempotency if payments are enabled.
9. Verify backup/restore procedures.
10. Review logs and error handling.
11. Verify PWA assets and manifest warnings.
12. Confirm no secret is exposed to the browser bundle.

### Important

A successful TypeScript build is not the same as a live production certification.

Live verification requires:

- a real Supabase project
- real auth
- actual organization membership data
- actual provider/webhook configuration for payments if enabled

---

# Security rules

These rules are non-negotiable.

### Tenant isolation

Every organization query must be scoped to the authorized organization.

### Server authorization

Do not trust browser-supplied:

- role
- organization id
- organization slug
- owner status
- payment status
- entitlement status

### Service role

`supabase-admin.ts` is privileged. Use it deliberately and only from trusted server code.

### Secrets

Never expose:

- Supabase service-role key
- OpenRouter API key
- payment-provider secret
- webhook secret

### RLS

All tenant-facing tables should have appropriate RLS.

### Invitations

Use secure, expiring, one-time invitation tokens. Do not store plaintext invitation secrets unnecessarily.

### Audit

Sensitive actions should be auditable.

---

# Development rules

When adding a new feature:

## Step 1 — Find the page

Example:

```text
app/organization/[slug]/students/
```

## Step 2 — Find the API

Example:

```text
app/api/organization/students/route.ts
```

## Step 3 — Find the service

Example:

```text
services/org-students.ts
```

## Step 4 — Find the database objects

Search `supabase/database.sql` and current additive migrations for the related tables/columns/policies.

## Step 5 — Reuse existing authorization

Do not invent another role/permission system.

## Step 6 — Add tests/checks

Run:

```bash
npm run typecheck
npm run build
```

and manually smoke-test the affected flow.

---

# How to update the product safely

Use this mental map:

```text
UI/page
   ↓
API route
   ↓
Service
   ↓
Supabase table / RPC / view
```

### Example: add a new organization field

1. Add migration:
   `supabase/migrations/YYYYMMDD_add_field.sql`
2. Update service query/types.
3. Update API validation.
4. Update page/form.
5. Update organization detail/summary views if required.
6. Review RLS.
7. Run typecheck/build.

### Example: add a student feature

```text
app/organization/[slug]/students
        ↓
app/api/organization/students
        ↓
services/org-students.ts
        ↓
organization_members / batch_members / related learning tables
```

### Example: add a billing feature

```text
Admin / Organization billing UI
        ↓
billing API
        ↓
services/billing.ts
services/billing-math.ts
        ↓
subscription / invoice / payment / usage tables
```

Do not duplicate billing calculations in UI code.

---

# Known external dependencies

Some capabilities intentionally depend on external production infrastructure/configuration.

## Supabase

Required for:

- authentication
- database
- RLS
- organization membership
- application data

## OpenRouter

Required for live AI functionality.

Server-only:

```env
OPENROUTER_API_KEY=
```

## Payment provider

The billing domain can exist without pretending that a payment succeeded.

A production payment flow requires:

- provider account
- provider credentials
- verified webhook endpoint
- signature verification
- idempotent event handling
- production/sandbox verification

Do not mark payments as successful merely because an internal application record was created.

---

# Production checklist

## Application

- [ ] `npm ci`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm start`
- [ ] no runtime errors in critical routes
- [ ] no broken organization routes
- [ ] no broken admin routes

## Authentication

- [ ] platform admin login works
- [ ] organization owner login works
- [ ] organization admin login works
- [ ] mentor login works
- [ ] student login works
- [ ] multi-organization switching is correct
- [ ] deactivated members are blocked
- [ ] suspended organizations are handled correctly

## Organization

- [ ] organization creation
- [ ] owner provisioning
- [ ] invitations
- [ ] departments
- [ ] batches
- [ ] faculty assignments
- [ ] one-by-one students
- [ ] bulk import
- [ ] assignments
- [ ] monitoring
- [ ] audit

## Learning

- [ ] course flows
- [ ] tests
- [ ] DSA
- [ ] progress
- [ ] skills
- [ ] missions
- [ ] mistake intelligence
- [ ] spaced review
- [ ] projects
- [ ] interviews
- [ ] placement readiness

## AI

- [ ] OpenRouter configured
- [ ] server-only key
- [ ] AI routes respond correctly
- [ ] errors do not expose secrets

## Billing

- [ ] plan configuration
- [ ] service entitlements
- [ ] usage
- [ ] subscription
- [ ] invoice generation
- [ ] payment provider configuration
- [ ] webhook verification
- [ ] webhook idempotency
- [ ] payment status reconciliation

## Security

- [ ] RLS reviewed
- [ ] tenant isolation tested
- [ ] service-role imports are server-only
- [ ] secrets not committed
- [ ] role escalation blocked
- [ ] audit protected
- [ ] backup/restore protected

## Database

- [ ] baseline schema applied
- [ ] only required current migrations applied
- [ ] no destructive reset
- [ ] foreign keys valid
- [ ] indexes reviewed
- [ ] backups tested

---

# Product status

Depth Study is a broad learning platform with adaptive learning, AI coaching, DSA, assessments, projects, interview preparation, placement readiness, public proof, and organization/college workspaces.

The repository is structured for continued development without changing the core architecture.

For every future change, follow:

```text
Page
  ↓
API
  ↓
Service
  ↓
Database
  ↓
RLS / authorization
  ↓
Typecheck
  ↓
Build
  ↓
Smoke test
```

That flow should remain stable as the product evolves.
