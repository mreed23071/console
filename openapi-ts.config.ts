/**
 * Generates the console's typed API client from the backend's own schema.
 *
 *   cd ../mabisoft && make openapi     # app -> openapi/v1.json
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

const SCHEMA = process.env.OPENAPI_SCHEMA ?? "../mabisoft/openapi/v1.json";

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
      // Native fetch, so the client adds no runtime dependency of its own and
      // works unchanged in the browser and in TanStack Start's server passes.
      name: "@hey-api/client-fetch",
      bundle: true,
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
