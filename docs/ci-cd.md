# CI/CD

This project uses GitHub, Vercel, and NeonDB together.

## Pull Request Checks

GitHub Actions runs on pull requests and pushes targeting `dev`, `demo`, and `main`.

The Phase 1 pipeline checks:

- frontend dependency installation
- frontend type checking
- frontend build
- backend dependency installation
- Python compile validation
- FastAPI import validation
- Alembic environment compile validation

The workflow is intentionally small so early contributors can move quickly.

## Vercel Deployment Flow

The project uses **two Vercel projects** connected to the same GitHub repository:

### Project 1: Production (`clarity-verification-platform-prod`)

| Setting | Value |
|---|---|
| Production Branch | `main` |
| Root Directory | `apps/web` |
| Framework | Next.js (auto-detected) |

- Push to `main` → Production Deployment (real usage URL).
- Push to `demo` → Preview Deployment (public trial URL).
- Push to `feat/*` → Preview Deployment (feature preview URL).

### Project 2: Development (`clarity-verification-platform-dev`)

| Setting | Value |
|---|---|
| Production Branch | `dev` |
| Root Directory | `apps/web` |
| Framework | Next.js (auto-detected) |

- Push to `dev` → Production Deployment on the dev project (sandbox URL).

### Why Two Projects?

Vercel only creates a permanent Production Deployment for the configured Production Branch. A single project with `main` as Production Branch would only generate Preview Deployments for `dev`, which expire and lack a stable URL. The second project gives `dev` its own permanent deployment URL for sandbox testing.

## NeonDB Branch Mapping

The NeonDB project has 3 branches that mirror the Git branches:

| Git Branch | Neon Branch | Purpose |
|---|---|---|
| `main` | `production` (Default) | Production data for real usage |
| `demo` | `demo` | Public trial data |
| `dev` | `dev` | Sandbox / experimental data |

### Connecting NeonDB to Vercel

Each Vercel project should have `DATABASE_URL` set in its Environment Variables pointing to the matching Neon branch connection string.

**Production Vercel project** (`clarity-verification-platform-prod`):

| Vercel Environment | Neon Branch | How |
|---|---|---|
| Production (`main`) | `production` | Set `DATABASE_URL` in Production environment |
| Preview (`demo`, `feat/*`) | `demo` | Set `DATABASE_URL` in Preview environment |

**Development Vercel project** (`clarity-verification-platform-dev`):

| Vercel Environment | Neon Branch | How |
|---|---|---|
| Production (`dev`) | `dev` | Set `DATABASE_URL` in Production environment |

To set these values:
1. Go to each Vercel project → Settings → Environment Variables.
2. Add `DATABASE_URL` with the Neon connection string for the matching branch.
3. Select the correct environment (Production / Preview / Development).
4. Also add `NEXT_PUBLIC_API_BASE_URL` and `ENVIRONMENT` for each environment.

Alternatively, use the **Neon Vercel Integration** from the Neon dashboard to automatically sync `DATABASE_URL` values.

## Environment Variable Mapping

Required values:

- `DATABASE_URL`: server-side database connection string
- `NEXT_PUBLIC_API_BASE_URL`: browser-visible API base URL
- `ENVIRONMENT`: local, dev, preview, production, or ci

Do not commit real values. Use `.env.example` for documentation, `.env.local` for local secrets, GitHub secrets for CI, and Vercel environment variables for deployments.

## Manual Setup Checklist

### Vercel Production Project

1. Import GitHub repository as a new Vercel project.
2. Set **Root Directory** to `apps/web`.
3. Set **Production Branch** to `main` (Settings → Git).
4. Add environment variables: `DATABASE_URL` (from Neon `production` branch), `NEXT_PUBLIC_API_BASE_URL`, `ENVIRONMENT=production`.
5. Set Preview environment `DATABASE_URL` to the Neon `demo` branch connection string.

### Vercel Development Project

1. Import the **same** GitHub repository as another Vercel project.
2. Set **Root Directory** to `apps/web`.
3. Set **Production Branch** to `dev` (Settings → Git).
4. Add environment variables: `DATABASE_URL` (from Neon `dev` branch), `NEXT_PUBLIC_API_BASE_URL`, `ENVIRONMENT=dev`.

### NeonDB

1. Keep the default `production` branch for `main`.
2. Create a `demo` branch from `production`.
3. Create a `dev` branch from `production`.
4. Copy each branch's connection string into the matching Vercel project environment variable.

## GitHub Push Flow

Use this order when publishing branch changes:

```bash
git push origin dev
git checkout demo
git merge dev
git push origin demo
git checkout main
git merge demo
git push origin main
git checkout dev
```

For normal feature work, push only the feature branch and open a pull request to `dev`.
