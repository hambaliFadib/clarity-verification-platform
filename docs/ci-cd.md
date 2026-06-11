# CI/CD

This project uses GitHub Actions for validation and a single Vercel + NeonDB production path from `main`.

## Pull Request Checks

GitHub Actions runs on pull requests and pushes targeting these branches:

- `dev-alpha`
- `dev-beta`
- `dev-charlie`
- `dev`
- `main`

The Phase 1 pipeline checks:

- frontend dependency installation
- frontend type checking
- frontend build
- backend dependency installation
- Python compile validation
- FastAPI import validation
- Alembic environment compile validation

The workflow is intentionally small so early contributors can move quickly.

## Branch Flow

| Branch | Purpose | Merge Target |
|---|---|---|
| `dev-alpha` | Individual sandbox for feature and fixing work | `dev` |
| `dev-beta` | Individual sandbox for feature and fixing work | `dev` |
| `dev-charlie` | Individual sandbox for feature and fixing work | `dev` |
| `dev` | Integration branch for completed sandbox work | `main` |
| `main` | Production / real usage branch | none |

When `dev-alpha`, `dev-beta`, or `dev-charlie` is merged into `dev`, CI runs on `dev`.

When `dev` is merged into `main`, CI runs on `main` and Vercel deploys production.

## Vercel Deployment Flow

The active deployment path uses one Vercel project:

### Production Project (`clarity-verification-platform-prod`)

| Setting | Value |
|---|---|
| Production Branch | `main` |
| Root Directory | `apps/web` |
| Framework | Next.js |
| Build Command | `npm run build:web` |
| Install Command | `npm install` |
| Production URL | `https://clarity-verification-platform-web.vercel.app` |

- Push to `main` creates the production deployment.
- Pushes to `dev`, `dev-alpha`, `dev-beta`, `dev-charlie`, and retired `demo` are disabled for Vercel Git deployments by `apps/web/vercel.json`.
- Sandbox and integration branches are validated by GitHub Actions only.

The old development Vercel project is no longer part of the main workflow. If it is kept, set **Ignored Build Step** to `exit 0` so Git-triggered builds are skipped, or remove it manually once there is no deployment history you still need.

## NeonDB Mapping

The default workflow keeps NeonDB focused on production:

| Git Branch | Neon Usage | Purpose |
|---|---|---|
| `main` | `production` / default branch | Production data for real usage |
| `dev` | local DB or manually created Neon branch | Integration validation |
| `dev-alpha` | local DB or manually created Neon branch | Sandbox work |
| `dev-beta` | local DB or manually created Neon branch | Sandbox work |
| `dev-charlie` | local DB or manually created Neon branch | Sandbox work |

Only the Vercel production environment should receive the production `DATABASE_URL` from the Neon Vercel Integration.

## Environment Variable Mapping

Required values:

- `DATABASE_URL`: server-side database connection string
- `NEXT_PUBLIC_API_BASE_URL`: browser-visible API base URL
- `ENVIRONMENT`: local, ci, or production
- `NEXTAUTH_SECRET`: NextAuth JWT/session signing secret
- `NEXTAUTH_URL`: canonical web URL for auth callbacks
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Google OAuth credentials for Phase 2 auth

Do not commit real values. Use `.env.example` for documentation, `.env.local` for local secrets, GitHub secrets for CI, and Vercel environment variables for production deployments.

## Manual Setup Checklist

### Vercel Production Project

1. Use the existing `clarity-verification-platform-prod` Vercel project.
2. Set **Root Directory** to `apps/web`.
3. Set **Production Branch** to `main`.
4. Set **Framework Preset** to `Next.js`.
5. Set **Install Command** to `npm install`.
6. Set **Build Command** to `npm run build:web`.
7. Add environment variables: `DATABASE_URL` from Neon production, `NEXT_PUBLIC_API_BASE_URL`, `ENVIRONMENT=production`.
8. Add auth variables before enabling Google sign-in: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`.

## Phase Release Notes

Phase 1 releases are promoted from `dev` to `main` only after the frontend build, frontend typecheck, and backend compile validation pass locally or in CI.

Phase 2 work can land behind MVP-safe behavior, but production sign-in should not be treated as complete until Google OAuth credentials, email verification delivery, guest data lifecycle, and production callback URLs are confirmed.

### Vercel `.next` Output Error

If a Vercel deployment says `.next` was not found at `/vercel/path0/.next`, the project is building from the repository root while expecting a root-level Next.js app. Fix the Vercel project settings:

- Root Directory: `apps/web`
- Framework Preset: `Next.js`
- Install Command: `npm install`
- Build Command: `npm run build:web`
- Output Directory: Next.js default

### NeonDB

1. Keep the default `production` branch for `main`.
2. Use local database settings for sandbox work by default.
3. Create manual Neon child branches only when a sandbox needs isolated shared data.
4. Do not wire sandbox branches into the production Vercel project.

## GitHub Push Flow

Start sandbox work from `dev`:

```bash
git checkout dev
git pull origin dev
git checkout dev-alpha
git merge dev
git push origin dev-alpha
```

After a sandbox branch is ready:

```bash
git checkout dev
git pull origin dev
git merge dev-alpha
git push origin dev
```

After `dev` is stable and has no known blocking bugs:

```bash
git checkout main
git pull origin main
git merge dev
git push origin main
git checkout dev
```
