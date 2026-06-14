# Phase Roadmap

This document tracks the active production release line and the next product phases for NexQA - Clarity Platform.

## Status Summary

Phase 1 and Phase 2 established the production foundation:

- Neon-backed CRUD for test cases, defects, environments, releases, work items, and test runs.
- XLSX import/export and template support for test cases.
- Google OAuth and guest mode scaffolding.
- Guest data isolation for simulation mode.
- Project-scoped data access for authenticated users.
- Account, project settings, team member, and workspace label foundations.
- Production deployment from `main` to Vercel.

The current promotion line adds the Requirements/RBAC foundation and early workflow intelligence surfaces. Anything not fully enforced remains guarded or tracked as open follow-up work.

## Phase 3 - Foundation: Requirements and RBAC

Highest priority. This phase turns Requirements from a placeholder into the foundation module for traceability and role-based collaboration.

### Requirements Management

Implemented foundation:

- Requirements list, create, detail, and edit surfaces.
- Requirement comments.
- Requirement to test case linkage.
- Traceability view for requirement to test case to defect coverage.
- Functional, non-functional, and business-rule requirement categorization.
- AI-assisted requirement analysis panel.
- Import/export entry points for requirements.
- Datatable navigation and visual alignment fixes.

Remaining work:

- Auto-generate test cases from approved requirements.
- Enforce approval states before baseline and test generation.
- Expand traceability into release-readiness evidence.
- Harden import parsing for every supported source format.

### Role-Based Access Control

Implemented foundation:

- Role, permission, role-permission, and user-role schema.
- RBAC service helpers.
- Guarded RBAC admin APIs.
- Initial permission checker utilities for requirements and test runs.

Remaining work:

- Enforce the final role hierarchy in every frontend and backend workflow.
- Seed and manage roles for BA, SA, QA, Developer, PO, PM, and UAT User.
- Add owner/member/project membership checks to every protected resource.
- Add UI for role assignment after product rules are approved.

Target role split:

- BA: Create/Edit Requirements, View Business Process.
- SA: Design Documents, Architecture, Technical Specs.
- QA: Test Cases, Test Runs, Defects.
- Developer: Code Review, Technical Notes, Defect Resolution.
- PO: Acceptance, Priority Setting, Release Approval.
- PM: Dashboard, Reports, Cross-Module Visibility.
- UAT User: UAT Test Cases, Acceptance Testing.

## Phase 4 - Business Process and Design

Planned scope:

- Business Process module.
- BPMN-style process designer.
- Process stages: Identify, Analyze, Design, Implement, Test, Release.
- Evidence artifact per stage.
- AI analysis per stage: completeness check, risk assessment, and quality score.
- Approval gate per stage transition.
- Design module for SA users: architecture documentation, data flow diagrams, API specifications, database schema, and links back to requirements and business processes.

## Phase 5 - AI Intelligence Layer

Planned scope:

- Requirement analysis for completeness, ambiguity, and missing requirement suggestions.
- Test coverage analysis from requirement to test case mapping.
- Defect pattern analysis, root cause clustering, regression risk, and module health.
- Release readiness assessment with quality gates and risk-based go/no-go recommendation.
- Evidence system with immutable audit log, document artifacts, test execution results, defect reports, approval decisions, and AI analysis reports.

## Phase 6 - Approval Gates and Workflow

Early foundation already exists:

- `approval_gates` and `audit_trail` database tables.
- Approval gate backend model, schema, router, and service foundation.
- Audit trail query foundation.
- Analytics MVP and quality score surface.
- Approval gate write mutations locked behind `ENABLE_APPROVAL_GATE_MUTATIONS`.

Remaining work:

- Wire approval gates into Requirements, Test Cases, Defects, Releases, and Business Process state machines.
- Enforce RBAC checks for every approval action.
- Build approval queue, audit trail detail, and evidence views.
- Add escalation rules for overdue decisions.
- Add full audit trail of who approved what and when.

Target state machines:

- Requirements: Draft -> Review -> Approved -> Baseline.
- Test Cases: Draft -> Ready -> In Review -> Approved.
- Defects: Open -> In Progress -> Resolved -> Verified -> Closed.
- Releases: Planning -> Testing -> UAT -> Approved -> Released.
- Business Process: Draft -> Validated -> Implemented -> Verified.

## Promotion Rule

Promote `dev` to `main` only when:

- `npm run typecheck:web` passes.
- `npm run build:web` passes.
- `python -m compileall apps/api/app` passes.
- Backend import smoke passes.
- Known blocking UI, CRUD, auth, or security bugs are fixed or explicitly tracked.

Release principle: Quality Before Speed, Clarity Before Release.
