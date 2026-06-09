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

Connect the GitHub repository to Vercel and use the Next.js app in `apps/web`.

Recommended branch behavior:

- `dev`: separate Vercel development project for sandbox/pre-production verification
- `demo`: preview or demo deployment for features ready to be tried publicly
- `main`: production deployment for real usage
- `feat/*`: preview deployments while feature work is still isolated

The production Vercel project uses `main` as the Production Branch. The development Vercel project uses `dev` as its Production Branch so sandbox work can be checked before promotion.

If Vercel is configured with a monorepo Root Directory, set the Root Directory to `apps/web`. The app-level `apps/web/vercel.json` keeps the build command compatible with that setting.

## NeonDB Branch Flow

Use the Neon Vercel Integration so database URLs can be injected into Vercel environment variables.

Recommended mapping:

- `main`: Neon main branch for production data
- `demo`: Neon demo branch for public trial data
- `dev`: persistent Neon dev branch for sandbox data
- `feat/*`: dynamic Neon child branch for preview environments

Preview deployments should receive branch-specific `DATABASE_URL` values. This keeps feature testing isolated from shared development data.

## Environment Variable Mapping

Required values:

- `DATABASE_URL`: server-side database connection string
- `NEXT_PUBLIC_API_BASE_URL`: browser-visible API base URL
- `ENVIRONMENT`: local, dev, preview, production, or ci

Do not commit real values. Use `.env.example` for documentation, `.env.local` for local secrets, GitHub secrets for CI, and Vercel environment variables for deployments.

## Manual Setup

1. Connect GitHub repository to the production Vercel project.
2. Set production project Production Branch to `main`.
3. Connect the same GitHub repository to a development Vercel project.
4. Set development project Production Branch to `dev`.
5. Configure Root Directory as `apps/web` on both projects.
6. Install or connect the Neon Vercel Integration.
7. Map `main`, `demo`, and `dev` to separate Neon branches where possible.
8. Enable preview branches for `feat/*` if the team wants isolated database previews.
9. Confirm `DATABASE_URL` is present in Vercel Preview and Production environments.

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
