# Adminhub Implementation Plan

**Repository:** `amarmahato6370-ops/adminhub`  
**Status:** Planning only  
**Prerequisite:** The repository audit found only `README.md`; no application code has been changed.

## 1. Goals and non-goals

### Goals

Build a production-oriented administration platform for `maxi` with secure authentication, server-enforced RBAC, organization/user/staff administration, configurable records and approvals, tasks, notifications, files, reports, audit logs, settings, responsive accessibility, automated tests, and deployment documentation.

### Non-goals for the first implementation slice

- Do not invent a domain-specific main entity while `[MAIN ENTITY NAME]` is unresolved.
- Do not integrate paid external services without provider interfaces and environment-based configuration.
- Do not treat mock dashboard values as production data.
- Do not replace security controls with frontend-only visibility rules.

## 2. Proposed architecture

Use a Next.js App Router application with TypeScript strict mode. Keep route/page composition in `src/app`, reusable presentation in `src/components`, feature-specific UI and schemas in `src/features`, infrastructure adapters in `src/lib`, and transactional business logic in `src/server`.

Server components should load read models through service functions. Mutations should use validated server actions or versioned route handlers. Every mutation should authenticate, authorize, validate, execute the smallest appropriate transaction, write an audit event, and return a typed success/error result. Database access must remain server-only.

Proposed structure:

```text
src/
  app/
    (auth)/                 authentication pages
    (dashboard)/             protected application pages
    api/v1/                   versioned route handlers
  components/
    ui/                      design-system primitives
    layout/                  shell, navigation, breadcrumbs
    forms/                   reusable form patterns
    tables/                  server-driven data tables
    charts/                  dashboard/report charts
  features/
    auth/ users/ roles/ permissions/
    dashboard/ departments/ teams/
    records/ approvals/ tasks/
    notifications/ files/ reports/ audit-logs/
  lib/
    auth/ db/ permissions/ validation/
    security/ storage/ email/ config/
  server/
    services/ repositories/ policies/
  tests/
prisma/
  schema.prisma
  seed.ts
  migrations/
docs/
.github/
  workflows/
  copilot-instructions.md
```

## 3. Domain and database plan

Create a normalized Prisma schema with UUIDs/secure IDs, `createdAt`/`updatedAt`, indexes, unique constraints, foreign keys, and soft-delete fields where appropriate.

### Identity and access

- `User`, `Role`, `Permission`, `RolePermission`, `UserRole`.
- `Session`, `VerificationToken`, `PasswordResetToken`.
- Optional `TwoFactorMethod`, recovery-code representation, login-attempt/history models.
- Explicit status fields for active, suspended, invited, and deleted states.

### Organization

- `Organization`, `Department`, `Team`, team membership, assignments, job titles, staff status.
- Organization scoping must be included in queries and authorization policies even if the initial deployment has one organization.

### Product records

Use a neutral `ApplicationRecord`/`Record` until the main entity is named. Include owner, assignee, category, tags, priority, due date, lifecycle status, archive/soft-delete fields, custom fields, comments, attachments, and activity history. Add `EntityStatusHistory`, `EntityAttachment`, and approval reviewer/action data.

### Operations

- `Task`, subtasks/recurrence metadata, assignments, comments, attachments, reminders.
- `Notification`, notification preferences, templates, delivery/read history.
- `File`, storage key, original metadata, visibility, folder, scan status, uploader, deletion/restore fields.
- `AuditLog` with actor, action, entity, safe description, timestamp, and optional privacy-reviewed request metadata.
- `SystemSetting` with typed/validated values and category-level permissions.

Use transactions for role changes, approval transitions, destructive actions, invitation flows, and multi-record bulk operations. Add indexes for email, status, organization, assignee, created dates, due dates, and searchable foreign keys. Avoid unbounded relations and N+1 reads.

## 4. Authentication and authorization plan

1. Select Auth.js credentials/email adapter or an equivalent secure implementation.
2. Hash passwords with an adaptive algorithm and enforce a configurable strength policy.
3. Implement login, logout, registration policy, email verification, forgot/reset password, secure sessions, remember-me, suspension, and logout-all-devices.
4. Add rate limiting and failed-login tracking before exposing login publicly.
5. Define centralized permission constants and policy functions such as `canManageUsers`, `canReadRecord`, `canApproveRecord`, and `canAccessSetting`.
6. Apply policy checks in every server action and API route, including object ownership/team/department scope.
7. Prevent administrator self-escalation and protect the Super Administrator from downgrade/removal.
8. Design 2FA and social-login interfaces without enabling incomplete flows in production.
9. Add tests for unauthenticated, normal-user, manager, administrator, and super-administrator access.

## 5. Route and page plan

### Public/auth routes

- `/login`
- `/register` if enabled by settings
- `/verify-email`
- `/forgot-password`
- `/reset-password`
- `/auth/error`

### Protected routes

- `/dashboard`
- `/users`, `/users/new`, `/users/[id]`
- `/roles`, `/permissions`
- `/departments`, `/teams`, `/staff`
- `/records`, `/records/new`, `/records/[id]`
- `/tasks`, `/tasks/calendar`, `/tasks/kanban`
- `/notifications`
- `/files`
- `/reports`
- `/audit-logs`
- `/settings/organization`, `/settings/security`, `/settings/notifications`, `/settings/files`, `/settings/system`
- `/profile`, `/sessions`

Use route-level metadata, loading/error boundaries, authorization-aware navigation, and server-side page guards. API handlers should be versioned under `/api/v1` and use consistent success/error envelopes with pagination metadata.

## 6. Shared component and UX plan

Build the shell and design system before feature-specific screens:

