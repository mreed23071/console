# Threadline Console — front end

React front end for the Threadline FastAPI backend. Resolves scattered platform
identities (Slack, GitHub, Teams, Email, Linear) into single person records and
summarises what each person has been working on.

**Stack:** TanStack Router (file-based routing, client-rendered) · React 19 ·
TypeScript · Tailwind v4 · shadcn/ui · TanStack Query · TanStack Table ·
Zustand · react-i18next

---

## Getting started

```sh
bun install
bun run dev          # http://localhost:8080
```

Or bring up the whole stack (database + API + front end) in Docker — the
compose file and its README live in the sibling `bootstrap` repo now, not
here:

```sh
cd ../bootstrap && docker compose up --build
```

|           |                                         |
| --------- | --------------------------------------- |
| Front end | http://localhost:8080                   |
| API       | http://localhost:8000 (docs at `/docs`) |
| Postgres  | `localhost:5432`                        |

### Scripts

| Command              | Does                                     |
| -------------------- | ---------------------------------------- |
| `bun run dev`        | Vite dev server                          |
| `bun run build`      | Production build                         |
| `bun run typecheck`  | `tsc --noEmit`                           |
| `bun run lint`       | ESLint (includes Prettier as a rule)     |
| `bun run lint:fix`   | ESLint with `--fix` — also sorts imports |
| `bun run format`     | Prettier write                           |
| `bun run test`       | Vitest, once                             |
| `bun run test:watch` | Vitest, on change                        |
| `bun run check`      | typecheck + lint + format + test         |

CI runs the four checks in `bun run check`, so passing locally and passing CI
mean the same thing. Testing conventions are in [TESTING.md](./TESTING.md).

---

## Architecture

Dependencies flow one way. ESLint enforces every arrow below
(`no-restricted-imports`), so a violation fails the lint step rather than
waiting for a reviewer to spot it.

```
routes/  ──►  features/  ──►  components/{layout,common}  ──►  components/ui
                  │
                  └────────►  lib/api/endpoints  ──►  lib/api/mock
```

```
src/
  routes/            Thin. Metadata + data hooks + composition. No business logic.
  features/          One folder per domain, each with a public index.ts barrel.
    <domain>/
      api/           React Query hooks (queries + mutations) for this domain
      components/    Components only this domain uses
      lib/           Domain helpers
      index.ts       Public surface — the only entry point other code may use
  components/
    ui/              shadcn primitives. Generic; may not import features.
    layout/          App shell, sidebar, header, command palette, page header
    common/          Cross-domain building blocks (DataTable, states, badges)
  lib/
    api/
      types.ts       Shapes mirroring the FastAPI schemas
      endpoints/     One module per FastAPI router — the swap point (see below)
      mock/          In-memory tables, one per entity, deterministic seed
    i18n/            Config, catalogs, typed key bindings
    query-keys.ts    Central React Query key factory
  stores/            Zustand stores for UI state
  hooks/             Cross-cutting hooks
```

### The rules, and why

- **Features talk to each other through barrels only.** `@/features/people` is
  fine; `@/features/people/components/person-header` is not. This keeps a
  feature movable and deletable on its own.
- **Routes and components never call the API layer.** They use the feature's
  React Query hooks, so caching and invalidation stay in one place.
- **Only `lib/api` touches `lib/api/mock`.** This is what makes the mock
  swappable for the real backend.
- **`components/ui` never imports a feature.** Primitives stay generic.

---

## Mock data, or the real backend

Both exist, with identical signatures, and `src/lib/api/endpoints/index.ts` is
the single place that chooses:

```ts
const api: typeof httpApi = USE_MOCKS ? mockApi : httpApi;
```

- **mocks** — the in-browser database under `src/lib/api/mock/`, still the
  default so the console runs with no backend at all.
- **the API** — `src/lib/api/endpoints/http/`, one thin function per route.

Nothing under `features/`, `components/` or `routes/` imports either one
directly, so switching costs no changes outside that file.

The `typeof httpApi` annotation is load-bearing: it makes the compiler check
that every mock still matches the shape of its HTTP counterpart. A route whose
response changes without the mock following is a build failure here rather than
a surprise the first time somebody flips the flag.

### Running against the API

```bash
# the whole stack, seeded, answering from Postgres
docker compose up --build

# or point a local dev server at a running API
VITE_USE_MOCKS=false bun run dev
```

