# AI Agent Handover Knowledge

This document is the project knowledge pack for AI coding agents that continue work on NexQA - Clarity Platform, including Antigravity, Codex, or other autonomous engineering agents.

Last updated: 2026-06-15.

## Mission

NexQA is a QA project management platform for requirements, test cases, defects, test execution, work items, environments, releases, traceability, analytics, and later approval/evidence workflows.

The product direction is:

- Quality Before Speed, Clarity Before Release.
- Make requirements the foundation of test coverage.
- Keep production data project-scoped and secure.
- Keep guest mode useful for simulation, but fully isolated from real data.

## Repository Map

```text
.
|-- apps/
|   |-- web/                  # Next.js App Router frontend and local BFF API routes
|   |   |-- app/              # pages and route handlers
|   |   |-- components/       # reusable UI and feature components
|   |   `-- lib/              # types, auth, server repositories, fixtures
|   `-- api/                  # FastAPI backend foundation
|       |-- app/
|       |   |-- routers/
|       |   |-- schemas/
|       |   |-- models/
|       |   `-- services/
|       `-- alembic/
|-- docs/                     # project and release documentation
|-- tools/                    # local diagnostics and safety scripts
|-- README.md
`-- package.json
```

The frontend is currently the active production surface. It uses Next.js route handlers as a local backend-for-frontend layer and calls shared repository helpers in `apps/web/lib/server`.

The FastAPI backend exists and should stay import-safe, but not every active product flow is routed through FastAPI yet.

## Production Context

Production domain:

- `https://nexqa.hambalifadib.my.id`

Vercel alias:

- `https://clarity-verification-platform-web.vercel.app`

Vercel production branch:

- `main`

Integration branch:

- `dev`

Sandbox branches:

- `dev-alpha`
- `dev-beta`
- `dev-charlie`

Promotion path:

```text
dev-alpha/dev-beta/dev-charlie -> dev -> main
```

Do not merge directly to `main` unless the user explicitly asks for release promotion and verification has passed.

## Current Product Phases

### Completed Foundation

- QA CRUD for test cases, defects, environments, releases, work items, and test runs.
- XLSX import/export and template flow for test cases.
- Google OAuth scaffolding.
- Guest access mode.
- Project settings and team/member foundations.
- Project-scoped data access for signed-in users.
- Production deployment through Vercel.

### Active Focus: Phase 3 - Requirements and RBAC

Requirements foundation:

- Requirements list, create, detail, edit.
- Requirement comments.
- Requirement to test case linkage.
- Traceability view.
- AI-assisted requirement analysis panel.

RBAC foundation:

- Role/permission data model.
- Guarded RBAC APIs.
- Future target roles: BA, SA, QA, Developer, PO, PM, UAT User.

Important: RBAC is not fully enforced everywhere yet. Do not expose privileged workflows as complete unless permissions are enforced on the server side.

### Later Phases

- Phase 4: Business Process and Design modules.
- Phase 5: AI Intelligence Layer and evidence system.
- Phase 6: Approval Gates and workflow enforcement.

Some approval gate and audit trail foundations already exist, but approval mutations should remain locked until RBAC and workflow enforcement are complete.

## Security Rules

These rules are non-negotiable.

1. Guest mode must never read or write NeonDB production data.
2. Guest mode uses isolated fixture/demo data from `apps/web/lib/server/guest-fixtures.ts`.
3. Guest CRUD is a simulation and should reset back to demo data.
4. Authenticated Google users must only see projects they own or are invited to.
5. Every server mutation must re-check access on the server, not only in UI or middleware.
6. Do not reintroduce `http://localhost:8000` as a production fallback in frontend route handlers.
7. Do not use dummy UUIDs for real user actions.
8. Do not commit real secrets from `.env`, `.env.local`, or Vercel/Neon.

If a feature cannot meet these rules yet, keep it read-only, disabled, or guarded.

## Auth and Session Model

Key files:

- `apps/web/lib/auth.ts`
- `apps/web/lib/server/request-context.ts`
- `apps/web/app/api/auth/[...nextauth]/route.ts`
- `apps/web/app/(auth)/login/page.tsx`

Expected behavior:

