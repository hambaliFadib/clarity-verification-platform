# NexQA - Clarity Platform

NexQA is a QA project management platform focused on clarity across requirements, test cases, defects, test execution, and the evidence that connects quality work to release readiness.

This repository contains the production line for the Clarity Platform product area. It uses a Next.js frontend, a FastAPI backend, PostgreSQL on NeonDB, Vercel deployment from `main`, GitHub Actions CI, and documentation for a small team of 3 contributors.

Production URL:

- Primary: `https://nexqa.hambalifadib.my.id`
- Vercel alias: `https://clarity-verification-platform-web.vercel.app`

## Current Release Scope

The current release promotes the stable `dev` integration branch to `main` for production access. It includes:

- Project-scoped QA CRUD for test cases, defects, environments, releases, work items, and test runs.
- XLSX import/export and template support for test case operations.
- Google OAuth and guest access scaffolding with production callback/domain support.
- Guest data isolation and reset behavior for simulation mode.
- Project Settings updates for project name/suffix and workspace label sync.
- Requirements foundation: functional/non-functional requirements, business rules, comments, traceability, and AI-assisted analysis surfaces.
- RBAC foundation: role/permission data model and guarded APIs for the next enforcement pass.
- Analytics foundation and quality score MVP.
- Approval gate and audit trail foundation, with write mutations locked until workflow enforcement is complete.
- Production hardening for modal layering, table navigation, Excel alignment, route type generation, and local/prod build stability.

Known follow-up work remains tracked in GitHub issues. Features that are only foundation-level are kept guarded rather than exposed as complete production workflows.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: FastAPI, Python, SQLAlchemy
- Migration: Alembic
- Database: PostgreSQL on NeonDB Free Tier
- Hosting: Vercel
- VCS and CI: GitHub and GitHub Actions

## Repository Structure

```text
.
|-- apps/
|   |-- web/                  # Next.js frontend
|   |   |-- app/
|   |   |-- components/
|   |   |-- lib/
|   |   |-- public/
|   |   |-- package.json
|   |   |-- next.config.js
|   |   |-- tailwind.config.js
|   |   `-- tsconfig.json
|   `-- api/                  # FastAPI backend
|       |-- app/
|       |   |-- core/
|       |   |-- db/
|       |   |-- models/
|       |   |-- routers/
|       |   |-- schemas/
|       |   `-- services/
|       |-- alembic/
|       |-- alembic.ini
|       `-- requirements.txt
|-- docs/
|-- .github/workflows/
|-- .env.example
|-- .gitignore
|-- vercel.json
`-- README.md
```

The monorepo keeps the frontend and backend isolated while allowing shared repository governance, branch strategy, and CI checks.

## Local Development Setup

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

Open the local URL shown by Next.js, usually `http://127.0.0.1:3000`.

From the repository root, you can also run:

```bash
npm run dev:web
```

### Backend

```bash
cd apps/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

## Environment Variables

Copy `.env.example` to your local environment file and fill in the values:

```env
DATABASE_URL=
NEXT_PUBLIC_API_BASE_URL=
ENVIRONMENT=local
ALLOWED_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://127.0.0.1:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

- `DATABASE_URL`: PostgreSQL connection string from NeonDB.
- `NEXT_PUBLIC_API_BASE_URL`: frontend-visible API base URL, for example `http://127.0.0.1:8000`.
- `ENVIRONMENT`: local, dev, preview, production, or ci.
- `ALLOWED_ORIGINS`: comma-separated web origins allowed by the FastAPI CORS middleware.
- `NEXTAUTH_SECRET`: server-side secret for NextAuth JWT/session signing.
- `NEXTAUTH_URL`: canonical local or deployed web URL used by NextAuth callbacks. Production should use `https://nexqa.hambalifadib.my.id`.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Google OAuth credentials with the production callback URL registered.

Never commit `.env.local` or real secrets.

## Database Migration Workflow

Run Alembic commands from `apps/api`.

Create a migration:

```bash
alembic revision --autogenerate -m "create initial qa tables"
```

Run migrations:

```bash
alembic upgrade head
```

Rollback one migration:

```bash
alembic downgrade -1
```

See [docs/database-migration.md](docs/database-migration.md) for the full workflow.

For production NeonDB setup, Singapore region selection, and cleanup steps, see [docs/neon-production.md](docs/neon-production.md).

For phase release scope and continuation planning, see [docs/phase-roadmap.md](docs/phase-roadmap.md).

For AI-agent handover context, operating rules, common pitfalls, and continuation prompts, see [docs/ai-agent-handover.md](docs/ai-agent-handover.md).

## Git Branching Strategy

```text
dev-alpha   -> Individual sandbox branch created from dev
dev-beta    -> Individual sandbox branch created from dev
dev-charlie -> Individual sandbox branch created from dev
dev         -> Integration branch for completed sandbox work
main        -> Production / real usage branch for stable features
```

## Contributor Workflow

For the 3-contributor team:

1. Pull latest `dev`.
2. Work in the assigned sandbox branch: `dev-alpha`, `dev-beta`, or `dev-charlie`.
3. Commit focused feature or fixing changes.
4. Push the sandbox branch.
5. Open a pull request from the sandbox branch to `dev`.
6. Merge after CI passes and review is complete.

Promotion order is always `dev-alpha/dev-beta/dev-charlie -> dev -> main`. Merge `dev` to `main` only after `dev` is stable and has no known blocking bugs.

## CI/CD Overview

GitHub is the source of truth. Pull requests and pushes to `dev-alpha`, `dev-beta`, `dev-charlie`, `dev`, and `main` run GitHub Actions checks for the frontend and backend. Vercel should be connected to the GitHub repository for automatic production deployment from `main` only:

- `dev-alpha`, `dev-beta`, `dev-charlie`: sandbox branches for feature and fixing work; CI only.
- `dev`: integration branch for completed sandbox work; CI only.
- `main`: Vercel Production Deployment and NeonDB production branch for real usage.

Current Vercel project:

- `clarity-verification-platform-prod`: production deployment path for `main`.
- Primary domain: `https://nexqa.hambalifadib.my.id`.
- Vercel alias: `https://clarity-verification-platform-web.vercel.app`.

Vercel receives `DATABASE_URL` from the Neon Vercel Integration for the production `main` deployment. Sandbox branches should use local database settings or manually created Neon branches when isolation is needed.

See [docs/ci-cd.md](docs/ci-cd.md) for the full GitHub -> Vercel -> NeonDB flow.

## Phase Roadmap

The earlier Phase 1 and Phase 2 work established the QA CRUD foundation, production deployment path, authentication scaffolding, guest mode isolation, project scoping, and team/account surfaces.

Current and next focus:

- Phase 3 - Foundation: Requirements Management and RBAC.
- Phase 4 - Business Process and Design modules.
- Phase 5 - AI Intelligence Layer and evidence system.
- Phase 6 - Approval Gates and Workflow enforcement.

Some Phase 6 foundations, such as `approval_gates`, `audit_trail`, and analytics MVP, already exist behind guarded APIs so they can be connected safely in later work.
