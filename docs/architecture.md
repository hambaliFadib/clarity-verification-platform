# Architecture

NexQA - Clarity Platform uses a monorepo so the frontend, backend, CI, and documentation evolve together while each runtime remains cleanly separated.

## Components

- `apps/web`: Next.js frontend for QA project management workflows.
- `apps/api`: FastAPI backend for API routes, database access, and future domain services.
- NeonDB PostgreSQL: managed database for application data.
- Vercel: production hosting for the web app from `main`.
- GitHub Actions: validation for sandbox, integration, and production branches.

## Frontend

The frontend uses the Next.js App Router. Phase 1 starts with a minimal landing surface for the product focus areas:

- Test Cases
- Test Runs
- Defects
- Release Readiness

The app is intentionally light. Full TCMS screens, authentication, and integrations are later work.

## Backend

The backend uses FastAPI with clear folders for:

- `core`: configuration and environment loading
- `db`: SQLAlchemy base and session helpers
- `models`: future SQLAlchemy models
- `schemas`: future request/response schemas
- `routers`: HTTP route modules
- `services`: future business logic

Database connections are initialized lazily so simple imports and `/health` checks do not require a live database.

## Database

PostgreSQL runs on NeonDB. SQLAlchemy owns runtime database access. Alembic owns schema migrations.

Recommended branch mapping:

- `main`: Neon production/default branch for real usage
- `dev`: integration branch validated by CI before promotion
- `dev-alpha`, `dev-beta`, `dev-charlie`: sandbox branches that use local database settings or manually created Neon branches when isolation is needed

## Scaling Rationale

This structure supports scaling because teams can work independently on frontend and backend code while sharing one PR workflow. The monorepo also makes cross-cutting changes, CI updates, and documentation changes easier for a 3-contributor team to review.
