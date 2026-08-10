# Aluminium World — MVP demo

Prototype build for Arif (Aluminium World, Kalpetta). Not production. Not for real
customer data. Full spec: `AW_MVP_BUILD_SPEC.md` in the parent folder.

## One-time setup (do this before the demo)

1. **Create a Supabase project** (free tier is fine). Grab from Project Settings → API:
   - Project URL
   - `anon` public key
2. **Enable anonymous sign-ins**: Authentication → Providers → Anonymous → toggle on.
   (This app's demo login has no passwords — see the auth-model note at the top of
   `supabase/schema.sql` for why.)
3. **Run the schema**: SQL Editor → paste all of `supabase/schema.sql` → Run.
4. **Run the seed data**: SQL Editor → paste all of `supabase/seed.sql` → Run.
5. **Local env**: copy `.env.local.example` to `.env.local`, fill in the URL + anon key.
6. **GitHub Actions secrets** (repo → Settings → Secrets and variables → Actions):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. **GitHub Pages**: repo → Settings → Pages → Source: GitHub Actions.

## Local preview

```bash
npm install
npm run dev
```

## Deploy

Push to `main` — the `deploy.yml` workflow builds and publishes to GitHub Pages
automatically. Live at the repo's Pages URL (see `next.config.ts` for the base path).

## What's real vs. what's a shortcut (say this out loud if asked)

- Every screen talks to a real Supabase database — this is not a click-through mock.
- Login is a "tap your name" demo switcher, gated by `NEXT_PUBLIC_DEMO_MODE`, using
  Supabase anonymous sessions rather than real accounts. Anyone can self-select the
  owner role this way — fine for a gated demo, not real access control.
- Rate card is intentionally empty. Fill it in with Arif live — see spec §11.
- Public customer/driver links (`/q`, `/track`, `/delivery`) never query tables
  directly — only through token-checked database functions, so the anon key in the
  browser bundle can't be used to browse other people's jobs.
