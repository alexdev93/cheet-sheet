# Knowledge & Memory Center

A public, fully open-source knowledge base for developers: hierarchical notes, commands, procedures, troubleshooting guides and references — with fast full-text search, a command palette, and a graph of how everything links together.

Everything in this repo runs on free, open-source software end to end: Next.js, PostgreSQL, and self-hosted Docker (or a free-tier host of your choice). There is no paid service anywhere in the default setup.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19.2, TypeScript | Server Components for data-heavy pages, Server Actions for mutations, one deployable app |
| Styling | Tailwind CSS v4 + CSS custom properties | Utility layout, design tokens kept in `src/styles/tokens.css` so the Modernist look (dark ground, Archivo, 2px rules, one red accent) is themeable, not hard-coded |
| Database | PostgreSQL | Relational hierarchy (Domain → Collection → Note), tags, links, versions — plus built-in full-text search, no extra service required |
| ORM | Prisma 7 (`prisma-client` generator + `@prisma/adapter-pg`) | Typed queries; the query engine is WASM/TypeScript now, not a native binary, which keeps the Docker image simple |
| Search | PostgreSQL `tsvector`/`ts_rank` (see `src/lib/search.ts`) | Zero extra infrastructure for MVP; architecture leaves room for `pgvector`/Meilisearch later without changing the API shape |
| Auth | Custom, single-admin (`jose` JWT session cookie + `bcryptjs`) | Reading and search are public; writing requires the one admin account — see [Auth model](#auth-model) |
| Command palette | `cmdk` | ⌘K / Ctrl+K, `>` for commands, `@` to jump to a note |
| Graph | `d3-force` (client-side layout) + inline SVG | No charting library needed, matches the flat design system exactly |

## Features (MVP 1)

- Hierarchical knowledge tree: Domain → Collection → Note (kept to 3 levels on purpose — see the note in `src/server/notes.ts`)
- Twelve content types (`NOTE`, `COMMAND`, `PROCEDURE`, `TROUBLESHOOTING`, `REFERENCE`, `PATH`, …), extensible without a schema rewrite
- Markdown body text, syntax-highlighted code blocks with copy buttons, step-through procedures, shell-variant tabs, warning callouts
- Tags, backlinks/outlinks between notes, a lightweight graph explorer
- Attachments (images, screenshots, diagrams as PNG/JPEG/WebP/GIF, PDFs) — stored on local disk (see `src/lib/storage.ts`), not in Postgres, and served through a validated route so a stray upload can't turn into stored XSS
- Favorites, use-count tracking, draft/published/archived states, edit history (`NoteVersion`)
- Full-text search with type filters, sorting, paginated results, and "why it matched" snippets
- Command palette, fast capture flow (write first, file it later), full note editor
- A small versioned REST API under `/api/v1` alongside the Server Actions the UI actually uses — both call the same service layer in `src/server/notes.ts`, so there's one source of truth for business logic
- Responsive layout down to mobile, light/dark theme (follows system preference, toggle persists to `localStorage`)
- Docker Compose for local dev and self-hosting, GitHub Actions for CI and image publishing

## Getting started (local, without Docker)

Requires Node.js 24+ (Prisma 7 needs 20.19+/22.12+/24.0+; Node 20 itself reached end-of-life in April 2026, so this repo standardizes on 24, the current Active LTS — see `.nvmrc`) and a PostgreSQL 14+ instance.

```bash
npm install                      # also runs `prisma generate` via postinstall
cp .env.example .env             # then edit DATABASE_URL, SESSION_SECRET, ADMIN_*
npm run auth:hash -- "your-password"   # paste the output into ADMIN_PASSWORD_HASH
npm run db:migrate:deploy        # applies prisma/migrations against your database
npm run db:seed                  # optional: loads demo content (Docker/K8s/Postgres/Git/Spring/Linux notes)
npm run dev
```

Visit `http://localhost:3000`. Sign in at `/login` with `ADMIN_EMAIL` / the password you hashed to unlock capture and editing — everything else is public without an account.

## Getting started (Docker / self-hosted)

Secrets (`DATABASE_URL`, `SESSION_SECRET`, `ADMIN_*`, ...) are fetched at container start from the `cheet-sheet` [envvault](https://env-vault-api.alexdev93.workers.dev) project rather than a mounted `.env` — `docker-compose.yml` doesn't run its own Postgres container, so `DATABASE_URL` in that vault project must point at a Postgres instance reachable from inside the container (not `localhost`).

```bash
cp .env.example .env             # only needs ENV_VAULT_TOKEN filled in
docker compose up --build
```

This starts a one-off `migrate` service that runs `prisma migrate deploy` and exits, then the `app` service (the slim `output: "standalone"` Next.js image), which only starts once migrations succeed. Seed demo content afterwards with:

```bash
docker compose run --rm migrate envvault run cheet-sheet -- npx prisma db seed
```

The app is then at `http://localhost:3000`.

### Deploying for free

Everything here is free to run:

- **Self-host**: any VPS with Docker (a $0 free-tier VM, a spare machine, a Raspberry Pi) — `docker compose up -d` and put a reverse proxy (Caddy/Traefik/nginx) in front for HTTPS.
- **Vercel + a free Postgres**: deploy the Next.js app to Vercel's free tier and point `DATABASE_URL` at a free-tier Postgres (Neon, Supabase). Skip the Dockerfile entirely in this path — Vercel builds the app directly.
- **GitHub Container Registry**: `.github/workflows/docker-publish.yml` builds and pushes `ghcr.io/<owner>/<repo>` on every push to `main` — free for public repos — so a self-hosted box can just `docker pull` and restart on new versions.

## Environment variables

See `.env.example` for the full list, with inline examples for every value — it also documents the values needed for envvault (local dev, Docker Compose) and CI. In short: `DATABASE_URL` (Postgres connection string), `SESSION_SECRET` (32+ random bytes, signs the admin session cookie), `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` (the single admin account, hash generated with `npm run auth:hash`), `ATTACHMENTS_DIR` + `MAX_ATTACHMENT_SIZE_MB` (upload storage), and `NEXT_PUBLIC_SITE_URL`.

### A note on package-lock.json

This repo does not currently ship a committed `package-lock.json` (it was built in a network-restricted environment that couldn't reach the npm registry). `npm install`/`Dockerfile`/CI all use `npm install` rather than `npm ci` as a result. Once you have registry access, run `npm install` and commit the resulting lockfile — then switch `Dockerfile` and `.github/workflows/ci.yml` back to `npm ci` (both call it out where relevant) for faster, fully reproducible installs.

## Auth model

This is a **public-read, single-admin-write** app by design (see `Open Knowledge Center — Claude Memory.md`'s "public/open-source knowledge sharing" goal, interpreted as: the *software* is open source and the *knowledge* is publicly browsable — writing stays gated to whoever runs the instance). Concretely:

- Browsing, search, the graph, and the REST API's `GET` routes need no account.
- `/capture`, `/n/:slug/edit`, and any mutating request are gated by `src/proxy.ts` (Next's routing boundary, formerly "middleware") checking a signed session cookie.
- There is exactly one admin account, seeded from `ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH`. Multi-user permissions are an explicit non-goal for MVP 1 — see "Not yet decided" below.

## Project structure

```text
prisma/
  schema.prisma          Domain → Collection → Note data model
  migrations/0_init/      Hand-authored initial migration (incl. the search-vector trigger)
  seed.ts                 Seeds the demo content shown in the original design mock
prisma.config.ts          Prisma 7 CLI/migration config (schema path, seed command, datasource url)
src/
  app/
    (app)/                 Everything behind the app shell (tree sidebar + top bar + palette)
      page.tsx             Dashboard (recent / most used / needs-finishing / domains)
      n/[slug]/             Note reading view + /edit
      capture/               Fast capture flow
      search/                Full-text search
      graph/                 Graph explorer
      d/[domain]/, t/[tag]/  Domain and tag listings
      history/               Recent edits across all notes
    login/                 Public, outside the app shell
    api/v1/                 REST API — thin wrappers around src/server/*
  components/              UI, split by feature (note/, capture/, graph/, palette/, layout/)
  lib/                     Pure/stateless helpers (search, auth, validation, slugs, detection, highlighting)
  server/                  The service layer: Prisma queries + Server Actions, shared by pages and the API
  types/                   View-model types decoupled from Prisma's generated types
  generated/prisma/        Prisma's generated client (gitignored, regenerated by `prisma generate`)
```

## REST API

Versioned under `/api/v1`, JSON in and out:

- `GET /api/v1/notes?q=&type=&sort=&limit=&offset=` — search (full-text, paginated) or, without `q`, most recently updated; `&lite=1` returns `{slug,title,type}` only (used by the command palette)
- `GET /api/v1/notes/:slug`, `PATCH` (auth), `DELETE` (auth)
- `POST /api/v1/notes` (auth) — create
- `GET /api/v1/notes/:slug/attachments`, `POST` (auth, multipart `file` field)
- `DELETE /api/v1/attachments/:id` (auth); `GET /api/v1/attachments/:key` serves the file itself (public, same visibility rule as the note)
- `GET /api/v1/domains`, `GET /api/v1/tags`
- `GET /api/v1/graph?scope=neighbours|domain|all&focus=:slug`
- `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`

## Testing & CI

```bash
npm run lint
npm run typecheck
npm run test
```

`npm run test` runs Vitest against the pure helper modules in `src/lib` (slugs, shape detection, the code tokenizer) — the parts of the system that are cheapest to get wrong and easiest to test in isolation. `.github/workflows/ci.yml` runs lint, typecheck, unit tests, then applies the real migrations and seed script against a Postgres service container and does a full `next build`, so a broken migration or a build-time regression fails CI, not a deploy. `.github/workflows/docker-publish.yml` builds and pushes the production image to GHCR on pushes to `main` and on `v*.*.*` tags.

## Not yet decided

Flagged rather than guessed at, per the original design brief:

- Knowledge maturity states (Captured → Draft → Verified) were explicitly skipped — freshness is carried by the "Updated" stamp and the dashboard's "Needs finishing" queue instead.
- Multi-user permissions beyond single-admin.
- Attachment storage defaults to local disk (`src/lib/storage.ts`) behind a small interface — swapping in an S3-compatible bucket later means changing that one file, not the API or UI.
- Domain/tag listing pages (`/d/:domain`, `/t/:tag`) aren't paginated yet — only the search page is. Fine at personal-knowledge-base scale; worth revisiting if a single domain grows into the hundreds of notes.
- Semantic/vector search, AI features, flashcards/spaced repetition, browser extension, CLI, import/export — intentionally deferred (see the project memory doc); the REST API and modular service layer exist so none of these require a rewrite later.

## License

MIT — see `LICENSE`.
