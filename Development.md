# Depth Study — Development.md

> Living technical map of the current project. This document is intended to make future changes fast: first find the route/page/service/table here, then open the referenced file and change the smallest possible layer.
>
> Generated from the current project structure and SQL files on 2026-09-14. Treat the repository and live database as the source of truth if they diverge.

---

## 1. Product in one view

Depth Study is a single Next.js application with one Supabase project/database and three main user experiences:

- **Platform Admin** → `/admin`
- **Organization workspace** (owner/admin/mentor) → `/organization/[slug]`
- **Learner/Student** → `/user`

Authentication is shared. Login identity comes from Supabase Auth (`auth.users`). Platform role comes from `public.profiles.role`; organization role comes from `public.organization_members.role`.

### Core request flow

```text
Server page
  → service
  → Supabase/Postgres

Client mutation
  → /app/api/* route
  → service
  → Supabase/Postgres
```

Do not create a second business-logic layer.

---

## 2. Important development rules

1. **Do not delete or reset the database.**
2. `supabase/database.sql` is the base/master schema; B2B additions live in additive migrations.
3. Use `supabase/migrations/*.sql` for schema additions/fixes instead of destructive edits.
4. Keep auth, authorization, tenant isolation, billing, entitlement checks server-side.
5. `profiles` does **not** contain email in the current schema. User email belongs to `auth.users`.
6. `organization_members` and `organization_audit_logs` should not assume a PostgREST `profiles(...)` relationship unless an explicit FK exists. Safe pattern: fetch rows, then fetch profiles/auth users separately.
7. Platform admin and organization owner/admin are different concepts.
8. Creating an organization must not automatically make the platform admin its owner.
9. Use existing services before creating a new service.
10. Preserve the current Tailwind/component/design system.

---

## 3. Repository structure — exact current map

```text
/
├── app/
│   ├── admin/
│   │   ├── _components/
│   │   │   ├── admin-pagination.tsx
│   │   │   ├── admin-profile-edit.tsx
│   │   │   ├── admin-shell.tsx
│   │   │   ├── backup-download.tsx
│   │   │   ├── course-manager.tsx
│   │   │   ├── dsa-manager.tsx
│   │   │   ├── json-bulk-box.tsx
│   │   │   ├── question-manager.tsx
│   │   │   ├── roadmap-manager.tsx
│   │   │   ├── test-manager.tsx
│   │   │   ├── topic-manager.tsx
│   │   │   └── user-manager.tsx
│   │   ├── ai/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── audit/page.tsx
│   │   ├── backup/page.tsx
│   │   ├── categories/page.tsx
│   │   ├── certificates/page.tsx
│   │   ├── certificates/[id]/page.tsx
│   │   ├── content-quality/page.tsx
│   │   ├── courses/page.tsx
│   │   ├── dsa/page.tsx
│   │   ├── layout.tsx
│   │   ├── organizations/page.tsx
│   │   ├── organizations/[id]/page.tsx
│   │   ├── organizations/[id]/_components/admin-org-client.tsx
│   │   ├── organizations/_components/create-organization.tsx
│   │   ├── page.tsx
│   │   ├── product-health/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── questions/page.tsx
│   │   ├── roadmaps/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── tests/page.tsx
│   │   ├── topics/page.tsx
│   │   └── users/page.tsx
│   │
│   ├── api/
│   │   ├── admin/...
│   │   ├── ai/...
│   │   ├── assessments/...
│   │   ├── auth/workspace/route.ts
│   │   ├── bookmarks/route.ts
│   │   ├── certificates/route.ts
│   │   ├── code/route.ts
│   │   ├── dsa/route.ts
│   │   ├── dsa-library/route.ts
│   │   ├── enrollments/route.ts
│   │   ├── health/route.ts
│   │   ├── interview/route.ts
│   │   ├── missions/...
│   │   ├── mistakes/route.ts
│   │   ├── notes/route.ts
│   │   ├── notifications/route.ts
│   │   ├── onboarding/...
│   │   ├── organization/...
│   │   ├── profile/route.ts
│   │   ├── progress/route.ts
│   │   ├── projects/route.ts
│   │   ├── proof/...
│   │   ├── reviews/route.ts
│   │   ├── schedule/route.ts
│   │   ├── search/route.ts
│   │   ├── skills/...
│   │   ├── study-library/route.ts
│   │   └── tests/...
│   │
│   ├── auth/
│   │   ├── forgot-password/page.tsx
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── reset-password/page.tsx
│   │
│   ├── organization/
│   │   ├── _components/
│   │   │   ├── org-shell.tsx
│   │   │   ├── portal-ui.tsx
│   │   │   └── use-org-context.ts
│   │   ├── [slug]/
│   │   │   ├── _components/manager-tools.tsx
│   │   │   ├── assignments/page.tsx
│   │   │   ├── audit/page.tsx
│   │   │   ├── batches/page.tsx
│   │   │   ├── billing/page.tsx
│   │   │   ├── departments/page.tsx
│   │   │   ├── faculty/page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── members/page.tsx
│   │   │   ├── page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── students/page.tsx
│   │   ├── invite/[token]/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── public/...
│   ├── user/
│   │   ├── onboarding/page.tsx
│   │   ├── onboarding/_components/onboarding-wizard.tsx
│   │   └── (protected)/...
│   ├── error.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── not-found.tsx
│   ├── robots.ts
│   └── sitemap.ts
│
├── components/
│   ├── ui/                 # generic/reusable UI primitives
│   └── ...                 # shared layout/components
│
├── services/
├── supabase/
│   ├── database.sql
│   └── migrations/
│       ├── 20260913_organization_b2b_completion.sql
│       └── 20260914_production_hardening.sql
│
├── types/
├── examples/
├── public/
├── proxy.ts
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── package.json
├── .env.example
├── README.md
├── PRODUCT-SETUP.md
├── PRODUCT-RELEASE-README.md
├── FINAL-STATUS.md
├── FINAL-RELEASE-NOTES.md
└── FIXES-APPLIED.md
```

---

## 4. Login and portal routing

### Single login

`/auth/login`

The authentication identity is stored in:

```text
auth.users
```

Platform role:

```text
public.profiles.role
```

Organization role:

```text
public.organization_members.role
```

### Expected routing

