# NexQA - Clarity Platform

NexQA is a QA project management platform focused on clarity across test case management, test execution, defect management, QA collaboration, and release readiness.

This repository is the Phase 1 foundation for the Clarity Platform product area. It sets up a clean monorepo with a Next.js frontend, a FastAPI backend, PostgreSQL on NeonDB, Vercel deployment preparation, GitHub Actions CI, and developer documentation for a small team of 3 contributors.

## Phase 1 Scope

- Test Case Management
- Test Run Management
- Defect / Bug Management
- Release Readiness foundation
- QA collaboration workflow

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
dev      -> Sandbox / playground development, including fixing work
demo     -> Minimum public demo branch for features ready to be tried
main     -> Production / real usage branch for stable features
feat/*   -> Feature branches created from dev
fix/*    -> Bug fix branches created from dev
chore/*  -> Maintenance/configuration branches created from dev
docs/*   -> Documentation branches created from dev
```

## Contributor Workflow

For the 3-contributor team:

1. Pull latest `dev`.
2. Create `feat/<feature-name>`, `fix/<bug-name>`, `docs/<topic>`, or `chore/<task>`.
3. Commit focused changes.
4. Push the branch.
5. Open a pull request to `dev`.
6. Request review from at least one teammate.
7. Merge after CI passes and review is complete.

Promotion order is always `dev -> demo -> main`. Do not merge `dev` directly to `main`.

## CI/CD Overview

GitHub is the source of truth. Pull requests and pushes to `dev`, `demo`, and `main` run GitHub Actions checks for the frontend and backend. Vercel should be connected to the GitHub repository for automatic deployments:

- `dev`: Vercel Preview Deployment backed by a persistent NeonDB dev branch.
- `demo`: Vercel demo/preview deployment backed by a NeonDB demo branch when configured.
- `feat/*`: Vercel Preview Deployment backed by a Neon child branch when configured.
- `main`: Production Deployment and NeonDB main branch for real usage.

Current Vercel projects:

- `clarity-verification-platform-dev`: sandbox deployment path for `dev`.
- `clarity-verification-platform-prod`: production deployment path for `main` (`https://clarity-verification-platform-web.vercel.app`).

Vercel receives `DATABASE_URL` from the Neon Vercel Integration. Preview deployments can receive branch-specific database URLs.

See [docs/ci-cd.md](docs/ci-cd.md) for the full GitHub -> Vercel -> NeonDB flow.

## Phase Roadmap

- Phase 1: TCMS + Defect foundation
- Phase 2: Test execution workflow
- Phase 3: Release readiness analytics
- Phase 4: Integrations and automation