- Sidebar with responsive collapse and mobile drawer.
- Top bar, profile menu, breadcrumbs, command/search entry point.
- Buttons, inputs, selects, date ranges, badges, tabs, cards, dialogs, drawers, toasts, tooltips.
- Accessible table with server pagination, sorting, filters, column visibility, bulk selection, and mobile fallback.
- Form primitives using React Hook Form and Zod error mapping.
- Loading skeletons, empty states, error states, retry actions, confirmation dialogs.
- Theme provider with light/dark mode, visible focus states, keyboard navigation, and WCAG-conscious contrast.

## 7. Delivery phases and file groups

### Phase 1 — Foundation

Create the Next.js app, package scripts, strict TypeScript, Tailwind/shadcn setup, ESLint/Prettier, environment validation, root layout, basic README, `.env.example`, and CI skeleton. No business feature should be represented by hard-coded fake production data.

### Phase 2 — Database

Create Prisma schema, database client, migrations, seed data for development only, repository conventions, pagination/filter helpers, and database documentation.

### Phase 3 — Authentication/RBAC

Create auth configuration, session helpers, password/token flows, rate-limit adapter, policy/permission modules, protected layout, and security tests.

### Phase 4 — Shell/design system

Create the navigation shell and reusable UI/form/table primitives. Verify keyboard and mobile behavior before adding large feature screens.

### Phase 5 — Dashboard

Add service queries for totals, trends, alerts, registrations, tasks, and activity. Add date/department filters, charts, export, and loading/empty/error states.

### Phase 6 — Users and organization

Implement users, profiles, invitations, role/permission management, departments, teams, staff, filters, pagination, CSV import/export, dangerous-action confirmation, and audit events.

### Phase 7 — Records and approvals

Confirm the main entity, then implement reusable CRUD, lifecycle statuses, assignment, categories/tags, custom fields, comments, attachments, status history, approval rules, and separation-of-duties enforcement.

### Phase 8 — Tasks/notifications/files

Implement task list/calendar/Kanban views, recurring-task architecture, notification center/preferences/templates, email adapter, secure storage abstraction, signed downloads, upload validation, and scan integration point.

### Phase 9 — Reports/audit/settings

Implement report query services, export layouts, saved filters, scheduled-report interface, searchable audit logs, organization/security/file/system settings, and privacy-safe logging.

### Phase 10 — Hardening/release

Complete unit/component/API/database/E2E tests, accessibility checks, security tests, dependency scanning, Docker, GitHub Actions, API docs, admin guide, troubleshooting, migration verification, and clean-install/build verification.

## 8. Testing strategy

- **Unit:** permission policies, validators, pagination/filter parsers, security utilities, export formatters.
- **Component:** forms, tables, dialogs, navigation, error/empty/loading states.
- **API/integration:** authentication, authorization, CRUD, transactions, audit creation, file validation.
- **Database:** migrations, unique constraints, soft deletion, status history, scoped queries.
- **E2E:** login, protected dashboard, role restrictions, user CRUD, approvals, files, tasks, reports, settings, mobile navigation.
- **Security:** IDOR/BOLA, privilege escalation, rate limiting, invalid uploads, XSS-safe rendering, secret leakage checks.
- **Accessibility:** keyboard navigation, focus management, labels, error association, headings, table semantics, contrast.

Acceptance tests from the product brief must be explicit and run in CI. A clean clone must install, migrate/seed a development database, type-check, lint, test, and build successfully.

## 9. Deployment and operations

Provide Docker support for the application and PostgreSQL development environment. Add GitHub Actions jobs for install/cache, formatting/lint, type-check, unit/integration tests, E2E where infrastructure permits, build, dependency audit, and secret scanning. Document environment variables without real credentials, migration deployment order, backups, logs, health checks, and rollback expectations.

External integrations must use interfaces:

- `StorageProvider`: local development and S3-compatible production adapter.
- `EmailProvider`: local/dev logging adapter and Resend-compatible production adapter.
- `VirusScanner`: no-op development adapter and configurable production service.
- `PushProvider`/scheduled reports: implementation-ready interface, disabled until configured.

## 10. Documentation deliverables

Maintain:

- `README.md` with setup, scripts, environment, database, testing, build, and deployment.
- `docs/repository-audit.md`.
- `docs/implementation-plan.md`.
- `docs/architecture.md`.
- `docs/database.md`.
- `docs/api.md` or generated OpenAPI documentation.
- `docs/security.md`.
- `docs/roles-and-permissions.md`.
- `docs/administrator-guide.md`.
- `docs/troubleshooting.md`.
- `.github/copilot-instructions.md` with architecture and modification boundaries.

## 11. Risks and decisions

1. **Main entity unresolved:** confirm the business record before domain-specific schema/UI work.
2. **Authentication provider unresolved:** choose Auth.js versus a dedicated secure credentials service before implementation.
3. **Email/storage/scanning providers unresolved:** use adapters and local implementations first.
4. **Privacy requirements unresolved:** confirm retention and lawful use of IP/user-agent data before audit logging those fields.
5. **Multi-tenancy scope unresolved:** design organization scoping now, but confirm whether cross-organization administration is needed.
6. **Billing requirement conditional:** keep billing outside the first slice unless the organization explicitly requires it.

## 12. Completion checklist per phase

After every phase, report:

- Files created or changed.
- Commands run and their outcomes.
- Tests completed.
- Known issues and security/accessibility implications.
- Any assumptions made.
- The next recommended phase.

No phase should silently modify unrelated files or remove existing tests/configuration. Since the current repository contains only `README.md`, the foundation phase may add the proposed structure while preserving that README’s project identity and documenting its expansion.