```text
platform admin
  → /admin

organization owner
  → /organization/[slug]

organization admin
  → /organization/[slug]

organization mentor/faculty
  → /organization/[slug]

organization student
  → /user
```

`services/workspace.ts` is the centralized workspace resolver.

`app/api/auth/workspace/route.ts` exposes the authenticated workspace context.

`app/organization/[slug]/layout.tsx` re-checks organization membership and organization status server-side.

---

# 5. API reference

> All mutation APIs should be treated as authenticated server endpoints. Exact validation/authorization remains in the route + service implementation. The fields below are the fields currently referenced by the route code.

## 5.1 Platform Admin APIs

### `GET/POST/PATCH /api/admin/categories`

Purpose: manage study categories.

Query:
- `id` for targeted read/update/delete.

### `GET/POST/PATCH/DELETE /api/admin/content`

Purpose: admin content operations for questions/tests/DSA-style content depending on `action`/`kind`.

Body fields referenced:
- `action`
- `kind`
- `general`
- `records`
- `id`
- `answer`
- `details`
- `durationMinutes` / `duration_minutes`
- `maxAttempts` / `max_attempts`
- `options`
- `passingScore` / `passing_score`
- `published`
- `questionIds`
- `randomOptions`
- `randomQuestions`
- `requiredProgress` / `required_progress`
- `testCases` / `test_cases`
- `unlockDays` / `unlock_days`

Query:
- `categoryId`
- `general`
- `id`
- `kind`

### `GET/POST/PATCH/DELETE /api/admin/courses`

Purpose: admin course CRUD.

Body:
- `id`
- `action`
- `title`
- `slug`
- `description`
- `accessType`
- `price`
- `unlockDays` / `unlock_days`
- `requiredProgress` / `required_progress`
- `passingScore` / `passing_score`
- `certificateEnabled`
- `published`
- `categoryIds`
- `topicIds`
- `records`

### `GET/POST/PATCH/DELETE /api/admin/dsa-topics`

Purpose: manage DSA topics.

Query:
- `id`

### `GET/PATCH /api/admin/certificates`

Purpose: admin certificate status/management.

Body:
- `certificateCode`
- `revoked`

### `POST /api/admin/content-quality`

Purpose: recalculate/refresh content quality metrics.

Body:
- `contentType`
- `contentId`

### `GET /api/admin/backup`

Purpose: platform-admin backup export.

### `POST /api/admin/backup/restore`

Purpose: platform-admin restore.

Body:
- `backup`
- `confirm`

### `GET/POST/PATCH /api/admin/plans`

Purpose: organization plan catalog management.

Query:
- `all`

Body:
- `id`
- `code`
- `name`
- `billingModel`
- `monthlyPrice`
- `yearlyPrice`
- `active`

### `GET/PATCH /api/admin/settings`

Purpose: platform settings.

Body:
- `brand`
- `maintenance`
- `notifyAdmin`
- `compact`

### `GET/POST/PATCH /api/admin/skills`

Purpose: admin skill CRUD.

Query:
- `all`

Body:
- `id`
- `name`
- `slug`
- `description`
- `category`
- `published`
- `sortOrder`

### `GET/PATCH /api/admin/users`

Purpose: platform user management.

Query:
- `page`
- `pageSize`
- `q`
- `role`
- `status`

Body:
- `id`
- `name`
- `role`
- `status`
- `reason`

### `GET/POST/PATCH /api/admin/roadmaps`

Purpose: roadmap management.

Body:
- `id`
- `title`
- `description`
- `content`
- `categoryIds`
- `topicIds`
- `requiredProgress`
- `published`
- `records`

### `GET/POST /api/admin/organizations/[id]/provisioning`

Purpose: platform-level organization provisioning.

Body fields:
- `action`
- `cycle`
- `email`
- `enabled`
- `ownerUserId`
- `planId`
- `provider`
- `providerSubscriptionId`
- `quota`
- `service`
- `status`
- `step`

Key operations include:
- owner provisioning
- owner invitation
- provisioning step/status updates
- plan assignment
- service toggles
- subscription/invoice actions
- suspend/resume

---

## 5.2 Authentication / workspace

### `GET /api/auth/workspace`

Purpose: return server-resolved workspace context after login.

No request body.

Source service:
- `services/workspace.ts`

---

## 5.3 Organization APIs

### `GET/POST /api/organization`

Purpose:
- list user organizations
- create organization (platform-level path)
- organization details

Query:
- `orgId`

Body:
- `name`
- `slug`
- `kind`
- `planId`
- `legalName`
- `phone`
- `officialEmail`
- `website`
- `address`
- `city`
- `state`
- `country`
- `postalCode`
- `contactPerson`
- `notes`
- `ownerName`
- `ownerEmail`
- `ownerPhone`

### `GET/POST /api/organization/members`

Purpose: members + invite lifecycle.

Query:
- `orgId`
- `page`
- `pageSize`
- `role`
- `search`
- `status`

Body:
- `action`
- `organizationId`
- `memberUserId`
- `inviteId`
- `role`
- `email`

Actions include:
- list
- invite
- resend
- revoke
- deactivate
- reactivate
- role change

### `GET/POST /api/organization/students`

Purpose: student lifecycle + bulk CSV import.

Query:
- `orgId`

Body:
- `action`
- `organizationId`
- `name`
- `email`
- `phone`
- `rollNumber`
- `externalId`
- `departmentId`
- `batchId`
- `csv`
- `rows`

### `GET/POST /api/organization/faculty`

Purpose: faculty/mentor lifecycle and assignment.

Query:
- `orgId`

Body:
- `action`
- `organizationId`
- `facultyUserId`
- `email`
- `departmentId`
- `batchId`

### `GET/POST /api/organization/structure`

Purpose: departments and batches.

Query:
- `orgId`
- `all`

Body:
- `action`
- `organizationId`
- `name`
- `description`
- `departmentId`
- `batchId`
- `code`
- `startYear`
- `endYear`
- `mentorId`
- `memberUserIds`
- `archived`

### `GET /api/organization/assignments`

Purpose: organization assignment reads.

### `GET/POST /api/organization/billing`

Purpose: billing snapshot, subscription, invoice generation/payment-domain operations.

Query:
- `orgId`

Body:
- `organizationId`

Services:
- `services/billing.ts`
- `services/billing-math.ts`

