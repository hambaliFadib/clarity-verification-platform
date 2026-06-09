# Architecture

NexQA - Clarity Platform uses a monorepo so the frontend, backend, CI, and documentation evolve together while each runtime remains cleanly separated.

## Components

- `apps/web`: Next.js frontend for QA project management workflows.
- `apps/api`: FastAPI backend for API routes, database access, and future domain services.
- NeonDB PostgreSQL: managed database for application data.
- Vercel: hosting for the web app and preview deployments.
- GitHub Actions: validation for pull requests to `dev` and `main`.

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

- `main`: Neon main branch in the future
- `dev`: persistent Neon dev branch
- `feat/*`: dynamic child branches for preview environments when configured

## Scaling Rationale

This structure supports scaling because teams can work independently on frontend and backend code while sharing one PR workflow. The monorepo also makes cross-cutting changes, CI updates, and documentation changes easier for a 3-contributor team to review.
