# Adminhub implementation plan

**Organization:** matx
**State:** Planning only; no application feature is implemented by this document.
**Baseline:** Existing Next.js/TypeScript scaffold at `72580499c852f90856d2f3a4f2efb64395930242`; see [repository audit](repository-audit.md).
**Decision:** Extend the checkout rather than reinitialize it. Keep the existing App Router, Tailwind, Prisma, and UI primitives. Do not remove application files without a specific replacement and migration rationale.

## Assumptions and decision gates

- `matx` is the organization name; its industry and business purpose are **not supplied**. Do not invent financial, legal, or operational rules. No billing/revenue metrics without actual billing data.
- `[MAIN ENTITY NAME]` is unspecified. A neutral, organization-scoped **Record** represents generic submissions/work items until matx defines its domain. Give it generic title, description, status, dates, category, owner, and assignee fields. Domain-specific custom fields need versioned, validated schemas, not arbitrary executable JSON. Rename only with a migration and API compatibility plan once the real entity is confirmed.
- Begin with one seeded organization and organization-scoped queries throughout; cross-organization access is denied unless explicitly authorized. Self-registration is **off** by default, so super administrators invite accounts. Super-admin bootstrap is an explicit, one-time development/operations procedure, never a hard-coded default password.
- Use NextAuth/Auth.js credentials with database-backed revocable sessions **only if the chosen adapter supports the required session behavior**; otherwise implement an audited opaque-session service using hashed session tokens. Choose and document one path before exposing login. Email verification/reset tokens must be hashed at rest and single use.
- For development, use local filesystem storage outside `public/` and a local email outbox (not real delivery). Production adapters are S3-compatible storage and an email provider behind interfaces. Disable upload availability until scanning policy/provider is selected; fail closed on malware scan failures in production.
- 2FA, social login, push, scheduled messages/reports, virus scanning, and billing need policy/integration decisions. Provide documented interfaces and explicit disabled states, **not** unfinished security flows presented as enabled features.
- Confirm privacy retention, record classification, file scanning, organizational tenancy, and required separation of duties before releasing features handling sensitive data. These are product/release gates, not reasons to invent business details.

## Architecture and code boundaries

Use Next.js App Router/React/TypeScript strict mode. Server components fetch read models through services; route handlers under `src/app/api/v1` and narrowly scoped server actions handle mutations. Shared services authorize, validate Zod input, perform Prisma transactions, append privacy-safe audit events and notifications, and map failures to stable API error codes. Never import Prisma, secrets, or authorization policy internals into client components. No client-hidden control is an authorization boundary.

```text
src/app/(auth)/                 login, verify, reset flows
src/app/(dashboard)/            authenticated layouts and protected pages
src/app/api/v1/                versioned API handlers
src/components/ui/             shared accessible primitives (extend existing Button/Card)
src/components/{layout,forms,tables,charts}/
src/features/{auth,users,roles,permissions,dashboard,departments,teams,records,approvals,tasks,notifications,files,reports,audit-logs,settings}/
src/lib/{auth,db,permissions,validation,security,storage,email}/
src/server/{services,repositories,policies}/
src/tests/                     unit/component/API/database fixtures
prisma/{schema.prisma,migrations/,seed.ts}
docs/                          API, architecture, database, security, ops, administrator guide
.github/workflows/             CI and security scanning
```

Keep API handlers thin; use repository functions that always receive scope (organization ID, actor, permitted department/team), never accept a client-supplied organization ID as authority. Use Prisma select/projection and batched reads to avoid N+1. Normalize query parameters with one pagination/filter/sort schema; allowlist searchable/sortable columns, bound result sizes, and add indexes matching actual query plans. Serialize enums and timestamps consistently. Return `{ success: true, data, message, pagination? }` or `{ success: false, error: { code, message, details? } }`; validation=400, unauthenticated=401, forbidden=403, missing/hidden=404, conflict=409, rate limited=429. Do not return stack traces or secrets.

## Data and migration design

Extend the current four **placeholder** Prisma models; do not use the existing raw `Session.token` or `User.role` as the finished security model. Add one reviewed initial migration and subsequent additive migrations; avoid `db push` against production. UUID keys, timestamps, foreign keys, uniqueness/indexes, and soft deletion are mandatory where applicable. Seed permission definitions and synthetic development accounts only in an explicitly development-only seed workflow.