### `GET/POST /api/organization/entitlements`

Purpose: read/toggle organization feature entitlements.

Query:
- `orgId`

Body:
- `organizationId`
- `service`

### `GET /api/organization/monitoring`

Purpose: owner/admin monitoring and mentor-scoped monitoring.

Query:
- `orgId`

### `GET/POST /api/organization/audit`

Purpose: organization/platform audit log reads.

Query:
- `orgId`
- `page`
- `pageSize`
- `search`

### `POST /api/organization/invite`

Purpose: accept organization invite token.

Body:
- `token`

### `POST /api/organization/manage`

Purpose: legacy/central organization mutation surface kept for existing flows.

Body fields referenced:
- `action`
- `organizationId`
- `name`
- `description`
- `role`
- `email`
- `memberUserId`
- `departmentId`
- `batchId`
- `startYear`
- `endYear`
- `targetType`
- `targetId`
- `title`
- `dueAt`

### `GET/POST /api/organization/settings`

Purpose: organization profile/settings.

Query:
- `orgId`

Body:
- `organizationId`

### Organization page routes

```text
/organization
/organization/[slug]
/organization/[slug]/members
/organization/[slug]/students
/organization/[slug]/faculty
/organization/[slug]/departments
/organization/[slug]/batches
/organization/[slug]/assignments
/organization/[slug]/billing
/organization/[slug]/audit
/organization/[slug]/settings
/organization/invite/[token]
```

---

## 5.4 Learner APIs

### AI

```text
POST /api/ai
POST /api/ai/coach
POST /api/ai/explain
POST /api/ai/mistake
POST /api/ai/recommendations
POST /api/ai/save
```

Common body fields:
- `message`
- `skillId`
- `skillName`
- `topicId`
- `problemId`
- `problemTitle`
- `mistakeCategory`
- `code`
- `language`
- `category`
- `description`
- `expectedApproach`
- `userAnswer`
- `instruction`
- `kind`
- `title`
- `output`

### Assessments

```text
GET/POST /api/assessments
GET /api/assessments/question
POST /api/assessments/answer
POST /api/assessments/submit
```

Body/query:
- `id`
- `blueprintId`
- `skillId`
- `assessmentId`
- `itemId`
- `selectedOption`

### Bookmarks

```text
POST/DELETE /api/bookmarks
```

- `topicId`

Query:
- `topicId`

### Certificates

```text
GET/POST /api/certificates
```

- `attemptId`
- query `code`

### Code execution

```text
POST /api/code
```

- `language`
- `source`
- `stdin`

### DSA

```text
POST /api/dsa
GET /api/dsa-library
```

`POST /api/dsa` fields:
- `action`
- `problemId`
- `source`

### Enrollments

```text
POST /api/enrollments
```

- `courseId`

### Interview

```text
GET/POST /api/interview
```

Body:
- `action`
- `answer`
- `mode`
- `questionId`
- `sessionId`
- `trackId`

### Missions

```text
GET/POST /api/missions
PATCH /api/missions/items
```

Fields:
- `date`
- query `date`, `from`, `to`
- `itemId`
- `status`

### Mistakes

```text
GET /api/mistakes
```

### Notes

```text
POST /api/notes
```

Body is handled by the route/service; see `app/api/notes/route.ts` and `services/study.ts`/Supabase logic.

### Notifications

```text
GET/PATCH /api/notifications
```

- `id`
- `all`

### Onboarding

```text
GET/POST /api/onboarding
POST /api/onboarding/diagnostic
```

Body:
- `interests`
- `currentLevel`
- `goals`
- `dailyMinutes`
- `learningStyle`

### Progress

```text
POST /api/progress
```

- `topicId`
- `progress`

### Projects

```text
GET/POST /api/projects
```

Body:
- `action`
- `enrollmentId`
- `projectId`
- `milestoneId`
- `status`
- `repoUrl`
- `demoUrl`
- `notes`

Query:
- `enrollmentId`

### Proof / public profile

```text
GET/PATCH /api/proof/profile
GET /api/proof/public/[slug]
GET /api/proof/verify/[code]
```

Profile body:
- `headline`
- `bio`
- `isPublic`

### Reviews

```text
GET/POST /api/reviews
```

- `reviewId`
- `grade`

### Schedule

```text
GET/POST/DELETE /api/schedule
```

- `id`
- `title`
- `startsAt`
- `durationMinutes`

### Search

```text
GET /api/search?q=...
```

- `q`

### Skills

```text
GET /api/skills
GET /api/skills/gaps
POST /api/skills/events
POST /api/skills/recalculate
```

Event fields:
- `skillId`
- `topicId`
- `eventType`
- `score`
- `source`
- `entityType`
- `entityId`
- `metadata`

Recalculate:
- `skillId`

### Study library

```text
GET /api/study-library
```

### Tests

```text
GET/POST /api/tests
GET /api/tests/result
```

Common fields:
- `id`
- `action`
- `testId`
- `attemptId`
- `answers`
- `suspiciousEvents`

### Profile

```text
PATCH /api/profile
```

- `name`

### Health

```text
GET /api/health
```

---

# 6. Services reference

## Authentication / authorization

### `services/auth.ts`
- `requireUser()` — authenticated user guard.
- `getCurrentRole(userId)` — platform role.
- `requireLearner()` — learner access guard.
- `requireAdmin()` — platform admin guard.

### `services/security.ts`
Central API security helpers (request/user/admin/rate-limit/read JSON patterns).

### `services/workspace.ts`
Central organization/platform workspace resolution.

### `services/organization.ts`
Core organization operations and role checks:
- `requireOrganizationManager`
- `requireOrganizationOwnerOrAdmin`
- `getUserOrganizations`
- `getOrganizationDashboard`
- `createOrganization`
- `provisionOrganizationOwner`
- `createOrganizationOwnerInvite`
- `addOrganizationMember`
- `createOrganizationBatch`
- `createOrganizationDepartment`
- `addBatchMember`
- `createOrganizationAssignment`
- `createOrganizationInvite`
- `acceptOrganizationInvite`
- `getUserOrganizationAssignments`

## Organization lifecycle

### `services/org-members.ts`
Members + invites:
- `listMembers`
- `createInvite`
- `revokeInvite`
- `resendInvite`
- `listInvites`
- `deactivateMember`
- `reactivateMember`
- `changeMemberRole`

