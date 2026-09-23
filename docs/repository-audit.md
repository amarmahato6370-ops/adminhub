# Adminhub Repository Audit

**Inspected:** 2026-09-23
**Commit:** `72580499c852f90856d2f3a4f2efb64395930242`
**Scope:** Repository inspection only; application code was not changed.

## Current state

This is an **existing, incomplete Next.js scaffold**, not an empty repository. Earlier versions of this audit and the implementation plan described an empty repository and named `maxi`; both were stale. The requested organization is **matx**. Its business purpose and the name of its primary record entity were supplied as placeholders, not facts about the organization.

| Area | What exists | What is still missing or unsafe |
| --- | --- | --- |
| Tooling | `package.json` with Next.js 14, React 18, TypeScript strict mode, Tailwind, Prisma 5, NextAuth 4, Zod, React Hook Form, Vitest, Testing Library, Playwright, ESLint and Prettier dependencies/scripts | No package-manager pin or lockfile, `node_modules`, test configuration, tests, or reproducible install; `next.config.mjs` contains TypeScript syntax (`import type` and type annotation) that a `.mjs` file cannot parse. |
| Frontend | App Router root page/layout, global CSS, Tailwind theme, `Button` and `Card` primitives | `/` is a marketing page with hard-coded statistics and an unimplemented `/dashboard` link, not an admin app. No auth pages, protected routes, tables, accessible dialogs, theme switcher, real charts, loading/error boundaries, mobile navigation, or forms. |
| Backend | No implemented routes, services, actions, repositories, or authorization | No authenticated endpoints, domain logic, API contract, server validation, audit writes, or rate limits. |
| Database | `prisma/schema.prisma` with `User`, `Session`, `AuditLog`, and `SystemSetting` | Models are placeholders; `User.role` is a string rather than RBAC, `Session.token` is stored raw, `Session` has no relation to `User`, and there are no migrations, seed, PostgreSQL runtime, or DB tests. |
| Configuration | `.env.example`, `.eslintrc.json`, `.prettierrc`, `.gitignore`, `.github/copilot-instructions.md` | Example connection and provider settings are placeholders only; no environment validation, headers, provider adapters, Docker, CI workflows, or deployment procedures. |
| Documentation | Minimal `README.md`, this audit, and `docs/implementation-plan.md` | Previous audit and plan were stale; no operative API, security, database, installation, administrator, or troubleshooting guides. |

## Evidence

- `src/app/page.tsx` renders fixed `12.4k` active users, `99.2%` security score, and `84%` automation coverage. Those are marketing mockups, **not** live dashboard metrics; remove or label them clearly before product release.
- `src/app/layout.tsx` and `src/app/globals.css` establish a global layout and CSS variables; no protected application shell exists.
- `prisma/schema.prisma` defines four minimal models; it does not implement any of the requested operational domains. No `prisma/migrations/` or `prisma/seed.ts` exists.
- `package.json` declares commands (`dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, database commands) but this checkout contains neither a lockfile nor installed dependencies. Their presence does **not** mean they have been validated.
- `.github/copilot-instructions.md` already exists and describes the intended architecture, but refers to the wrong organization and presents future directories/features as existing.
- No `AGENTS.md`, repo-specific knowledge facts, configured setup script, active service, or test run was found during this audit. The historical setup report also records that dependencies were not installed.

## Security and delivery risks

1. `/dashboard` is linked publicly but has no implemented route or server-side authorization; do not deploy a supposedly protected dashboard until server enforcement and negative tests exist.
2. Password/session/token and RBAC models are not safe to use as-is. Do not turn on login against this schema; use adaptive password hashing and **hash stored opaque tokens**, session revocation, organization-scoped permission checks, and audit events.
3. The landing page implies production readiness and displays made-up security numbers. Remove those claims/values in the foundation phase or mark them explicitly as illustrative.
4. Do not issue a release from a mutable dependency range without a verified lockfile, migration history, repeatable build, security checks, and deployment instructions.
5. The business purpose, primary entity name, legal/privacy requirements, tenant scope, and external providers are not defined. Use neutral, documented defaults only where they do not misrepresent the business; defer domain-specific behavior and billing.

## Decisions and next work

Retain and improve the existing Next.js/TypeScript/Tailwind/Prisma structure; do not initialize a second application. Use `docs/implementation-plan.md` for the phased architecture, data, route, authorization, testing, and deployment plan. The next implementation phase is **foundation repair**: fix the invalid config, lock a package manager/dependencies, make truthful landing content, establish baseline build/tests/configuration, and update `README.md` and Copilot instructions before implementing database/auth.
