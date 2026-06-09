# CI/CD

This project uses GitHub, Vercel, and NeonDB together.

## Pull Request Checks

GitHub Actions runs on pull requests targeting `dev` and `main`.

The Phase 1 pipeline checks:

- frontend dependency installation
- frontend build
- backend dependency installation
- Python compile validation
- FastAPI import validation

The workflow is intentionally small so early contributors can move quickly.

## Vercel Deployment Flow

Connect the GitHub repository to Vercel and use the Next.js app in `apps/web`.

Recommended branch behavior:

- `dev`: Vercel Preview Deployment
- `feat/*`: Vercel Preview Deployment
- `main`: Production Deployment in a future phase

If Vercel is configured from the repository root, use the root `vercel.json` build command. If Vercel is configured with a monorepo Root Directory, set the Root Directory to `apps/web` and let Vercel detect Next.js automatically.

## NeonDB Branch Flow

Use the Neon Vercel Integration so database URLs can be injected into Vercel environment variables.

Recommended mapping:

- `main`: Neon main branch in the future
- `dev`: persistent Neon dev branch
- `feat/*`: dynamic Neon child branch for preview environments

Preview deployments should receive branch-specific `DATABASE_URL` values. This keeps feature testing isolated from shared development data.

## Environment Variable Mapping

Required values:

- `DATABASE_URL`: server-side database connection string
- `NEXT_PUBLIC_API_BASE_URL`: browser-visible API base URL
- `ENVIRONMENT`: local, dev, preview, production, or ci

Do not commit real values. Use `.env.example` for documentation, `.env.local` for local secrets, GitHub secrets for CI, and Vercel environment variables for deployments.

## Manual Setup

1. Connect GitHub repository to Vercel.
2. Configure Vercel project Root Directory or root build command.
3. Install the Neon Vercel Integration.
4. Map `dev` to a persistent Neon dev branch.
5. Enable preview branches for `feat/*` if the team wants isolated database previews.
6. Confirm `DATABASE_URL` is present in Vercel Preview and Production environments.