| Domain | Planned models and constraints |
| --- | --- |
| Identity | `User` (normalized email, password hash, verified/suspended/deleted timestamps, org FK); `Role`, `Permission`, `UserRole`, `RolePermission` with unique `(org, user, role)`/`(role, permission)`; `Session` (hashed token, expiry, revoked timestamp, user/org FK, last-seen); hashed `VerificationToken`, `PasswordResetToken`; `LoginAttempt`/`LoginHistory`, optional 2FA enrollment/recovery data encrypted or hashed appropriately. |
| Organization | `Organization` (locale, timezone, currency), `Department`, `Team`, `TeamMember`, `StaffProfile`, `Assignment`, `WorkSchedule`, `PerformanceNote`; composite unique names within organization, membership references and manager scope. |
| Records | `Record` (org, owner/assignee/reviewer FKs, category, priority, due date, lifecycle, `deletedAt`, `archivedAt`), `Category`, `Tag`/`RecordTag`, validated `CustomFieldDefinition`/`RecordFieldValue`, `EntityStatusHistory`, `EntityAttachment`, `ApprovalDecision`, `Comment`; append status transitions and reject/approve events transactionally with the record. |
| Work/communication | `Task` (org, team/assignee, parent, due date, recurrence rule, status), `TaskReminder`, `TaskAttachment`, `Notification` (recipient, type, read/deleted timestamp), `NotificationPreference`, `NotificationTemplate`, `Message`/`Announcement` and delivery history if applicable. |
| Files/audit/settings | `File` (owner, folder, opaque key, MIME, length, scan state, visibility, deletedAt), `FileFolder`; `AuditLog` (event ID, actor, scoped entity, action, sanitized before/after, createdAt, optional lawful IP/agent); `SystemSetting` with org/category/key uniqueness, typed validated value, non-secret values only; `SavedReportFilter`/scheduled-report configuration when implemented. |

Indexes: `(organizationId, status, createdAt)`, `(organizationId, assigneeId, dueAt)`, `(organizationId, deletedAt)`, `(userId, revokedAt, expiresAt)`, `(recipientId, readAt)`, `(entityType, entityId, createdAt)` plus email uniqueness and relationship indexes. Validate on PostgreSQL using generated migrations and constraints. Place login/approval/role/delete actions and their audit writes in one transaction; notifications may be queued via transactional outbox if delivery is asynchronous. Build soft-delete filters into read services and test them; no implicit hard delete.

## Authentication and authorization

Server-side policy entry points: `requireSession()`, `authorize(actor, permission, scope)`, `canReadRecord`, `canManageUser`, `canApproveRecord`, and `requireSettingPermission`. Refresh or re-evaluate effective permissions from DB on privileged actions; do not trust a long-lived role claim. Session cookies: `HttpOnly`, `Secure` in production, `SameSite=Lax` or stricter; origin/CSRF defenses for cookie-authenticated mutations. Passwords: adaptive hashing (Argon2id or vetted bcrypt), strength checks, throttled failed attempts backed by shared storage, generic account recovery responses, token expiry and single use. Revoke sessions on suspension, password reset, role changes where appropriate, and logout-all; enumerate/revoke active sessions safely. Verify email before protected access. Remember-me changes expiry, not cookie security.

Permission keys are scoped actions (e.g. `users.read`, `users.write`, `users.roles.write`, `staff.write`, `records.read`, `records.write`, `records.approve`, `tasks.write`, `files.read`, `files.write`, `reports.read`, `audit.read`, `settings.organization.write`, `settings.security.write`). Defaults:

| Capability | Super admin | Admin | Manager | Staff | User |
| --- | --- | --- | --- | --- | --- |
| Global settings, roles, admin promotion, audit | All | No super-admin/account-secret operations; delegated settings only | No | No | No |
| Users/staff/teams | All | Organization-scoped, delegated; cannot remove/downgrade super admin | Assigned departments/teams, no admin accounts | Own profile only | Own profile only |
| Records/tasks/approvals | All; no separation-of-duties bypass unless policy explicitly allows | Organization-scoped permissions | Assigned department/team | Assigned items; permitted comments/uploads | Own submissions/notifications only |
| Files/reports/communications | All subject to privacy classification | Delegated and scoped | Assigned scope | Assigned scope | Own files/notifications only |

Role grants never defeat object/tenant ownership, privacy classification, account-state checks, or separation of duties. Bootstrap a single super-admin role; disallow deleting/downgrading the final active super admin. Protect self-escalation, peer-admin changes, another user's private data, and exports with server policy tests. Define admin-specific delegated permissions in DB; avoid an unconditional string-role shortcut.

## Routes, UI, and API

