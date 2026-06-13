# NexQA - Clarity Platform

NexQA is a quality intelligence workspace for managing requirements, test coverage, defects, release evidence, and approval decisions with clear traceability from business intent to production readiness.

This repository is the production baseline for the Clarity Platform product area. It uses a Next.js frontend, a FastAPI backend, PostgreSQL on NeonDB, Vercel production deployment, GitHub Actions CI, and documentation for a small delivery team.

## Current Production Baseline

The current `main` branch has completed the first two delivery phases:

### Phase 1 - QA Workflow MVP

- Test case management.
- Defect and defect comment management.
- XLSX import/export for test case operations.
- Environment, project, release, activity, test run, and work item MVP surfaces.
- Stable UI fixes for Test Cases, Defects, My Work, Project Settings, navbar, modals, filters, and import/export flows.

### Phase 2 - Authentication, Project Ownership, And Guest Isolation

- Google OAuth production setup.
- Account entry page and session handling.
- Project ownership and project member scoping.
- Invite-by-email flow for users already registered in the platform.
- Guest mode as a fully isolated demo sandbox.
- Guest data is served from resettable dummy fixtures and never reads from or writes to NeonDB.
- Core API routes are scoped by project membership to prevent cross-project data exposure.

## Next Implementation Roadmap

Priority principle: **Quality Before Speed, Clarity Before Release**.

Because Phase 1 and Phase 2 are already part of the production baseline, the next roadmap is numbered from Phase 3 onward.

### Phase 3 - Foundation: Requirements & RBAC

Highest priority. This phase turns the current Requirements placeholder into the foundation module for traceability and role-based collaboration.

Requirements Management:

- Functional Requirements: user stories and acceptance criteria.
- Non-Functional Requirements: performance, security, reliability, and operational constraints.
- Business Rules: validations, constraints, and policy logic.
- Traceability Matrix: requirement -> test case -> defect linkage.
- AI-assisted generation: auto-generate test cases from approved requirements.

Role-Based Access Control:

- BA: Create/Edit Requirements, View Business Process.
- SA: Design Documents, Architecture, Technical Specs.
- QA: Test Cases, Test Runs, Defects.
- Developer: Code Review, Technical Notes, Defect Resolution.
- PO: Acceptance, Priority Setting, Release Approval.
- PM: Dashboard, Reports, Cross-Module Visibility.
- UAT User: UAT Test Cases, Acceptance Testing.

### Phase 4 - Business Process & Design

Business Process Module:

- Visual BPMN-style process designer.
- Process stages: Identify -> Analyze -> Design -> Implement -> Test -> Release.
- Evidence artifact generated per stage.
- AI analysis per stage: completeness check, risk assessment, and quality score.
- Approval gate per stage transition.

Design Module:

- System architecture documentation.
- Data flow diagrams.
- API specifications.
- Database schema.
- Links to Requirements and Business Process artifacts.

### Phase 5 - AI Intelligence Layer

- Requirement analysis: completeness scoring, ambiguity detection, and missing requirement suggestions.
- Test coverage analysis: requirement-to-test-case mapping, coverage percentage, and gap identification.
- Defect pattern analysis: root cause clustering, regression risk scoring, and module health score.
- Release readiness assessment: quality gate checks, risk-based go/no-go recommendation, and historical trend analysis.
- Evidence system: immutable audit log linked to actions, artifacts, approvals, test execution results, defect reports, and AI analysis reports.

### Phase 6 - Approval Gates & Workflow

- Requirements: Draft -> Review -> Approved -> Baseline.
- Test Cases: Draft -> Ready -> In Review -> Approved.
- Defects: Open -> In Progress -> Resolved -> Verified -> Closed.
- Releases: Planning -> Testing -> UAT -> Approved -> Released.
- Business Process: Draft -> Validated -> Implemented -> Verified.
- Decision intelligence: AI recommendation, immutable approval evidence, escalation rules, and a full audit trail.

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

- `clarity-verification-platform-prod`: production deployment path for `main` (`https://nexqa.hambalifadib.my.id`).

Vercel receives `DATABASE_URL` from the Neon Vercel Integration for the production `main` deployment. Sandbox branches should use local database settings or manually created Neon branches when isolation is needed.

See [docs/ci-cd.md](docs/ci-cd.md) for the full GitHub -> Vercel -> NeonDB flow.

## Phase Roadmap

- Phase 1: QA Workflow MVP.
- Phase 2: Authentication, project ownership, and isolated guest mode.
- Phase 3: Requirements Management and RBAC foundation.
- Phase 4: Business Process and Design modules.
- Phase 5: AI Intelligence Layer and Evidence System.
- Phase 6: Approval Gates, workflow state machines, and decision intelligence.