| Variable            | Default   | What it does                                        |
| ------------------- | --------- | --------------------------------------------------- |
| `VITE_USE_MOCKS`    | `true`    | `false` calls the API instead of the mock database  |
| `VITE_API_BASE_URL` | `/api/v1` | Where the API is, from the **browser**              |
| `VITE_API_KEY`      | unset     | Needed only by the two ingestion routes (see below) |

Under Docker the compose file sets all three, so `docker compose up --build`
gives you a seeded database and a console reading from it with no configuration.

### What still needs a credential

Most of the API is deliberately unauthenticated while the two platforms are
wired together — declared in `PROVISIONALLY_OPEN` in the backend's auth matrix
test, and enforced from one function in `app/core/security/provisional.py`.

The two ingestion routes are the exception. They were scope-protected before
this work started and opening them to make a button work would have been the
wrong trade, so `VITE_API_KEY` presents a key holding `ingest:run` and
`ingest:read`. Leave it unset and those two calls answer 401; everything else
works.

### The generated client

`src/lib/api/http.ts` and the adapters under `endpoints/http/` are hand-written
**because the generated client does not exist yet** — generating it needs a
schema, and exporting a schema needs a running backend:

```bash
cd ../mabisoft && make openapi   # app  -> openapi/v1.json
bun run openapi:generate         # that -> src/lib/api/generated/
```

Both steps together are `bun run openapi:sync`. Once the client exists, the
transport and the adapters become imports of it, and `types.ts` is replaced by
generated types — at which point the two repositories can no longer disagree
about a response shape without CI noticing.

Until then, `bun run openapi:check` compares every path the client calls
against the exported schema, which is the part of that guarantee that can be
had cheaply now.

---

## Localization

All user-facing text lives in `src/lib/i18n/locales/en/`, one JSON file per
namespace (mirroring the feature folders). There are no hardcoded strings in
the app — ESLint warns on text typed directly into JSX.

```tsx
const { t } = useTranslation("people");
<h1>{t("list.title")}</h1>
<p>{t("unresolved.messageCount", { platform, count })}</p>
```

Keys are **typed against the English catalog** (`src/lib/i18n/i18next.d.ts`), so
a misspelled key is a compile error, not a string that silently renders as
`people.titel` in production.

Catalogs are bundled, not fetched, so the instance initialises synchronously -
no flash of untranslated content while a catalog loads.

### Adding a language

1. Add the code to `SUPPORTED_LANGUAGES` and `LANGUAGE_LABELS` in
   `src/lib/i18n/config.ts`.
2. Copy `locales/en/` to `locales/<code>/` and translate the values.
3. Register it in `src/lib/i18n/resources.ts`.

The picker in **Settings → Language** and the persisted preference in the UI
store both pick it up automatically. Plural forms use i18next's `_one` / `_other`
suffixes; interpolation uses `{{name}}`.

---

## Docker

The compose file that brings up the whole stack (Postgres, the FastAPI
backend, and this front end with hot reload) lives in a separate `bootstrap`
repo now, not here — see its README for startup order, the database
self-repair step, networking, and the rest of what used to be documented in
this section. In short:

```sh
cd ../bootstrap && docker compose up --build
```

This repo's own `Dockerfile.dev` just runs the Vite dev server for that
compose file to build — it isn't meant to be built standalone. Hot reload
inside Docker uses polling (`VITE_USE_POLLING`), because bind-mounted files
on macOS and Windows don't emit filesystem events reliably; running
`bun run dev` on the host leaves that off and keeps native watching.

### The front end still uses mock data

The stack is wired together and can talk to itself end-to-end, but the
functions in `src/lib/api/endpoints/` still return mock rows by default, so
nothing calls the API unless you ask. That is deliberate — see
[Swapping the mock API for the real backend](#swapping-the-mock-api-for-the-real-backend).
`VITE_API_BASE_URL` is already pointed at the live API, so converting an
endpoint (or flipping `VITE_USE_MOCKS=false`) is a one-line change with no
configuration to chase.

---

## Conventions

- **New screen** → add a route file that composes feature components; put the
  logic in `src/features/<domain>/`.
- **New data** → add the endpoint to `lib/api/endpoints/`, a key to
  `lib/query-keys.ts`, and a hook in `features/<domain>/api/`.
- **New text** → add a token to the namespace catalog; never inline a string.
- **New shared component** → `components/common/` if any domain could use it,
  otherwise `features/<domain>/components/`.
