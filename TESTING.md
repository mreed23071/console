# Testing

```sh
bun run test          # once
bun run test:watch    # on change
bun run check         # typecheck + lint + format + test, same as CI
```

---

## Where tests live: beside the code they test

Tests are **colocated**. `layout.ts` is tested by `layout.test.ts` in the same
folder, not by `tests/features/organization/lib/layout.test.ts`.

```
src/features/organization/lib/
  layout.ts
  layout.test.ts        <- here
```

This was a decision, not a default. The alternative — a `tests/` tree mirroring
`src/` — is common and works, but three things about this codebase point the
other way:

**A feature folder should be deletable in one move.** The whole architecture is
feature-first: `src/features/organization/` owns its components, hooks and
logic behind a barrel. A parallel `tests/` tree breaks that property — deleting
the feature leaves orphaned test files behind, and every rename becomes two
renames in two places that drift apart.

**The lint rules are per-directory.** `eslint.config.js` enforces the
architectural boundaries with path globs (`src/features/<name>/**`,
`src/components/ui/**`). A mirrored test tree would need every one of those
rules duplicated against a second set of paths, or tests would silently escape
the rules the source obeys.

**Coverage becomes visible in the file listing.** Opening
`src/lib/api/endpoints/` and seeing `org.ts` next to `org.test.ts` — and
`connectors.ts` with no neighbour — tells you what is tested without running a
coverage report.

The usual argument for a separate tree is keeping `src/` shippable. That does
not apply: Vite never traverses a `.test.ts` file from an entry point, so
nothing reaches the bundle, and `tsconfig.build` can exclude them if a
consumer ever needs it.

### The one exception

`src/test/` holds **shared test infrastructure** — setup helpers, factories —
and contains no tests of its own. It is a support module that happens to be
imported only by tests.

```
src/test/
  setup-endpoints.ts    useCleanDatabase()
```

### Naming

| Pattern            | Meaning                                     |
| ------------------ | ------------------------------------------- |
| `<module>.test.ts` | Tests for `<module>.ts`, in the same folder |
| `src/test/*`       | Shared helpers — never contains tests       |

One test file per source module, named after it. If a module needs more tests
than fit comfortably in one file, that is a signal the module is doing too
much — split the module, not the test file.

---

## What is tested, and what is not

The suite targets **logic, not composition**. Tests concentrate where a bug
would be silent and expensive:

| Area                                | Covered    | Why                                                                                                                                                |
| ----------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/api/endpoints/`                | ✅         | Every business rule lives here: cycle guards, promote-on-delete, single-department invariant, right-to-be-forgotten cascade, account reattribution |
| `lib/org-tree.ts`                   | ✅         | Cycle detection and the reassignment rule — subtle, and wrong answers corrupt the tree                                                             |
| `features/*/lib/`                   | ✅         | Layout geometry and status mapping — pure arithmetic, easy to get quietly wrong                                                                    |
| `stores/`, `features/auth/store.ts` | ✅         | Scope model and session derivation gate what users can do                                                                                          |
| `lib/query-keys.ts`                 | ✅         | The hierarchy is load-bearing: a key that stops nesting stops being invalidated, and the UI serves stale data                                      |
| `lib/i18n/`                         | ✅         | Structural integrity of the catalogs — a broken token renders the key name to a user and fails nothing                                             |
| Components                          | ⚠️ Not yet | See below                                                                                                                                          |
| Routes                              | ❌         | Thin composition; covered indirectly by the feature tests                                                                                          |

### Components are not covered yet

Component tests need `jsdom` and `@testing-library/react`, which are not yet
dependencies. They are worth adding when the UI stops moving, and the highest
value targets are the ones with real branching rather than markup:

- `AssignMemberDialog` — the confirm-on-reassign rule at the interaction level
- `OrgCanvas` — pan/zoom maths and pointer capture
- `DataTable` — sorting, filtering, pagination

Note the pattern: each of those is a component whose _logic_ is worth
extracting. Where that logic has already been pulled into `lib/`, it is tested
today without a DOM, which is why the suite runs in about four seconds.

---

## Writing endpoint tests

The mock tables are module-level mutable arrays and every endpoint sleeps to
simulate latency. Both would make a test suite unreliable and slow, so both are
controllable:

```ts
import { useCleanDatabase } from "@/test/setup-endpoints";

useCleanDatabase(); // latency off once; tables restored before each test
```

`resetMockDatabase()` rewinds the seeded RNG and refills every table **in
place**, so the module-level bindings the endpoints hold stay valid and the
regenerated rows are identical to the originals — not merely similar. Without
it, a test that deletes a person would change what every later test sees, and
the suite would depend on its own execution order.

Assert against the table contents, not just the return value, when an endpoint
is supposed to have side effects:

```ts
it("removes their messages", async () => {
  const before = messages.filter((m) => m.sender_user_id === "usr_0001").length;
  const result = await forgetUser("usr_0001");

  expect(result.deleted_messages).toBe(before);
  expect(messages.some((m) => m.sender_user_id === "usr_0001")).toBe(false);
});
```

---

## Conventions

- **Name the behaviour, not the function.** `"promotes children to the deleted
node's parent rather than cascading"` beats `"deleteOrgNode works"`. The test
  name is what a failure reports.
- **Comment the non-obvious assertion.** If a test exists because of a specific
  trap — a cycle that would hang the render, a plain date that must be
  inclusive — say so. That comment is why nobody deletes the test later.
- **One reason to fail per test.** A test asserting five things reports the
  first and hides the rest.
- **No snapshots** for logic. A snapshot records what the code does, not what
  it should do, and gets regenerated the moment it fails.
