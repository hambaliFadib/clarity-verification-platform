# Phase Roadmap

This document tracks the current release line and the next planned scope for Clarity Platform.

## Phase 1 Release

Phase 1 is the production foundation release. It focuses on stable QA workflows and production-backed CRUD before deeper workflow automation.

Included scope:

- Test case management with NeonDB-backed CRUD.
- Defect and defect comment management.
- Environment, project, release, activity, work item, and test run MVP APIs.
- XLSX import/export flow for test cases.
- Modal layering and backdrop bug fixes for import/export, filters, defect actions, and environment creation.
- UI consistency fixes for Test Cases, Defects, My Work, Project Settings, and navbar branding.
- Authentication scaffolding through NextAuth, Google provider wiring, guest login, account entry page, and backend OAuth sync endpoint.

Phase 1 does not claim full authentication, full team workflow, or advanced automation readiness.

## Phase 2 Next Scope

Phase 2 activates product workflows that depend on identity and project ownership.

Planned scope:

- Google OAuth production rollout.
- First registration verification link.
- Account settings for profile updates, password reset support, and account deletion.
- Guest mode hardening and cleanup behavior.
- Create-project-first flow and one-project restriction.
- Team member sync from Google users and invitation verification by email.
- My Work drag-to-move activation with DB persistence.
- Project Settings unlock after authentication and ownership rules are ready.

## Decisions Required

- Google Cloud OAuth project and redirect/callback domains.
- Email provider for verification and invitation links.
- Guest data strategy: client memory only or server session with TTL.
- Production domain and Vercel environment variable parity.

## Out Of Scope For Phase 2

- Full external automation runtime beyond local database-backed workflows.
- Complex RBAC beyond basic owner/member restrictions.
- Advanced analytics and release readiness forecasting.

## Promotion Rule

Promote `dev` to `main` only when:

- `npm run typecheck:web` passes.
- `npm run build:web` passes.
- `python -m compileall apps/api/app` passes.
- Known blocking UI or CRUD bugs are either fixed or explicitly tracked.
