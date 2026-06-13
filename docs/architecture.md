# Architecture

NexQA - Clarity Platform uses a monorepo so the frontend, backend, CI, and documentation evolve together while each runtime remains cleanly separated. The product direction is quality intelligence: requirements, traceability, QA execution, defects, evidence, and approval decisions should connect into one auditable workflow.

## Components

- `apps/web`: Next.js frontend for QA project management workflows.
- `apps/api`: FastAPI backend for API routes, database access, and future domain services.
- NeonDB PostgreSQL: managed database for application data.
- Vercel: production hosting for the web app from `main`.
- GitHub Actions: validation for sandbox, integration, and production branches.

## Frontend

The frontend uses the Next.js App Router. The current production baseline covers:

- Test Cases
- Test Runs
- Defects
- My Work
- Settings
- Release Readiness
- Authentication entry points
- Project-scoped API behavior
- Guest-only isolated demo fixtures

Phase 1 delivered the QA workflow MVP. Phase 2 added Google OAuth, account entry points, project ownership, project member scoping, and guest isolation. Guest mode must remain a resettable sandbox that never reads from or writes to NeonDB.

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

- Phase 3: Requirements Management and RBAC foundation.
- Phase 4: Business Process and Design modules.
- Phase 5: AI Intelligence Layer and Evidence System.
- Phase 6: Approval Gates, workflow state machines, and decision intelligence.

Priority principle: **Quality Before Speed, Clarity Before Release**.

## Database

PostgreSQL runs on NeonDB. SQLAlchemy owns runtime database access. Alembic owns schema migrations.

Recommended branch mapping:

- `main`: Neon production/default branch for real usage
- `dev`: integration branch validated by CI before promotion
- `dev-alpha`, `dev-beta`, `dev-charlie`: sandbox branches that use local database settings or manually created Neon branches when isolation is needed

## Scaling Rationale

This structure supports scaling because teams can work independently on frontend and backend code while sharing one PR workflow. The monorepo also makes cross-cutting changes, CI updates, and documentation changes easier for a 3-contributor team to review.