### `services/org-students.ts`
- `addStudent`
- `parseCsv`
- `previewBulkImport`
- `runBulkImport`
- `listImportJobs`
- `listDepartmentsLite`
- `listBatchesLite`

### `services/org-faculty.ts`
- `listFaculty`
- `assignFaculty`
- `removeFacultyAssignment`
- `inviteFaculty`

### `services/org-structure.ts`
Departments/batches:
- `listDepartments`
- `createDepartment`
- `updateDepartment`
- `listBatches`
- `createBatch`
- `updateBatch`
- `setBatchMembers`
- `listBatchMembers`

### `services/org-monitoring.ts`
- `getOrganizationMonitoring`
- `getMentorScope`

### `services/org-settings.ts`
- `getOrganizationSettings`
- `updateOrganizationProfile`

### `services/org-audit.ts`
- `listAuditLogs`
- `listPlatformAudit`

### `services/organization-provisioning.ts`
Provisioning state:
- `getProvisioningState`
- `ensureProvisioningState`
- `completeProvisioningStep`
- `setProvisioningStatus`
- `markOwnerInvited`
- `markOwnerAccepted`

### `services/organization-usage.ts`
- `currentBillingPeriod`
- `recordUsageEvent`
- `refreshUsageSeats`

## Plans / entitlements / billing

### `services/plans.ts`
- `getPlans`
- `getPlanById`
- `getDefaultPlanId`
- `createPlan`
- `updatePlan`
- `setPlanActive`

### `services/entitlements.ts`
Key exports:
- `getUserPlan`
- `canUseFeature`
- `canUsePremiumProject`
- `getOrganizationFeatureEntitlements`
- `isOrganizationServiceEnabled`
- `assertOrganizationService`
- `setOrganizationService`

### `services/billing-math.ts`
Pure billing calculations:
- `calculateOrganizationInvoice`
- `billingPeriodFor`
- `nextBillingDate`

### `services/billing.ts`
- `countOrganizationMembers`
- `getCurrentSubscription`
- `getOrganizationBillingSnapshot`
- `getUsageSnapshot`
- `saveOrganizationSubscription`
- `generateInvoice`
- `listInvoices`
- `listPayments`
- `recordPayment`
- `ingestBillingEvent`

### `services/payments-provider.ts`
Payment abstraction:
- provider type: `none | razorpay | stripe`
- `getPaymentProvider()`

Provider integration remains configuration-dependent.

## Learning engine

### `services/study.ts`
Study library/topics/course-related data access.

### `services/dashboard.ts`
Dashboard aggregation.

### `services/activity.ts`
- `logActivity`

### `services/dsa.ts`
- `getDsaProblems`
- `getDsaProblem`
- `getDsaTopics`
- `getDsaNavigationProblems`

### `services/assessments.ts`
- `createAdaptiveAssessment`
- `getNextQuestion`
- `submitAnswer`
- `finalizeAssessment`
- `getAssessmentWithItems`
- `getAssessmentResult`
- `submitAssessment`

### `services/missions.ts`
Mission generation/read/update functions.

### `services/mistakes.ts`
- `recordMistake`
- `getMistakeIntelligence`
- `getMistakesForSkill`

### `services/mistake-trends.ts`
- `recalculateMistakeTrends`
- `getMistakeTrends`

### `services/reviews.ts`
Spaced review/repetition logic.

### `services/skills.ts`
Skill catalog/mastery/event operations.

### `services/skill-gap.ts`
Skill-gap calculation and prioritization.

### `services/content-quality.ts`
- `refreshContentQuality`

### `services/projects.ts`
- `getPublishedProjects`
- `getUserProjects`
- `getProjectWorkspace`
- `updateMilestone`
- `enrollProject`
- `submitProject`

### `services/interview.ts`
Interview tracks/sessions/answers operations.

### `services/proof.ts`
Skill proof/public profile/verification logic.

### `services/onboarding.ts`
- `getOnboardingStatus`
- `getUserOnboarding`
- `saveOnboarding`
- `completeOnboarding`
- `runDiagnostic`
- `completeDiagnosticAndGenerateMission`

### `services/ai.ts`
AI sessions, messages, explanations, coach, recommendations and admin generation.

## Supabase clients

- `services/supabase-browser.ts` — browser client.
- `services/supabase-server.ts` — server/session-aware client.
- `services/supabase-admin.ts` — server-only service-role client.

Use the admin client only in trusted server code; do not expose service-role credentials to the browser.

---

# 7. Database map

The current data model is split into:

1. Platform/auth
2. Learning/content
3. Skill/adaptive learning
4. AI
5. Proof/interview/projects
6. Organization/B2B
7. Billing/usage

`supabase/database.sql` contains the base schema. The B2B migration adds the commercial/provisioning layer.

## 7.1 Platform/auth

### `profiles`
```text
id uuid PK
name text
role text
status text
suspended_at timestamptz
suspended_by uuid
suspension_reason text
created_at timestamptz
```

**Important:** email is NOT stored here; email comes from `auth.users`.

### `platform_settings`
```text
id integer PK
brand text
maintenance boolean
notify_admin boolean
compact boolean
updated_by uuid
updated_at timestamptz
```

### `user_entitlements`
```text
user_id uuid PK
plan text
status text
current_period_end timestamptz
provider text
provider_customer_id text
provider_subscription_id text
updated_at timestamptz
```

## 7.2 Study/content core

### `study_categories`
```text
id uuid PK
name text
slug text
published boolean
description text
icon text
sort_order int
created_at timestamptz
```

### `study_modules`
```text
id uuid PK
category_id uuid
name text
slug text
description text
published boolean
sort_order int
```

### `study_topics`
```text
id uuid PK
category_id uuid
module_id uuid
title text
slug text
difficulty text
estimated_minutes int
summary text
concept text
explanation text
mental_model text
real_example text
code_example text
code_language text
output text
common_mistakes jsonb
practice_task text
interview_questions jsonb
published boolean
sort_order int
```

### `courses`
```text
id uuid PK
title text
slug text
description text
access_type text
price numeric
unlock_days int
required_progress int
passing_score int
certificate_enabled boolean
published boolean
created_at timestamptz
```

