# Phase Roadmap

This document tracks the production baseline and the next planned product phases for NexQA - Clarity Platform.

## Current Production Baseline

### Phase 1 - QA Workflow MVP

Phase 1 established the first stable QA workflow surface:

- Test case management.
- Defect and defect comment management.
- XLSX import/export for test case operations.
- Environment, project, release, activity, test run, and work item MVP APIs.
- UI consistency fixes across Test Cases, Defects, My Work, Project Settings, navbar, modals, filters, and import/export flows.

### Phase 2 - Authentication, Project Ownership, And Guest Isolation

Phase 2 moved the product into production-oriented identity and data isolation:

- Google OAuth production setup.
- Account entry point and session handling.
- Project ownership and project member scoping.
- Invite-by-email flow for users already registered in the platform.
- Contributor role default for Google users while detailed hierarchy is not yet active.
- Guest mode as an isolated demo sandbox.
- Guest data is served from resettable dummy fixtures and never reads from or writes to NeonDB.
- Core API routes are scoped by project membership to prevent cross-project data exposure.

## Next Implementation Roadmap

Priority principle: **Quality Before Speed, Clarity Before Release**.

Because Phase 1 and Phase 2 are already part of the production baseline, the next product roadmap starts at Phase 3.

## Phase 3 - Foundation: Requirements & RBAC

Highest priority. This phase replaces the Requirements placeholder with a real requirements foundation and introduces role-based collaboration rules.

### 3.1 Requirements Management

```text
Requirements
|-- Functional Requirements
|   |-- User stories
|   `-- Acceptance criteria
|-- Non-Functional Requirements
|   |-- Performance
|   `-- Security
|-- Business Rules
|   |-- Validation rules
|   `-- Constraints
|-- Traceability Matrix
|   `-- Requirement -> Test Case -> Defect
`-- AI-Assisted
    `-- Auto-generate test cases from requirements
```

### 3.2 Role-Based Access Control

```text
Roles
|-- BA:        Create/Edit Requirements, View Business Process
|-- SA:        Design Documents, Architecture, Technical Specs
|-- QA:        Test Cases, Test Runs, Defects
|-- Developer: Code Review, Technical Notes, Defect Resolution
|-- PO:        Acceptance, Priority Setting, Release Approval
|-- PM:        Dashboard, Reports, Cross-Module Visibility
`-- UAT User:  UAT Test Cases, Acceptance Testing
```

## Phase 4 - Business Process & Design

### 4.1 Business Process Module

```text
Business Process
|-- Process Designer (visual BPMN-style editor)
|-- Process Stages: Identify -> Analyze -> Design -> Implement -> Test -> Release
|-- Each Stage -> Evidence Artifact
|-- AI Analysis per Stage
|   |-- Completeness Check
|   |-- Risk Assessment
|   `-- Quality Score
`-- Approval Gate per Stage Transition
```

### 4.2 Design Module

```text
Design
|-- System Architecture Documentation
|-- Data Flow Diagrams
|-- API Specifications
|-- Database Schema
`-- Link to Requirements & Business Process
```

## Phase 5 - AI Intelligence Layer

### 5.1 AI Analysis Engine

```text
AI Analysis
|-- Requirement Analysis
|   |-- Completeness scoring
|   |-- Ambiguity detection
|   `-- Auto-suggest missing requirements
|-- Test Coverage Analysis
|   |-- Requirement <-> Test Case mapping
|   |-- Coverage percentage
|   `-- Gap identification
|-- Defect Pattern Analysis
|   |-- Root cause clustering
|   |-- Regression risk scoring
|   `-- Module health score
`-- Release Readiness Assessment
    |-- Quality gate checks
    |-- Risk-based go/no-go recommendation
    `-- Historical trend analysis
```

### 5.2 Evidence System

```text
Evidence
|-- Auto-generated from actions
|-- Immutable audit log
|-- Linked to specific stage in business process
|-- Types
|   |-- Document artifacts (requirements, designs)
|   |-- Test execution results
|   |-- Defect reports
|   |-- Approval decisions
|   `-- AI analysis reports
`-- Each evidence -> decision point
```

## Phase 6 - Approval Gates & Workflow

### 6.1 State Machine Per Entity

```text
Approval Gates
|-- Requirements:      Draft -> Review -> Approved -> Baseline
|-- Test Cases:        Draft -> Ready -> In Review -> Approved
|-- Defects:           Open -> In Progress -> Resolved -> Verified -> Closed
|-- Releases:          Planning -> Testing -> UAT -> Approved -> Released
`-- Business Process:  Draft -> Validated -> Implemented -> Verified
```

### 6.2 Decision Points

```text
Decision Intelligence
|-- Each stage transition requires approval
|-- AI provides recommendation (Go/No-Go/Risk)
|-- Approval evidence is immutable
|-- Escalation rules (auto-escalate if overdue)
`-- Full audit trail of who approved what and when
```

## Promotion Rule

Promote `dev` to `main` only when:

- `npm run typecheck:web` passes.
- `npm run build:web` passes.
- `python -m compileall apps/api/app` passes.
- Known blocking UI, CRUD, security, or data isolation bugs are either fixed or explicitly tracked.
