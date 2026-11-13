# Supabase Postgres setup

## Project

- Project ref: `foofasruojdhjggmgscf`
- Region: `ap-south-1` (Mumbai)
- API URL: https://foofasruojdhjggmgscf.supabase.co

## Configure credentials

1. Open the Supabase project and go to **Connect**.
2. Copy the PostgreSQL connection strings. Do not guess the pooler hostname or password.
3. Put the transaction-pooler URI in `DATABASE_URL` for the running application. The Prisma schema expects the pooler connection to support PgBouncer (commonly port 6543 and `pgbouncer=true`).
4. Put the direct database URI in `DIRECT_URL` for Prisma schema migrations. If direct connectivity is not available from your network because it is IPv4-only, use the Supabase **Session pooler** URI for migrations instead; do not use transaction pooling for migration commands.
5. Copy `template/app/.env.server.example` to the server environment file required by your Wasp version and populate the two variables. Keep the real file out of Git.

## Prisma migrations

From the Wasp app directory, after installing the Wasp CLI version compatible with the app's `main.wasp.ts`:

```bash
wasp db migrate-dev
```

For a production release, generate and review a migration in development, then apply it with the production migration command supported by your pinned Wasp/Prisma version. Do not run development migration commands against production.

## Security and architecture

- Wasp currently owns application authentication and server-side business logic. Prisma connects to Supabase Postgres; this setup does not migrate user identities to Supabase Auth.
- Keep the database password and any Supabase service-role key on the server only. Never prefix secrets with `VITE_` or expose them in browser bundles.
- Do not access application tables from the browser with the anon/publishable key unless you first enable RLS and add policies that map the authenticated identity to each row. Wasp's user IDs and Supabase Auth user IDs are not automatically the same.
- Prisma's privileged database connection can bypass RLS depending on the database role. Enforce authorization in Wasp server operations and test tenant isolation there.
- The project API URL alone is not a database connection string. Obtain the actual connection strings from the Supabase Dashboard.

## Validation checklist

- [ ] `DATABASE_URL` and `DIRECT_URL` are set in the server environment, not committed.
- [ ] `npx prisma validate` succeeds from the app directory.
- [ ] A development migration succeeds against the new Supabase database.
- [ ] Wasp can start and complete a read/write smoke test.
- [ ] Unauthorized users cannot read or mutate another user's records through Wasp operations.
- [ ] Production uses separate credentials/environment variables and reviewed migrations.
