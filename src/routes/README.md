# Routes

TanStack Start uses **file-based routing**. Every `.tsx` file in this directory
defines a route. Do **not** create `src/pages/`, `src/routes/_app/index.tsx`, or
`app/layout.tsx` — those are Next.js / Remix conventions. The only root layout
is `src/routes/__root.tsx`.

## Route map

| File                              | URL             | Renders                                                           |
| --------------------------------- | --------------- | ----------------------------------------------------------------- |
| `__root.tsx`                      | —               | HTML shell, providers (i18n, React Query), 404 + error boundaries |
| `login.tsx`                       | `/login`        | `features/auth`                                                   |
| `_authenticated.tsx`              | —               | Auth guard + `components/layout/AppShell`                         |
| `_authenticated.index.tsx`        | `/`             | `features/dashboard`                                              |
| `_authenticated.people.tsx`       | —               | Pathless wrapper for the people segment                           |
| `_authenticated.people.index.tsx` | `/people`       | `features/people` (list)                                          |
| `_authenticated.people.$id.tsx`   | `/people/:id`   | `features/people` (detail)                                        |
| `_authenticated.messages.tsx`     | `/messages`     | `features/messages`                                               |
| `_authenticated.runs.tsx`         | `/runs`         | `features/ingestion`                                              |
| `_authenticated.integrations.tsx` | `/integrations` | `features/integrations`                                           |
| `_authenticated.status.tsx`       | `/status`       | `features/system`                                                 |
| `_authenticated.settings.tsx`     | `/settings`     | `features/auth` + UI store                                        |

## Conventions

Route files stay **thin**: a `head()` block for metadata, data hooks from
`features/*/api`, and composition of feature components. Business logic,
table columns and dialogs belong in `src/features/<domain>/`, not here.

Page titles and descriptions come from the i18n catalog. Because `head()` runs
outside React, it calls the `i18n` singleton directly rather than `useTranslation`.

| Filename pattern         | URL                                                     |
| ------------------------ | ------------------------------------------------------- |
| `index.tsx`              | `/`                                                     |
| `about.tsx`              | `/about`                                                |
| `users/index.tsx`        | `/users`                                                |
| `users/$id.tsx`          | `/users/:id` (dynamic — bare `$`, no curly braces)      |
| `posts/{-$category}.tsx` | `/posts/:category?` (optional segment)                  |
| `files/$.tsx`            | `/files/*` (splat — read via `_splat` param, never `*`) |
| `_layout.tsx`            | layout route (renders children via `<Outlet />`)        |
| `__root.tsx`             | app shell — wraps every page; preserve `<Outlet />`     |

`routeTree.gen.ts` is auto-generated. Don't edit it by hand.