| Pages | Behavior/components |
| --- | --- |
| `/`, `/login`, `/verify-email`, `/forgot-password`, `/reset-password`, `/auth/error` | Truthful home, validated auth forms, generic recovery messaging, session/lockout feedback; registration only when configured. |
| `/dashboard` | Guarded shell; actual aggregate queries for users/records/tasks/approvals; recent activity/alerts, date and department filters, day/week/month/year charts, CSV export, permission-filtered widgets. |
| `/users`, `/users/new`, `/users/[id]`, `/roles`, `/permissions`, `/departments`, `/teams`, `/staff` | Reusable list/detail/form; filters/sort/page/search, import/export, bulk actions, notes, invites, sessions, staff assignments, scoped edits. |
| `/records`, `/records/new`, `/records/[id]` | CRUD, archive/restore/soft-delete, reviewer and history, comments/notes, tags/categories/custom fields, printable details, CSV, status transitions. |
| `/tasks`, `/tasks/calendar`, `/tasks/kanban`, `/notifications`, `/files` | Lists and alternate task views; reminders; notification inbox/preferences; upload/search/preview/restore/download, access-controlled signed links. |
| `/reports`, `/audit-logs`, `/settings/{organization,security,notifications,files,system}`, `/profile`, `/sessions` | Sensitive reports and exports; filtered safe audit reads; category-level settings checks; own profile and device revocation. |

API: `/api/v1/auth/{login,logout,verify-email,forgot-password,reset-password,sessions}`, `/api/v1/users` and `/api/v1/users/[id]` (status, roles, invitation, session subroutes), `/api/v1/{departments,teams,staff}`, `/api/v1/records` and `/api/v1/records/[id]/{status,comments,attachments}`, `/api/v1/{tasks,notifications,files,reports,audit-logs,settings}`, `/api/v1/files/[id]/download`, CSV import/export routes, and `/api/v1/health` (no sensitive details). Route methods and payload/error/permission tables go in `docs/api.md` or generated OpenAPI with security schemes. Mutation-specific rate limits and idempotency for imports/invitations; never expose arbitrary storage paths.

UI system: extend the existing color tokens, `Button`, `Card`, and Tailwind config; add accessible sidebar/topbar/breadcrumbs, mobile drawer, light/dark toggle, cards, RHF/Zod form fields, reusable server-paginated table with debounced search and allowlisted filters/sorting, date ranges/saved views, dialogs/confirmations, toast, loading skeleton, empty/error/retry states, and keyboard-visible focus. Dialogs manage focus/escape; fields associate errors; status text supplements colors. Test mobile/tablet/desktop and WCAG 2.2 AA target. Shared components do not embed permission enforcement; route/service guards do.

## Delivery phases and exit gates

Complete each phase in a reviewable change, then report **files changed, commands run/outcomes, tests completed, known issues/assumptions, next phase**. Do not claim a later phase is complete because scaffolding exists.

1. **Inspect (completed in this planning pass):** Audit the checkout and original docs/config; record real inventory and blockers in `docs/repository-audit.md`. No application code touched.
2. **Plan (this pass):** Reconcile previous plan with actual repo, specify models, routes, components, RBAC, acceptance tests, security, deployment, sequencing in this document.
3. **Confirm only material ambiguity:** Use the neutral `Record` and explicitly state matx purpose unknown; seek actual entity name/business workflow before any domain-specific rules. Document defaults for registration, organization scope, providers, and privacy gates.
4. **Foundation:** Fix `.mjs` syntax and Next/ESLint compatibility; pin Node/package manager, create lockfile from verified install, baseline environment validation, truthful home copy, error boundaries, Vitest/Playwright config, README/setup and Copilot guidance. Gate: clean install, lint, typecheck, unit smoke test, build succeed.
5. **Database:** Replace placeholder schema with normalized models above, checked-in PostgreSQL migrations and development-only seed; add `src/lib/db`, transaction and scoped pagination helpers. Gate: migration from empty DB and DB constraint/soft-delete tests.
6. **Authentication/RBAC:** Implement credential flow, verification/reset, lockout, sessions/remember-me/logout-all, central policies, server guards, role management, revocation, audited actions. Gate: unauthenticated/normal-user denial, scoped manager and admin escalation negative tests.
7. **Shared shell/design:** Accessible protected layout, mobile navigation, theme, common form/table/filter/dialog/confirm/skeleton/error components. Gate: component, keyboard, focus, contrast and responsive tests.
8. **Dashboard:** Authenticated, DB-backed metrics, bounded trends, charts, filters/export/activity/alerts; no invented data. Gate: query aggregation tests (including empty data and failed query) and E2E guard.
9. **Identity/organization:** Users/staff/roles/departments/teams/profile/invites, search, pagination, status, CSV, bulk updates, permissions and audited actions. Gate: cross-user/tenant access denial and critical CRUD E2E.
10. **Records/approvals:** Generic Record CRUD, statuses (draft/submitted/under-review/approved/rejected/needs-changes/archived), reviewer assignments, separation-of-duties, history, comments/attachments/tags/custom fields/import/export. Gate: atomic transitions, denial, deleted-row invisibility, approval and CSV tests.
11. **Operations:** Tasks/list/calendar/Kanban, recurring scheduling and reminders; notifications/preferences/templates; private file adapter and scanning gate, download authorization; communications only if applicability clarified; reports, safe audit logs and settings. Gate: scoped queries, upload type/size denial, notification delivery, report/export privacy and workflow E2E.
12. **Security/docs/tests:** Rate limits, CSRF, security headers, privacy/data retention, error handling, hardened upload and provider config; API/schema/architecture/security/admin/troubleshooting guides; unit/component/API/DB/E2E/security/accessibility tests.
13. **Verification:** Run format:check, lint, typecheck, unit/component tests, DB integration on migrated PostgreSQL, Playwright role/workflow/mobile tests, dependency audit, and production build from clean install. Track failures and repair scoped defects.
14. **Release review:** Independently assess security, access control, WCAG, responsive behavior, performance/N+1, backup/restore, deployment and rollback; only declare production ready once all release gates and external-provider/privacy decisions are satisfied.

