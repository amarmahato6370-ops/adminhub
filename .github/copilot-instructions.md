# Adminhub project instructions

## Product overview

Adminhub is a secure administration platform for managing users, teams, records, tasks, notifications, files, approvals, reports, and settings for the `maxi` organization.

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
- `src/features` groups feature-specific domains such as auth, users, tasks, audit logs, notifications, and files.
- `src/lib` stores utilities, validation, config, security, email, and storage abstractions.
- `src/server` contains server logic, services, repositories, and authorization helpers.
- `prisma/` holds the schema and migrations.
- `docs/` contains design, audit, and implementation documentation.

## Commands

```bash
npm install
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

## Coding conventions

- Prefer type-safe, small, composable functions.
- Keep server-side authorization checks in server actions or API routes.
- Never hide authorization rules in the frontend.
- Avoid placeholder TODOs for core functionality.
- Do not hard-code secrets, tokens, or credentials.
- Validate all inputs with Zod.
- Use existing design-system primitives instead of one-off page styles.
- Preserve the repository structure and do not modify unrelated files.

## Security rules

- Never store plain-text passwords, tokens, or secrets.
- Use environment variables and secret managers, not committed credentials.
- Authorize every sensitive server operation.
- Sanitize user-generated text and validate file uploads.
- Log only safe, privacy-reviewed audit data.

## Testing expectations

- Add tests for auth, authorization, validation, CRUD workflows, reports, and file constraints.
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
