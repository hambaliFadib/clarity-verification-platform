# Database Migration Workflow

NexQA uses SQLAlchemy for models and Alembic for migrations.

Run commands from `apps/api`.

## Setup

```bash
cd apps/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Set `DATABASE_URL` in your local environment before running migrations.

## Create Migration

```bash
alembic revision --autogenerate -m "create initial qa tables"
```

Review the generated migration before committing it.

## Apply Migrations

```bash
alembic upgrade head
```

## Roll Back

```bash
alembic downgrade -1
```

## Branching With NeonDB

Recommended Neon branch usage:

- `main`: production/default Neon branch used by the Vercel production deployment
- `dev`: integration branch validated by CI before promotion to `main`
- `dev-alpha`, `dev-beta`, `dev-charlie`: sandbox branches that should use local database settings or manually created Neon branches only when isolation is needed

The default workflow keeps Vercel and Neon focused on `main`. Sandbox work should not rely on automatic Vercel Preview Deployments.
