# NeonDB Production Setup

Use this checklist when preparing the production database for NexQA.

## Region

Create the Neon project in Singapore:

```bash
neon projects create --name clarity-platform-prod --region-id aws-ap-southeast-1 --database clarity --role clarity_app
```

Neon region id for AWS Asia Pacific Singapore is `aws-ap-southeast-1`. Neon selects the region when the project is created, and all branches/databases in that project use that region. If a project is created in the wrong region, create a new project in the target region and migrate the data.

## Environment Variables

Set these values for the API runtime:

```env
DATABASE_URL=postgresql://<role>:<password>@<host>/<database>?sslmode=require&channel_binding=require
NEXT_PUBLIC_API_BASE_URL=https://<api-host>
ENVIRONMENT=production
ALLOWED_ORIGINS=https://nexqa.hambalifadib.my.id,https://clarity-verification-platform-web.vercel.app
NEXTAUTH_URL=https://nexqa.hambalifadib.my.id
```

For Alembic migrations, prefer the direct or unpooled Neon connection string when available.

## Run Migrations

From the repository root:

```powershell
cd apps/api
$env:DATABASE_URL="postgresql://<role>:<password>@<host>/<database>?sslmode=require&channel_binding=require"
alembic upgrade head
```

## Production Dummy Data Cleanup

This project no longer auto-seeds users, and the frontend mock dataset file has been removed. Before production, confirm the target Neon database is dedicated to this project, then remove old MVP/demo data if any was imported during development.

Use this only after confirming the database is not shared:

```sql
truncate table
  activity_items,
  approval_gates,
  audit_trail,
  defect_comments,
  defects,
  environments,
  permissions,
  projects,
  releases,
  requirement_comments,
  requirement_tags,
  requirement_test_cases,
  requirement_versions,
  requirements,
  role_permissions,
  roles,
  test_run_comments,
  test_run_evidence,
  test_run_executions,
  test_run_schedules,
  test_run_test_cases,
  test_runs,
  test_steps,
  test_cases,
  user_roles,
  users,
  work_items
restart identity cascade;
```

## Neon Project Cleanup

List projects first and keep only the project used by this app:

```bash
neon projects list
```

Delete only explicitly confirmed unused project IDs:

```bash
neon projects delete <project-id>
```

Do not delete projects based on names alone. Record the kept project id, region id, and connection host in the production handoff notes.
