<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Architecture rules

These are enforced by ESLint (`no-restricted-imports`), so breaking one fails
`bun run lint`. Read `README.md` for the full picture.

```
routes/  ──►  features/  ──►  components/{layout,common}  ──►  components/ui
                  │
                  └────────►  lib/api/endpoints  ──►  lib/api/mock
```

1. **Import a feature through its barrel.** `@/features/people` — never
   `@/features/people/components/person-header`. Inside a feature, deep imports
   are fine.
2. **Routes and components never import `lib/api` directly.** Use the feature's
   React Query hooks in `src/features/<domain>/api/`.
3. **Only `lib/api` may import `lib/api/mock`.** That boundary is what lets the
   mock be swapped for the real FastAPI backend without touching the UI.
4. **`components/ui` holds generic shadcn primitives.** It may not import a
   feature.

## Text and translations

There are no hardcoded user-facing strings. Every label, placeholder, toast,
aria-label and page title comes from `src/lib/i18n/locales/en/<namespace>.json`
and is rendered with `t()`.

```tsx
const { t } = useTranslation("people");
<Button aria-label={t("accounts.unlinkTooltip")}>{t("accounts.add")}</Button>;
```

Keys are typed against the English catalog, so a bad key fails `bun run
typecheck`. When adding a screen, add its tokens to the matching namespace —
ESLint warns on text typed straight into JSX.

`head()` blocks run outside React, so they call the `i18n` singleton
(`i18n.t("people:meta.listTitle")`) rather than `useTranslation`.

## Data

All data flows through TanStack Query hooks that call `lib/api/endpoints/`,
which currently read from in-memory mock tables. Query keys come from the
factory in `src/lib/query-keys.ts` — do not write key arrays by hand, or
invalidation will silently miss.

## Tests

Tests are **colocated**: `layout.ts` is tested by `layout.test.ts` beside it,
never in a mirrored `tests/` tree. `src/test/` holds shared setup only and
contains no tests. See `TESTING.md` for the reasoning and the conventions.

Endpoint tests must call `setupCleanDatabase()` — the mock tables are mutable
module state, so without it a suite depends on its own execution order.

Coverage targets logic, not composition: the endpoint layer, `lib/org-tree.ts`,
`features/*/lib/`, the stores, the query-key factory and the i18n catalogs.
Components are not covered yet.

## Before finishing

```sh
bun run check    # typecheck + lint + format + test
```

CI runs exactly those four commands, so passing locally and passing CI mean the
same thing.
