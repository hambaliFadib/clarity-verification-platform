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

- `dev`: persistent shared development branch
- `feat/*`: preview child branches for isolated feature testing
- `main`: production branch in a future phase

When using Vercel Preview Deployments, the Neon Vercel Integration can inject branch-specific `DATABASE_URL` values so preview builds do not write to the shared dev database.
