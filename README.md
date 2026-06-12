# NexQA - Clarity Platform

NexQA is a QA project management platform focused on clarity across test case management, defect management, and the evidence that connects quality work to release readiness.

This repository is the Phase 1 foundation for the Clarity Platform product area. It sets up a clean monorepo with a Next.js frontend, a FastAPI backend, PostgreSQL on NeonDB, Vercel deployment preparation, GitHub Actions CI, and developer documentation for a small team of 3 contributors.

## Phase 1 Scope

Phase 1 focuses first on stable QA workflow anchors:

- Test case management
- Defect / bug management
- The relationship between test cases, execution history, and reported defects
- XLSX import/export for test case operations
- Environment, project, release, and work item MVP surfaces backed by NeonDB

Supporting surfaces such as My Work, Test Runs, Settings, account entry points, and Release Readiness are included as MVP context. They remain intentionally lightweight until Phase 2 turns authentication, team workflow, and project-scoped behavior into complete product flows.

Phase 1 includes authentication scaffolding so the app can move into Phase 2 cleanly, but full Google OAuth rollout, invite verification, guest-data lifecycle, account management, and team/project restrictions remain Phase 2 work.

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
- `NEXTAUTH_URL`: canonical local or deployed web URL used by NextAuth callbacks.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Google OAuth credentials for Phase 2 authentication rollout.

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

Current Vercel projects:

- `clarity-verification-platform-prod`: production deployment path for `main` (`https://clarity-verification-platform-web.vercel.app`).

Vercel receives `DATABASE_URL` from the Neon Vercel Integration for the production `main` deployment. Sandbox branches should use local database settings or manually created Neon branches when isolation is needed.

See [docs/ci-cd.md](docs/ci-cd.md) for the full GitHub -> Vercel -> NeonDB flow.

## Phase Roadmap

- Phase 1: TCMS, defect workflow, import/export, Neon-backed CRUD, MVP settings, and UI bugfix release.
- Phase 2: Google OAuth, guest mode hardening, account settings, one-project initialization, team invites, and My Work drag-to-move.
- Phase 3: Test execution workflow and release readiness analytics.
- Phase 4: External integrations, automation runtime, and advanced governance.
