# Adminhub project instructions

## Product overview

Adminhub is a planned administration platform for managing users, teams, records, tasks, notifications, files, approvals, reports, and settings for the `matx` organization. The business purpose and main entity name are not yet specified; use the neutral `Record` until confirmed. The current checkout is a partial scaffold, not a production-ready application; see `docs/repository-audit.md` and `docs/implementation-plan.md`.

## Stack

- Next.js with TypeScript and App Router
- Tailwind CSS, shadcn/ui patterns, and Lucide React
- PostgreSQL + Prisma
- Auth.js or a secure email/password auth implementation
- Zod validation, React Hook Form, Recharts
- Vitest, React Testing Library, Playwright
- ESLint, Prettier, strict TypeScript
- Docker and GitHub Actions for deployment and CI

## Architecture

- `src/app` holds route-level pages and app layouts.
- `src/components` contains reusable UI primitives and layout structures.
- `src/features` will group domains such as auth, users, tasks, audit logs, notifications, and files; the folder has not been created yet.
- `src/lib` currently holds utilities and will gain validation, config, security, email, and storage abstractions.
- `src/server` is planned for business services, repositories, and authorization helpers.
- `prisma/` currently contains only a placeholder schema; migrations are planned.
- `docs/` contains the repository audit and phased implementation plan.

## Commands

```bash
npm install # foundation phase must select/pin npm and commit a lockfile; not yet validated
cp .env.example .env.local
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

Database commands:

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npx prisma studio
```

These are planned workflows from `package.json`, not proof of a working installation; there are no installed dependencies, migrations, or tests yet. Replace `npm install` with `npm ci` in CI after the lockfile is created and checked in.

## Coding conventions

- Prefer type-safe, small, composable functions.
- Keep server-side authorization checks in server actions or API routes.
- Never hide authorization rules in the frontend.
- Avoid placeholder TODOs for core functionality.
- Do not hard-code secrets, tokens, or credentials.
- Validate all inputs with Zod.
- Keep all protected reads and writes behind server-side `requireSession`/scoped permission checks; never trust a client-supplied organization, user, department, or role as authority.
- An administrator cannot promote themselves or remove/downgrade the final super administrator; managers are restricted to assigned departments and staff/users to their own data.
- Hash passwords with an adaptive password hash, hash opaque reset/session tokens at rest, expire and revoke sessions, and apply account-level and shared rate limits.
- Use existing design-system primitives instead of one-off page styles.
- Preserve the repository structure and do not modify unrelated files.

## Security rules

- Never store plain-text passwords, tokens, or secrets.
- Use environment variables and secret managers, not committed credentials.
- Authorize every sensitive server operation.
- Sanitize user-generated text and validate file uploads.
- Log only safe, privacy-reviewed audit data.
- Protect cookie-authenticated mutations from CSRF; use secure cookies, least-privilege provider adapters, and upload type/size/scanning policies.

## Testing expectations

- Add tests for auth, authorization, validation, CRUD workflows, reports, and file constraints.
- Include negative tests for unauthenticated access, cross-user/tenant IDOR, role escalation, token replay, and invalid uploads.
- Keep CI free of flaky or mock-only acceptance tests.
- Validate accessibility and keyboard navigation.

## Important files

- `package.json`
- `prisma/schema.prisma`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/lib/utils.ts`
- `docs/repository-audit.md`
- `docs/implementation-plan.md`
