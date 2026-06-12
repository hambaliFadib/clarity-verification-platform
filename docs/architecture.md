# Architecture

NexQA - Clarity Platform uses a monorepo so the frontend, backend, CI, and documentation evolve together while each runtime remains cleanly separated.

## Components

- `apps/web`: Next.js frontend for QA project management workflows.
- `apps/api`: FastAPI backend for API routes, database access, and future domain services.
- NeonDB PostgreSQL: managed database for application data.
- Vercel: production hosting for the web app from `main`.
- GitHub Actions: validation for sandbox, integration, and production branches.

## Frontend

The frontend uses the Next.js App Router. Phase 1 now covers the MVP product surfaces:

- Test Cases
- Test Runs
- Defects
- My Work
- Settings
- Release Readiness
- Authentication entry points

The app keeps Phase 1 focused on stable QA CRUD, import/export, modal interactions, and production-readiness. Authentication and account flows exist as Phase 2 groundwork; full Google OAuth rollout, invite verification, guest-data lifecycle, and team/project rules remain Phase 2.

## Backend

The backend uses FastAPI with clear folders for:

- `core`: configuration and environment loading
- `db`: SQLAlchemy base and session helpers
- `models`: SQLAlchemy models
- `schemas`: request/response schemas
- `routers`: HTTP route modules
- `services`: business logic and import/export handling

Database connections are initialized lazily so simple imports and `/health` checks do not require a live database. Runtime CRUD is backed by PostgreSQL/NeonDB.

## Phase Continuation

- Phase 1 release promotes the stable foundation from `dev` to `main`.
- Phase 2 continues from the authentication scaffolding already present in the app.
- OAuth credentials, email delivery, guest data behavior, and production callback domains must be confirmed before Phase 2 is treated as complete.

## Database

PostgreSQL runs on NeonDB. SQLAlchemy owns runtime database access. Alembic owns schema migrations.

Recommended branch mapping:

- `main`: Neon production/default branch for real usage
- `dev`: integration branch validated by CI before promotion
- `dev-alpha`, `dev-beta`, `dev-charlie`: sandbox branches that use local database settings or manually created Neon branches when isolation is needed

## Scaling Rationale

This structure supports scaling because teams can work independently on frontend and backend code while sharing one PR workflow. The monorepo also makes cross-cutting changes, CI updates, and documentation changes easier for a 3-contributor team to review.
