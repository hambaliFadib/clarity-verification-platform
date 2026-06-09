# NexQA Backend Preparation

Backend is not implemented yet. This folder prepares the database layer so API routes can be added later without exposing database credentials to the React client.

## Neon Setup

1. Run Neon CLI init/login:

   ```bash
   npm.cmd run neon:init
   ```

   In this Codex session the command waits for browser auth/API key, so complete the login locally or set `NEON_API_KEY`.

2. Copy env values:

   ```bash
   copy .env.example .env.local
   ```

3. Fill `DATABASE_URL` with your Neon pooled connection string.

4. Test the database connection:

   ```bash
   npm.cmd run db:smoke
   ```

## Files

- `db/neon.js` exports a server-only Neon SQL client.
- `db/schema.sql` contains the first NexQA tables.
- `scripts/db-smoke.mjs` validates `DATABASE_URL`.