### `course_categories`
```text
course_id uuid PK/FK
category_id uuid PK/FK
sort_order int
```

### `course_topics`
```text
course_id uuid PK/FK
topic_id uuid PK/FK
sort_order int
```

### `enrollments`
```text
id uuid PK
user_id uuid
course_id uuid
started_at timestamptz
completed_at timestamptz
```

### `topic_progress`
```text
user_id uuid PK/FK
topic_id uuid PK/FK
progress int
status text
last_studied_at timestamptz
completed_at timestamptz
```

### `study_schedules`
```text
id uuid PK
user_id uuid
topic_id uuid
title text
starts_at timestamptz
duration_minutes int
status text
```

### `personal_notes`
```text
id uuid PK
user_id uuid
topic_id uuid
content text
updated_at timestamptz
```

### `bookmarks`
```text
user_id uuid PK/FK
topic_id uuid PK/FK
created_at timestamptz
```

## 7.3 Tests / questions / DSA

### `questions`
```text
id uuid PK
category_id uuid
topic_id uuid
prompt text
type text
options jsonb
answer jsonb
explanation text
difficulty int
published boolean
```

Browser clients use safe views where configured; answer-bearing base data should remain protected.

### `tests`
```text
id uuid PK
title text
course_id uuid
topic_id uuid
duration_minutes int
passing_score int
unlock_days int
required_progress int
max_attempts int
random_questions boolean
random_options boolean
published boolean
```

### `test_questions`
```text
test_id uuid PK/FK
question_id uuid PK/FK
sort_order int
```

### `test_attempts`
```text
id uuid PK
user_id uuid
test_id uuid
started_at timestamptz
submitted_at timestamptz
score int
passed boolean
suspicious_events jsonb
```

### `test_answers`
```text
attempt_id uuid PK/FK
question_id uuid PK/FK
answer jsonb
is_correct boolean
```

### `dsa_topics`
```text
id uuid PK
name text
slug text
description text
published boolean
sort_order int
created_at timestamptz
```

### `dsa_problems`
```text
id uuid PK
topic_id uuid
title text
slug text
difficulty text
pattern text
summary text
problem text
examples text
hint text
brute_force text
optimized text
time_complexity text
space_complexity text
starter_code text
solution text
test_cases jsonb
published boolean
```

### `dsa_submissions`
```text
id uuid PK
user_id uuid
problem_id uuid
language text
source_code text
status text
score int
runtime_ms int
memory_kb int
created_at timestamptz
```

## 7.4 Skills / adaptive learning

### `skills`
```text
id uuid PK
name text
slug text
description text
category text
published boolean
sort_order int
created_at timestamptz
```

### `skill_topics`
```text
id uuid PK
skill_id uuid
parent_id uuid
name text
slug text
description text
published boolean
sort_order int
```

### `user_skill_mastery`
```text
user_id uuid PK/FK
skill_id uuid PK/FK
mastery_score int
confidence_score int
attempts int
successful_attempts int
last_activity_at timestamptz
updated_at timestamptz
```

### `skill_events`
```text
id uuid PK
user_id uuid
skill_id uuid
topic_id uuid
event_type text
score int
source text
entity_type text
entity_id uuid
metadata jsonb
created_at timestamptz
```

### `skill_gap_snapshots`
```text
id uuid PK
user_id uuid
skill_id uuid
gap_score int
priority text
reason text
generated_at timestamptz
```

### `assessment_blueprints`
```text
id uuid PK
skill_id uuid
title text
description text
difficulty text
question_count int
passing_score int
published boolean
created_at timestamptz
```

### `adaptive_assessments`
```text
id uuid PK
user_id uuid
blueprint_id uuid
status text
current_difficulty int
score int
started_at timestamptz
submitted_at timestamptz
```

### `adaptive_assessment_items`
```text
id uuid PK
assessment_id uuid
question_id uuid
position int
difficulty int
answered boolean
is_correct boolean
```

### `learning_missions`
```text
id uuid PK
user_id uuid
mission_date date
title text
description text
status text
generated_by text
created_at timestamptz
updated_at timestamptz
```

### `learning_mission_items`
```text
id uuid PK
mission_id uuid
position int
item_type text
skill_id uuid
topic_id uuid
dsa_problem_id uuid
assessment_id uuid
target_minutes int
status text
completed_at timestamptz
```

### `learning_reviews`
```text
id uuid PK
user_id uuid
skill_id uuid
topic_id uuid
dsa_problem_id uuid
source_type text
source_id uuid
stability numeric
difficulty numeric
interval_days int
repetitions int
lapses int
last_reviewed_at timestamptz
due_at timestamptz
last_grade int
quality text
created_at timestamptz
updated_at timestamptz
```

### Mistake tables

`mistake_categories`
```text
code text PK
label text
description text
```

`mistake_logs`
```text
id uuid PK
user_id uuid
source text
source_id uuid
skill_id uuid
category text
severity int
description text
metadata jsonb
created_at timestamptz
```

`mistake_trends`
```text
id uuid PK
user_id uuid
category text
occurrence_count int
resolved_count int
severity_score int
first_seen_at timestamptz
last_seen_at timestamptz
metadata jsonb
```

## 7.5 AI

### `ai_sessions`
```text
id uuid PK
user_id uuid
session_type text
skill_id uuid
topic_id uuid
problem_id uuid
created_at timestamptz
updated_at timestamptz
```

### `ai_messages`
```text
id uuid PK
session_id uuid
role text
content text
token_count int
created_at timestamptz
```

### `ai_feedback`
```text
id uuid PK
user_id uuid
session_id uuid
rating smallint
helpful boolean
comment text
created_at timestamptz
```

### `learning_recommendations`
```text
id uuid PK
user_id uuid
skill_id uuid
topic_id uuid
recommendation_type text
title text
reason text
priority int
source text
expires_at timestamptz
completed_at timestamptz
created_at timestamptz
```

## 7.6 Projects / interviews / proof

### `projects`
```text
id uuid PK
title text
slug text
description text
difficulty text
skills jsonb
requirements jsonb
starter_repo_url text
published boolean
premium boolean
created_at timestamptz
updated_at timestamptz
```

### `project_enrollments`
```text
id uuid PK
user_id uuid
project_id uuid
status text
progress int
started_at timestamptz
completed_at timestamptz
```

