# lore.layonara.com

Player tools and references for Layonara — characters, items, recipes,
areas, and more. Lives at <https://lore.layonara.com>.

Architecture and roadmap: see `~/dev/.cursor/plans/lore_layonara_com.plan.md`.

## Stack

- Next.js 16 (App Router) · TypeScript · React 19
- Tailwind CSS v4
- Sharp for portrait/icon image pipeline
- AG Charts Community for charts
- TanStack Query for client-side data
- Zod for ops-api response parsing

All data is read from `layonara-ops-api`. No DB or auth in this app.

## Local dev

```bash
npm install
npm run dev
```

The app expects `OPS_API_URL` and `OPS_API_KEY` in `.env.local` to talk
to ops-api (defaults to `http://10.99.0.1:8100` if unset, which only works
inside the WireGuard mesh).

## Deploy

Coolify on `leanthar` builds the `Dockerfile` on push to `main` and serves
the resulting container behind Traefik with a Let's Encrypt cert.

## Phase 1 stance

Every page is `noindex` (set three ways: `next.config.ts` headers,
`app/robots.ts`, and metadata in the root layout). Lift this once we've
decided what's safe to expose.
