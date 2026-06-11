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
ALLOWED_ORIGINS=https://<web-host>
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
  defect_comments,
  defects,
  environments,
  projects,
  releases,
  test_runs,
  test_steps,
  test_cases,
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
