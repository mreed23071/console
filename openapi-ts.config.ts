/**
 * Generates the console's typed API client from the backend's own schema.
 *
 *   cd ../api && make openapi          # app -> openapi/v1.json
 *   bun run openapi:generate           # that file -> src/lib/api/generated
 *
 * Generation lives here rather than in the backend repository because this is
 * the consumer: the API publishes a schema, and each client generates from it.
 * The backend keeps a committed copy of that schema and a test that fails when
 * it drifts from the running app, which is what makes the file trustworthy to
 * generate from.
 *
 * What this replaces: `src/lib/api/http.ts` and the adapters under
 * `src/lib/api/endpoints/http/`, both written by hand precisely because this
 * step had not been run yet. Once the client exists, those become imports.
 *
 * Not in `tsconfig.json`'s include, deliberately - it is build tooling and
 * depends on packages the application itself never imports.
 */
import { defineConfig } from "@hey-api/openapi-ts";

const SCHEMA = process.env.OPENAPI_SCHEMA ?? "../api/openapi/v1.json";

export default defineConfig({
  input: SCHEMA,
  output: {
    path: "./src/lib/api/generated",
    format: "prettier",
    lint: "eslint",
    clean: true,
  },
  plugins: [
    {
      // Native fetch, so it works unchanged in the browser and in TanStack
      // Start's server passes. `bundle: false` - `@hey-api/client-fetch` is
      // already a real dependency in package.json, so generated code imports
      // it from node_modules rather than vendoring a copy. Vendoring
      // (`bundle: true`) produced a CommonJS-only `client/index.cjs` with no
      // ESM entry point and no package.json/exports map to resolve it from,
      // which failed both `vite build` and Vitest outright once anything
      // actually imported it - importing the real package sidesteps that.
      name: "@hey-api/client-fetch",
      bundle: false,
    },
    {
      name: "@hey-api/typescript",
      enums: "javascript",
      exportInlineEnums: true,
    },
    {
      // Flat functions rather than a class: better tree-shaking, and the
      // backend overrides FastAPI's operation ids to the bare endpoint function
      // name, so these read as `listUsers()` rather than
      // `listUsersApiV1UsersGet()`.
      name: "@hey-api/sdk",
      asClass: false,
      operationId: true,
      throwOnError: true,
    },
    "@hey-api/schemas",
  ],
});