### `project_submissions`
```text
id uuid PK
enrollment_id uuid
user_id uuid
project_id uuid
repo_url text
demo_url text
notes text
status text
score int
submitted_at timestamptz
reviewed_at timestamptz
```

### `project_milestones`
```text
id uuid PK
project_id uuid
title text
description text
sort_order int
target_minutes int
required boolean
created_at timestamptz
```

### `project_milestone_progress`
```text
user_id uuid PK/FK
milestone_id uuid PK/FK
enrollment_id uuid
status text
completed_at timestamptz
updated_at timestamptz
```

### `interview_tracks`
```text
id uuid PK
name text
slug text
description text
published boolean
created_at timestamptz
```

### `interview_questions`
```text
id uuid PK
track_id uuid
category text
prompt text
difficulty int
expected_points jsonb
published boolean
created_at timestamptz
```

### `interview_sessions`
```text
id uuid PK
user_id uuid
track_id uuid
mode text
status text
score int
started_at timestamptz
submitted_at timestamptz
```

### `interview_answers`
```text
id uuid PK
session_id uuid
user_id uuid
question_id uuid
answer text
score int
feedback text
created_at timestamptz
```

### `placement_readiness_snapshots`
```text
id uuid PK
user_id uuid
overall_score int
dsa_score int
core_cs_score int
projects_score int
assessment_score int
interview_score int
consistency_score int
strengths jsonb
gaps jsonb
calculated_at timestamptz
```

### Proof tables

`skill_profiles`
```text
user_id uuid PK
headline text
bio text
is_public boolean
share_slug text
updated_at timestamptz
```

`verified_assessments`
```text
id uuid PK
user_id uuid
assessment_id uuid
skill_id uuid
score int
verification_code text
verified_at timestamptz
revoked_at timestamptz
```

`skill_evidence`
```text
id uuid PK
user_id uuid
skill_id uuid
evidence_type text
entity_id uuid
score int
verified boolean
created_at timestamptz
```

`public_skill_profiles`
```text
user_id uuid PK
share_slug text
enabled boolean
display_name text
headline text
generated_at timestamptz
```

## 7.7 Organization / B2B core

### `organizations`
Base + migration fields:
```text
id uuid PK
name text
slug text UNIQUE
kind text
status text
plan text
created_at timestamptz
updated_at timestamptz
legal_name text
phone text
official_email text
website text
address text
city text
state text
country text
postal_code text
contact_person text
notes text
internal_notes text
suspended_reason text
suspended_at timestamptz
plan_id uuid FK -> organization_plan_definitions.id
```

### `organization_members`
Base + lifecycle fields:
```text
organization_id uuid PK/FK
user_id uuid PK/FK
role text
joined_at timestamptz
status text
role_valid boolean
deactivated_at timestamptz
last_seen_at timestamptz
```

Roles:
```text
owner | admin | mentor | student
```

### `organization_invites`
```text
id uuid PK
organization_id uuid
email text
role text
token_hash text UNIQUE
created_by uuid
accepted_by uuid
created_at timestamptz
expires_at timestamptz
accepted_at timestamptz
status text
revoked_at timestamptz
revoked_by uuid
```

Invite roles:
```text
owner | admin | mentor | student
```

### `organization_audit_logs`
```text
id bigint PK
organization_id uuid
actor_user_id uuid
action text
entity_type text
entity_id uuid
metadata jsonb
created_at timestamptz
```

### `organization_departments`
```text
id uuid PK
organization_id uuid
name text
description text
archived boolean
created_at timestamptz
```

### `organization_batches`
```text
id uuid PK
organization_id uuid
department_id uuid
name text
code text
start_year int
end_year int
mentor_id uuid
archived boolean
created_at timestamptz
```

### `batch_members`
```text
batch_id uuid PK/FK
user_id uuid PK/FK
joined_at timestamptz
```

### `organization_assignments`
```text
id uuid PK
organization_id uuid
batch_id uuid
title text
description text
target_type text
target_id uuid
due_at timestamptz
status text
created_by uuid
created_at timestamptz
```

Target types:
```text
course | topic | test | dsa | project | skill
```

### `assignment_attempts`
```text
assignment_id uuid PK/FK
user_id uuid PK/FK
score int
status text
submitted_at timestamptz
```

### `organization_skill_snapshots`
```text
id uuid PK
organization_id uuid
batch_id uuid
skill_id uuid
average_score int
learner_count int
calculated_at timestamptz
```

### `organization_placement_snapshots`
```text
id uuid PK
organization_id uuid
batch_id uuid
readiness_score int
learner_count int
strengths jsonb
gaps jsonb
calculated_at timestamptz
```

## 7.8 B2B commercial/provisioning migration

### `organization_plan_definitions`
```text
id uuid PK
code text
name text
description text
billing_model text
monthly_price numeric
yearly_price numeric
included_student_seats int
extra_student_seat_price numeric
included_faculty_seats int
extra_faculty_seat_price numeric
included_ai_usage numeric
feature_flags jsonb
services jsonb
currency text
active boolean
created_at timestamptz
updated_at timestamptz
```

### `organization_provisioning`
```text
organization_id uuid PK
current_step int
total_steps int
completed_steps jsonb
status text
owner_invite_id uuid
onboarding_completed boolean
updated_at timestamptz
```

### `organization_feature_entitlements`
```text
organization_id uuid PK/FK
service text PK
enabled boolean
quota numeric
quota_unit text
current_usage numeric
updated_at timestamptz
```

### `organization_billing_profiles`
```text
organization_id uuid PK
billing_email text
billing_phone text
address text
city text
state text
country text
postal_code text
tax_id text
currency text
payment_provider text
provider_customer_id text
created_at timestamptz
updated_at timestamptz
```

### `organization_subscriptions`
```text
id uuid PK
organization_id uuid
plan_id uuid
billing_cycle text
billing_model text
status text
currency text
seat_count int
active_student_count int
faculty_count int
amount numeric
billing_period_start timestamptz
billing_period_end timestamptz
next_billing_date timestamptz
payment_provider text
provider_subscription_id text
created_at timestamptz
updated_at timestamptz
```

