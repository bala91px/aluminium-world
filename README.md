# Aluminium World

Two separate deliverables for Aluminium World (Bypass Road, Kalpetta, Wayanad),
owner Arif. They share this repository and one GitHub Pages deploy, but they are
independent projects — different stacks, different purposes, no shared code.

> **Confidential.** Shared for client review only. Not for redistribution.
> Prototype/demo builds — not production, not for real customer data.

---

## 1 · Job-flow web app *(demo)*

**Live:** https://bala91px.github.io/aluminium-world/

The working prototype. A supervisor visits a site and measures, the app
auto-generates a quote, Arif approves it, it goes to the customer, the advance is
paid, and the job runs through the workshop on a live tracker until delivery.

- Stack: Next.js (App Router, TypeScript, static export), Tailwind v4, Supabase
- Setup, Supabase schema and deploy notes: [README-DEMO.md](README-DEMO.md)
- Full build spec: [AW_MVP_BUILD_SPEC.md](AW_MVP_BUILD_SPEC.md)
- Source: [`src/`](src/), [`supabase/`](supabase/)

## 2 · Landing site *(reference design)*

**Live:** https://bala91px.github.io/aluminium-world/landing/

A design reference for Aluminium World's public website. Built to a structure and
visual language Bala selected from [martifer.pt](https://www.martifer.pt/en) —
full-viewport colour chapters, mixed-weight display type, hairline arrows, and
isometric CAD line-art on flat colour.

- Stack: plain HTML/CSS/JS. No framework, no build step, no dependencies
- Source: [`landing/`](landing/)
- Local preview:
  ```bash
  python3 -m http.server 8123 --directory landing
  ```
- The three line-art illustrations are generated, not hand-drawn — they share one
  isometric camera so the set reads as a system:
  ```bash
  node landing/tools/gen-illustrations.mjs
  ```

**Status: first pass — hero and "What we do" only.** The remaining five sections
(Differentiation, How it works, Work, CTA, Footer) are planned but not built, and
the nav links to them are deliberately inert. Photography and the Aluminium World
logo are still outstanding, so no real imagery is used yet.

---

## Deploy

Push to `main`. GitHub Actions builds the app, copies `landing/` in alongside it,
and publishes both in a single Pages deploy — see
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Requires repo
secrets `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Credits

Typeface: [Satoshi](https://www.fontshare.com/fonts/satoshi) by Indian Type
Foundry, self-hosted under the Fontshare free licence.

91Pixels · hello@91pixels.com