- Google OAuth user: synced into `users`, treated as `Contributor` until role hierarchy is finalized.
- Guest user: isolated simulation identity, usually `guest-user`, with role label `Viewer`.
- Avatar for Google user should prefer initials, not external image dependency.
- Guest identity must not be mixed with Google user project/team data.

Production OAuth callback must match the production domain:

```text
https://nexqa.hambalifadib.my.id/api/auth/callback/google
```

## Data Access Pattern

Frontend route handlers should use repository helpers instead of ad hoc SQL.

Important files:

- `apps/web/lib/server/qa-repository.ts`
- `apps/web/lib/server/db.ts`
- `apps/web/lib/server/request-context.ts`
- `apps/web/lib/server/guest-fixtures.ts`

Typical route handler pattern:

```ts
const ctx = await getRequestContext();

if (isGuestContext(ctx)) {
  return NextResponse.json(guestFixtures());
}

const data = await repositoryFunction(params, ctx);
return NextResponse.json(data);
```

For real users, repository helpers should scope by accessible project IDs. If the user has no accessible projects, return empty data or a clear "Create a project first or ask for invitation" error depending on the workflow.

## Requirements Module Notes

Important files:

- `apps/web/app/(dashboard)/requirements/page.tsx`
- `apps/web/app/(dashboard)/requirements/create/page.tsx`
- `apps/web/app/(dashboard)/requirements/[id]/page.tsx`
- `apps/web/app/(dashboard)/requirements/[id]/edit/page.tsx`
- `apps/web/app/api/requirements/route.ts`
- `apps/web/app/api/requirements/[id]/route.ts`
- `apps/web/app/api/requirements/[id]/test-cases/route.ts`
- `apps/web/app/api/requirements/[id]/traceability/route.ts`
- `apps/web/components/requirements/traceability-matrix.tsx`
- `apps/web/components/requirements/link-test-cases-modal.tsx`

Important behavior:

- Requirement IDs exposed to UI are display IDs such as `REQ-001` or guest IDs such as `GUEST-REQ-001`.
- Some records also carry `realId` for database UUIDs.
- Link/unlink test cases must support display IDs and real IDs.
- The detail traceability UI calls `/api/requirements/{id}/traceability`.
- Link/unlink must update local UI state without forcing a full page reload.

Known pitfall:

- A created guest requirement can have an ID like `guest-...`. The detail route must not 404 on this ID, but it must still behave as a resettable guest simulation.

## Test Cases Import/Export Notes

Important files:

- `apps/web/app/api/test-cases/export/xlsx/route.ts`
- `apps/web/app/api/test-cases/template/xlsx/route.ts`
- `apps/web/app/api/test-cases/import/parse/route.ts`
- `apps/web/app/api/test-cases/import/execute/route.ts`
- `apps/web/components/test-cases/import-export-modal.tsx`

Expected behavior:

- Export and template download must return XLSX, not JSON errors like `{ "error": "fetch failed" }`.
- Keep the Excel format aligned with the user-provided sample file when changing import/export.
- Do not depend on FastAPI being available for export/template if the Next route can generate directly.

## Approval Gates Notes

Important files:

- `apps/web/app/(dashboard)/approvals/page.tsx`
- `apps/web/app/api/approval-gates/route.ts`
- `apps/web/app/api/approval-gates/entity/[type]/[id]/route.ts`
- `apps/web/app/api/approval-gates/[id]/approve/route.ts`
- `apps/web/app/api/approval-gates/[id]/reject/route.ts`
- `apps/web/components/approval/approval-gates-panel.tsx`
- `apps/web/components/approval/audit-trail.tsx`
- `apps/web/lib/server/approval-repository.ts`

Current rule:

- Approval read/audit foundation can exist.
- Approve/reject mutations stay locked until RBAC and entity state machine enforcement are done.

Do not silently unlock approval mutations.

## Branch and Git Etiquette for Agents

Before editing:

```bash
git status --short --branch
```

If the working tree has user changes, do not revert them. Work with them or add new files/isolated edits.

Typical sandbox update:

```bash
git checkout dev
git pull origin dev
git checkout dev-alpha
git merge dev
```

Typical merge to dev after verification:

```bash
git checkout dev
git pull origin dev
git merge dev-alpha
git push origin dev
```

Typical promotion to main:

```bash
git checkout main
git pull origin main
git merge dev
git push origin main
```