### `organization_invoices`
```text
id uuid PK
organization_id uuid
subscription_id uuid
invoice_number text
status text
currency text
base_amount numeric
seat_count int
extra_seats int
faculty_count int
extra_faculty int
extra_seat_charge numeric
extra_faculty_charge numeric
tax_amount numeric
total_amount numeric
billing_period_start timestamptz
billing_period_end timestamptz
issue_date timestamptz
due_date timestamptz
paid_at timestamptz
provider text
provider_invoice_id text
metadata jsonb
created_at timestamptz
updated_at timestamptz
```

### `organization_invoice_items`
```text
id uuid PK
invoice_id uuid
kind text
description text
quantity numeric
unit_amount numeric
amount numeric
created_at timestamptz
```

### `organization_payments`
```text
id uuid PK
organization_id uuid
invoice_id uuid
amount numeric
currency text
provider text
provider_payment_id text
status text
paid_at timestamptz
failure_reason text
idempotency_key text
metadata jsonb
created_at timestamptz
```

### `billing_events`
```text
id bigint PK
organization_id uuid
provider text
provider_event_id text
event_type text
payload jsonb
process_status text
received_at timestamptz
processed_at timestamptz
```

### `organization_usage`
```text
id bigint PK
organization_id uuid
period text
student_seats_used int
faculty_seats_used int
ai_requests int
ai_usage_units numeric
storage_bytes bigint
updated_at timestamptz
```

### `organization_usage_events`
```text
id bigint PK
organization_id uuid
usage_type text
quantity numeric
unit text
user_id uuid
metadata jsonb
created_at timestamptz
```

### `organization_import_jobs`
```text
id uuid PK
organization_id uuid
imported_by uuid
kind text
status text
filename text
total_rows int
valid_rows int
error_rows int
duplicate_rows int
added_count int
invited_count int
already_registered_count int
skipped_count int
result jsonb
created_at timestamptz
completed_at timestamptz
```

### `organization_import_rows`
```text
id bigint PK
job_id uuid
raw jsonb
parsed jsonb
status text
errors jsonb
created_at timestamptz
```

### `faculty_assignments`
```text
id uuid PK
organization_id uuid
faculty_user_id uuid
department_id uuid
batch_id uuid
created_by uuid
created_at timestamptz
```

---

# 8. Organization business flow

```text
Platform Admin
   ↓
/admin/organizations
   ↓
Create Organization
   ↓
organizations row
   ↓
Plan + Services + Billing profile + Provisioning state
   ↓
First Owner invite/provision
   ↓
organization_members (owner)
   ↓
Owner login
   ↓
/organization/[slug]
   ↓
Departments
   ↓
Batches
   ↓
Faculty/Mentors
   ↓
Students (one-by-one or CSV)
   ↓
Assignments
   ↓
Student /user
   ↓
Attempts / Progress / Skills / Placement
   ↓
Usage / Billing / Invoices / Audit
```

### Role boundaries

```text
Platform Admin
  - platform-wide organization provisioning
  - plans/services
  - billing administration
  - suspend/resume
  - platform analytics/audit
  - backup/restore

Organization Owner
  - full organization operations
  - members/faculty/students
  - departments/batches
  - assignments
  - organization settings
  - billing/usage visibility

Organization Admin
  - organization operations within allowed hierarchy
  - cannot become platform admin
  - cannot bypass organization tenant isolation

Mentor
  - assigned scope only
  - assigned students/batches
  - progress/assignments/skill monitoring according to scope

Student
  - learner workspace
  - organization assignments/context
  - personal learning data
```

---

# 9. Where to edit what

| Task | Primary file(s) |
|---|---|
| Login behavior | `app/auth/login/page.tsx`, `services/auth.ts`, `services/workspace.ts`, `app/api/auth/workspace/route.ts` |
| Platform admin permissions | `services/auth.ts`, `services/security.ts`, relevant `/app/api/admin/*` route |
| Organization permissions | `services/organization.ts`, `services/org-members.ts`, `services/workspace.ts` |
| Organization portal navigation | `app/organization/_components/org-shell.tsx` |
| Organization page | `app/organization/[slug]/page.tsx` |
| Students | `services/org-students.ts`, `app/api/organization/students/route.ts`, `app/organization/[slug]/students/page.tsx` |
| Faculty | `services/org-faculty.ts`, `app/api/organization/faculty/route.ts`, `app/organization/[slug]/faculty/page.tsx` |
| Departments/Batches | `services/org-structure.ts`, `app/api/organization/structure/route.ts` |
| Members/invites | `services/org-members.ts`, `app/api/organization/members/route.ts` |
| Audit | `services/org-audit.ts`, `app/api/organization/audit/route.ts` |
| Monitoring | `services/org-monitoring.ts`, `app/api/organization/monitoring/route.ts` |
| Plan catalog | `services/plans.ts`, `app/api/admin/plans/route.ts` |
| Organization services | `services/entitlements.ts`, `app/api/organization/entitlements/route.ts` |
| Billing calculations | `services/billing-math.ts` |
| Billing DB logic | `services/billing.ts` |
| Payment provider | `services/payments-provider.ts` |
| Provisioning | `services/organization-provisioning.ts`, `app/api/admin/organizations/[id]/provisioning/route.ts` |
| Organization profile/settings | `services/org-settings.ts`, `app/api/organization/settings/route.ts` |
| Backup | `app/api/admin/backup/route.ts`, `app/admin/backup/page.tsx` |
| Restore | `app/api/admin/backup/restore/route.ts` |
| Learning skills | `services/skills.ts`, `services/skill-gap.ts` |
| AI | `services/ai.ts`, `app/api/ai/*` |
| Projects | `services/projects.ts`, `app/api/projects/route.ts` |
| Interviews | `services/interview.ts`, `app/api/interview/route.ts` |
| Onboarding | `services/onboarding.ts`, `app/api/onboarding/*` |

---

# 10. Database change workflow

### Existing schema files

```text
supabase/database.sql
supabase/migrations/20260913_organization_b2b_completion.sql
supabase/migrations/20260914_production_hardening.sql
```

### When adding a column

Use a new additive migration:

```sql
alter table public.some_table
add column if not exists new_column text;
```

### When adding a table

```sql
create table if not exists public.some_table (...);
```

Then add:
- RLS
- policies
- indexes
- foreign keys/constraints
- grants

### Never do this in a production update

```sql
drop schema public cascade;
drop table existing_table;
```

