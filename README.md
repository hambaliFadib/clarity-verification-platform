# NexQA - Clarity Platform

NexQA is a QA project management platform focused on clarity across test case management, defect management, and the evidence that connects quality work to release readiness.

This repository is the Phase 1 foundation for the Clarity Platform product area. It sets up a clean monorepo with a Next.js frontend, a FastAPI backend, PostgreSQL on NeonDB, Vercel deployment preparation, GitHub Actions CI, and developer documentation for a small team of 3 contributors.

## Phase 1 Scope

Phase 1 focuses first on two stable workflow anchors:

- Test case management
- Defect / bug management
- The relationship between test cases, execution history, and reported defects

Supporting surfaces such as My Work, Test Runs, Settings, and Release Readiness are included as MVP context, but they remain intentionally lightweight until the core test case and defect flows are stable.

Phase 1 intentionally avoids full integrations, authentication, payments, and advanced automation. The goal is to create a stable foundation before adding complex product logic.

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
```

- `DATABASE_URL`: PostgreSQL connection string from NeonDB.
- `NEXT_PUBLIC_API_BASE_URL`: frontend-visible API base URL, for example `http://127.0.0.1:8000`.
- `ENVIRONMENT`: local, dev, preview, production, or ci.

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

- Phase 1: TCMS + Defect foundation
- Phase 2: Test execution workflow
- Phase 3: Release readiness analytics
- Phase 4: Integrations and automation
