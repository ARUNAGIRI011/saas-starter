# saas-starter

Open SaaS starter based on [wasp-lang/open-saas](https://github.com/wasp-lang/open-saas), with a dedicated Supabase Postgres project.

## Stack

- Wasp + React + Node.js
- Prisma ORM
- Supabase-hosted PostgreSQL for application persistence

## Supabase project

- Project ref: `foofasruojdhjggmgscf`
- Region: `ap-south-1` (Mumbai)
- Project URL: https://foofasruojdhjggmgscf.supabase.co

## Configure database

See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md). Never commit database passwords, service-role keys, or populated environment files.

## Important architecture note

This starter keeps Wasp authentication and server-side application operations. Supabase is being used as the managed PostgreSQL host through Prisma. This does not automatically replace Wasp Auth with Supabase Auth or make browser-side Supabase access safe. Keep database access server-side unless you separately design and test RLS policies and an auth-identity mapping.
