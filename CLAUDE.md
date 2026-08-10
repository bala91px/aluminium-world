# Aluminium World — MVP Demo Build

## 1. What this is
Job-flow prototype for Aluminium World (Kalpetta, Wayanad), owner Arif. A supervisor
visits a site, measures, and the app auto-generates a quote → Arif approves → sent to
customer → advance paid → job runs through the workshop on a live tracker → delivered.
Prototype/demo build. Not production. Not for real customer data. Full spec:
[AW_MVP_BUILD_SPEC.md](AW_MVP_BUILD_SPEC.md).

## 2. Live URLs
- **Demo:** `https://bala91px.github.io/aluminium-world/` *(pending first deploy — confirm after Actions run)*
- **Supabase project:** *(pending — Bala to create, see README-DEMO.md)*

## 3. Stack
- Next.js (App Router, TypeScript), static export (`output: 'export'`)
- Tailwind CSS v4, greyscale-leaning tokens (no brand color until logo arrives)
- Supabase (Postgres + Anonymous Auth + RLS) — all calls client-side, no server
- GitHub Pages, auto-deploys via `.github/workflows/deploy.yml` on push to `main`
- `wa.me` deep links for WhatsApp — no Business API in the MVP

## 4. Source code location
- Local: `/Users/balak/Aluminium world/`
- Repo: `github.com/bala91px/aluminium-world` (branch `main`) — matches the
  `bala91px.github.io` convention used for Nakshtra and Beat's client protos

## 5. Deploy command
Push to `main`. GitHub Actions builds and publishes automatically — no manual step,
same auto-deploy pattern as BrandVault (the exception to the CF Pages manual-deploy
lesson). Requires repo secrets `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → Secrets and variables → Actions).

## 6. Local preview
```bash
npm install
cp .env.local.example .env.local   # fill in Supabase URL + anon key
npm run dev
```

## 7. Backend / Supabase
- Schema: `supabase/schema.sql` — run once in the Supabase SQL editor
- Seed data: `supabase/seed.sql` — fictional Wayanad customers, run after schema
- Auth: Anonymous sign-ins (Authentication → Providers → Anonymous → on). No
  passwords — see the auth-model comment at the top of `schema.sql` for why, and
  its known limitation (anyone can self-select "owner" in demo mode).
- Public pages (`/q`, `/track`, `/delivery`) never query tables directly — only
  through `get_public_*` / `mark_delivered` / `accept_public_quote` functions, so
  the anon key in the browser bundle can't browse other customers' jobs.

## 8. ClickUp
Not yet logged — this is a pre-sale demo build, log to ClickUp once Arif confirms
the engagement and a real project is opened.

## 9. Brand
Kept deliberately plain for the demo (greyscale tokens in `globals.css`) — Bala to
supply Aluminium World's logo + colors before any client-facing polish pass.

## 10. Boss
Bala Kumaran, hello@91pixels.com. Punchy, no fluff. Blueprint before build.

## 11. Claude's rules for this project
- Static export only — no `[token]` dynamic segments; public routes read a
  `?token=` query param client-side (GitHub Pages has no server for SSR/ISR)
- Every user-facing string goes through `src/lib/strings.ts` — no hardcoded
  English in JSX, so a Malayalam pass later is a swap, not a rewrite
- Currency `₹`, `en-IN` formatting, dates `DD-MM-YYYY`, IST
- No real customer PII — seed data only until Arif signs off on a real build
- Don't invent rate-card numbers and present them as real — leave placeholders,
  fill in with Arif live (per spec §11)

## 12. Pending / Bala's action items
- [ ] Create Supabase project, enable Anonymous auth, run `schema.sql` + `seed.sql`
- [ ] Add `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` as GitHub secrets
- [ ] Confirm `bala91px/aluminium-world` is the right repo/account (vs `balaak`)
- [ ] Send Aluminium World logo + a photo of an existing paper quotation
- [ ] Enable GitHub Pages (Settings → Pages → Source: GitHub Actions)

## 13. Roadmap
See `AW_MVP_BUILD_SPEC.md` §8 (build order) and §12 (open questions to resolve
with Arif — spec sheet/catalog step, installation ownership, minimum billable
area, payment structure, supervisor count, powder coating in-house vs outsourced).