unless a deliberate, separately reviewed migration explicitly requires it.

---

# 11. Local development

### Install

```bash
npm install
```

### Environment

Copy `.env.example` to `.env.local` and provide the Supabase values required by the project.

### Development

```bash
npm run dev
```

### Typecheck

```bash
npm run typecheck
```

### Build

```bash
npm run build
```

### Combined verification

```bash
npm run verify
```

### Runtime verification script

```bash
npm run verify:runtime
```

---

# 12. Safe update checklist

Before changing anything:

1. Search this document for the feature/table/route.
2. Open the primary service file.
3. Open the API route if the change is a mutation.
4. Open the page/component if the change is UI.
5. Check the related SQL table and RLS policy.
6. Preserve existing role and tenant checks.
7. Add a migration instead of modifying production data destructively.
8. Run `npm run typecheck`.
9. Run `npm run build`.
10. Manually test the affected flow in the browser against the real Supabase project.

---

# 13. Common debugging map

### "Could not find a relationship between X and Y in the schema cache"

Do not immediately add a random foreign key.

First inspect the actual schema.

If the table does not have an FK suitable for the relationship, fetch the parent/lookup rows separately and merge them server-side.

Example pattern:

```ts
const members = await supabase
  .from('organization_members')
  .select('user_id,role,status');

const userIds = members.map((m) => m.user_id);

const profiles = await supabase
  .from('profiles')
  .select('id,name')
  .in('id', userIds);
```

For email, use `auth.users`/Admin Auth when the server has the required privilege; do not assume `profiles.email` exists.

### "Permission denied"

Check in this order:

1. authenticated session
2. route-level authorization
3. service-level authorization
4. RLS
5. grants
6. organization status/member status

### Organization user gets `/admin`

Inspect:
- `profiles.role`
- `organization_members.role`
- `services/workspace.ts`

Platform admin and organization owner/admin are separate role systems.

### Organization owner cannot load portal

Check:
- membership exists
- `role = owner`
- `status = active`
- organization `status = active`
- slug matches
- server layout membership check

### Billing looks wrong

Start with:

```text
services/billing-math.ts
        ↓
services/billing.ts
        ↓
organization_subscriptions
organization_usage
organization_invoices
```

Do not duplicate billing math in the page.

---

# 14. B2B tables at a glance

```text
organizations
├── organization_members
├── organization_invites
├── organization_audit_logs
├── organization_departments
│   └── organization_batches
│       └── batch_members
├── organization_assignments
│   └── assignment_attempts
├── organization_skill_snapshots
├── organization_placement_snapshots
├── organization_entitlements
├── organization_plan_definitions
├── organization_provisioning
├── organization_feature_entitlements
├── organization_billing_profiles
├── organization_subscriptions
├── organization_invoices
│   └── organization_invoice_items
├── organization_payments
├── billing_events
├── organization_usage
│   └── organization_usage_events
├── organization_import_jobs
│   └── organization_import_rows
└── faculty_assignments
```

---

# 15. Production notes

The project contains the B2B billing domain, invoice/payment persistence and payment-provider abstraction. A real payment provider still depends on valid provider configuration and live credentials.

The database schema is intentionally split between the base `database.sql` and additive B2B migrations. When shipping to a fresh Supabase project, apply the base schema first and then the migrations in order.

Build/typecheck success is not the same as live production verification. Real authentication, RLS, webhook signatures, provider payments and browser E2E should be verified against the real environment before production launch.

---

# 16. Quick feature index

| Feature | Main backend | Main API | Main UI |
|---|---|---|---|
| Auth | `auth.ts`, `workspace.ts` | `/api/auth/workspace` | `/auth/login` |
| Platform organizations | `organization.ts`, `organization-provisioning.ts` | `/api/organization`, `/api/admin/organizations/[id]/provisioning` | `/admin/organizations` |
| Members | `org-members.ts` | `/api/organization/members` | `/organization/[slug]/members` |
| Students | `org-students.ts` | `/api/organization/students` | `/organization/[slug]/students` |
| Faculty | `org-faculty.ts` | `/api/organization/faculty` | `/organization/[slug]/faculty` |
| Departments/Batches | `org-structure.ts` | `/api/organization/structure` | `/organization/[slug]/departments`, `/batches` |
| Assignments | `organization.ts` / existing assignment logic | `/api/organization/assignments`, `/api/organization/manage` | `/organization/[slug]/assignments` |
| Monitoring | `org-monitoring.ts` | `/api/organization/monitoring` | organization dashboard |
| Audit | `org-audit.ts` | `/api/organization/audit` | `/organization/[slug]/audit` |
| Plans | `plans.ts` | `/api/admin/plans` | organization admin detail |
| Entitlements | `entitlements.ts` | `/api/organization/entitlements` | plan/services tab |
| Billing | `billing.ts`, `billing-math.ts` | `/api/organization/billing` | `/organization/[slug]/billing` |
| Payments | `payments-provider.ts`, `billing.ts` | billing APIs | billing UI |
| Bulk imports | `org-students.ts` | `/api/organization/students` | Students page |
| AI | `ai.ts` | `/api/ai/*` | `/user` AI features + `/admin/ai` |
| Skills | `skills.ts`, `skill-gap.ts` | `/api/skills/*` | learner/admin analytics |
| Projects | `projects.ts` | `/api/projects` | `/user/projects` |
| Interviews | `interview.ts` | `/api/interview` | `/user/interview` |
| Proof | `proof.ts` | `/api/proof/*` | public/user proof pages |
| Backup | backup route | `/api/admin/backup` | `/admin/backup` |
| Restore | restore route | `/api/admin/backup/restore` | `/admin/backup` |

---

# 17. How to use this file during future updates

Example: “Add a college attendance feature.”

```text
1. Search this file for organization tables.
2. Add attendance tables in a NEW migration.
3. Add service: services/org-attendance.ts
4. Add route: app/api/organization/attendance/route.ts
5. Add page: app/organization/[slug]/attendance/page.tsx
6. Wire authorization through organization.ts/security.ts.
7. Add RLS/indexes.
8. Add the feature to the organization portal navigation.
9. Update the API section and DB section of this Development.md.
10. Run typecheck + build + browser test.
```

This keeps future work localized instead of rescanning the whole codebase every time.