Only do push/merge when the user explicitly asks.

## Verification Commands

Run from repository root unless noted.

```bash
npm.cmd run typecheck:web
npm.cmd run build:web
npm.cmd run check:api
```

Backend import smoke:

```bash
apps\api\.venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'apps/api'); import app.main; print('api import ok')"
```

Useful scan before release:

```bash
rg "localhost:8000|127\.0\.0\.1:8000|00000000-0000-0000-0000-000000000000|DELETE FROM alembic_version" apps/web apps/api
```

If `npm.cmd run build:web` modifies `apps/web/tsconfig.json` by adding `.next/dev/types/**/*.ts`, remove that dev include before final typecheck. It has caused stale route type failures.

Preferred `next-env.d.ts` route import:

```ts
import "./.next/types/routes.d.ts";
```

Avoid:

```ts
import "./.next/dev/types/routes.d.ts";
```

## Environment Variables

Documented in `.env.example` and README.

Common required values:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ENVIRONMENT`
- `ALLOWED_ORIGINS`

Production `NEXTAUTH_URL` should use:

```text
https://nexqa.hambalifadib.my.id
```

Never print or commit real env values.

## UI/UX Conventions

- Keep dashboard/admin UI dense, quiet, and task-focused.
- Use existing UI components from `apps/web/components/ui`.
- Prefer lucide icons already used by the codebase.
- Cards should remain simple, with small radius and stable dimensions.
- Avoid adding marketing/landing-page style compositions inside the app.
- Modals should blur or dim the full background consistently.
- Text must not overflow buttons, cards, or sidebars.

## Issue Tracking Pattern

When asked to update GitHub issues:

- Update the relevant existing issue if scope matches.
- Create a new issue only if no issue is relevant.
- Do not close issues unless the user explicitly asks or the scope is genuinely complete.
- For partially complete phase work, keep the issue open and document "Implemented", "Safety Fixes", "Verification", and "Still Open".

Useful labels often used in this project:

- `bug`
- `fixing`
- `enhancement`
- `frontend`
- `backend`
- `security`
- `needs-review`

## Common Failure Modes

1. Guest data leaks real Neon project data.
   - Fix by routing guest requests to `guest-fixtures.ts` only.

2. Google user sees project data without being owner/member.
   - Fix by enforcing project membership in server repositories.

3. Next route handler returns 404 for dynamic nested route.
   - Check `app/api/.../[id]/.../route.ts` path and method.

4. UI sends query string but API expects JSON body.
   - Support both where legacy UI may exist, then normalize the UI call.

5. Create flow redirects to a generated guest ID that cannot be read.
   - Guest detail route must handle `guest-...` as simulation data.

6. Typecheck fails after build due `.next/dev/types`.
   - Remove `.next/dev/types/**/*.ts` from `apps/web/tsconfig.json`.
   - Keep `next-env.d.ts` pointed to `.next/types/routes.d.ts`.

7. Production OAuth fails with `redirect_uri_mismatch`.
   - Register the exact domain callback in Google Cloud Console.

8. Approval action appears to work before RBAC exists.
   - Keep approve/reject locked until server-side RBAC and state machines exist.

## Good First Step for a New Agent

Start by running:

```bash
git status --short --branch
rg --files apps/web/app apps/web/components apps/web/lib docs | sort
```

Then read these files:

```text
README.md
docs/phase-roadmap.md
docs/architecture.md
docs/branching-strategy.md
docs/ci-cd.md
docs/ai-agent-handover.md
```

If the task touches auth, guest mode, requirements, project settings, or production release, inspect the relevant route handlers and repository helpers before editing.

## Handoff Prompt for Another Agent

Use this prompt when starting a new agent session:

```text
You are continuing work on NexQA - Clarity Platform in this repository.
First read docs/ai-agent-handover.md, README.md, and docs/phase-roadmap.md.
Preserve user changes in the working tree.
Do not leak guest mode into real NeonDB data.
Do not expose project data unless the signed-in user owns the project or is a member.
Use repository helpers in apps/web/lib/server for server-side data access.
Run npm.cmd run typecheck:web, npm.cmd run build:web, and npm.cmd run check:api before merge/release.
Only push, merge, close issues, or promote to main when explicitly asked.
```