## Acceptance-test matrix

| Requirement | Narrowest automated check |
| --- | --- |
| Unauthenticated dashboard forbidden; normal user cannot reach admin pages | API/page E2E asserts redirect/401/403 and no protected data. |
| Manager restricted to assigned features; admin cannot bypass server checks | Policy unit + API integration with allowed/denied tenant, department, privilege mutation. |
| User cannot edit another private profile | API test with two users and forged IDs; preserve actor scope. |
| Soft-deleted records absent from normal lists | DB/service integration + list E2E; restore requires permission. |
| Invalid data produces useful errors | Zod unit and form/API component tests for labels and field association. |
| Important mutations produce audit logs | Transactional DB test for role change, record approval, settings edit, upload, and export. |
| Invalid file types rejected | Upload endpoint/API test with MIME spoofing, size limit, scanner failure. |
| Search/sort/filter/pagination correct | Repository test for allowlists, counts, stable ordering, scoped results and CSV boundaries. |
| Clean installation and type-safe build | CI installs from lockfile, migrates isolated DB, tests, `npm run typecheck`, `npm run build`. |

Add tests for rate-limit persistence, reset-token replay, session revocation, no self-approval, CSV formula injection, export authorization, XSS-safe rendering, keyboard/focus, empty/error states, and mobile navigation. Use synthetic fixtures and isolated test databases; never use seeded production credentials. For every feature, run narrow checks first, then affected dependents and mandatory release checks.

## Deployment and operations

- Add multi-stage Dockerfile and Compose for **development/test PostgreSQL only**; use managed PostgreSQL and object storage for production. Run `prisma migrate deploy` before rolling app instances, confirm health, then cut over; document reversible migration/backup strategy and restore test.
- GitHub Actions: pinned Node, immutable install (`npm ci` after choosing npm/committing lockfile), format/lint/typecheck, unit/components, PostgreSQL-backed integration, Playwright E2E, production build, dependency vulnerability audit, and secret scanning. Do not mark CI green if required checks were skipped.
- Production env: database URL, separate secret for session signing, trusted app URL, storage bucket/endpoint credentials, email adapter credentials, retention/privacy settings. `.env.example` contains *names and nonfunctional examples*, never working secrets. Validate env at startup and fail closed for required integrations.
- Define privacy-conscious request logs, separate structured audit logs, health/readiness endpoints without secrets, retention, secure backups, incident response contacts and rollback playbook. Limit upload size/type before persistence and avoid public storage by default.
- Documentation to deliver: `README.md` (install/migrate/seed/run/test/build/deploy), `docs/{architecture,database,api,roles-and-permissions,security,administrator-guide,troubleshooting}.md`, and `.github/copilot-instructions.md` (product/stack/structure/conventions/commands/auth/RBAC/security/tests/important files/unrelated-change rule).

## Current pass and next handoff

- **Files updated this pass:** `docs/repository-audit.md`, `docs/implementation-plan.md`, and `.github/copilot-instructions.md` (terminology/status only).
- **Inspections:** repo inventory, key source/config, Prisma schema, prior docs, scripts, runtime report, and available knowledge; see validation record for checks.
- **Tests:** Document consistency checks only; no application/dependency tests were attempted because this is the planning pass and dependencies are not installed.
- **Known issues:** Invalid `next.config.mjs`, hard-coded marketing stats, unprotected/missing dashboard, unfinished data/auth, absent lockfile/migrations/tests/CI, and unspecified domain/privacy/provider decisions.
- **Next:** Phase 4 foundation repair, then Phase 5 schema/migrations. Production readiness is **not claimed**.
