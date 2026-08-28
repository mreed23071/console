/**
 * Checks that every path the hand-written HTTP layer calls is a path the API
 * actually serves.
 *
 *   bun run openapi:check      # after `cd ../mabisoft && make openapi`
 *
 * This guards something that is currently unguarded and will not stay that way.
 * `src/lib/api/endpoints/http/index.ts` names paths as string literals because
 * the generated client does not exist yet; the moment it does, those literals
 * disappear into the SDK, the paths come from the schema by construction, and
 * this script has nothing left to check. Delete it then.
 *
 * Exits 0 and says so if the schema has not been exported yet, so it can sit in
 * CI before the generation step is wired up.
 */
import { existsSync, readFileSync } from "node:fs";

const SCHEMA = process.env.OPENAPI_SCHEMA ?? "../mabisoft/openapi/v1.json";
const CLIENT = "src/lib/api/endpoints/http/index.ts";

if (!existsSync(SCHEMA)) {
  console.log(`No schema at ${SCHEMA} yet — run \`cd ../mabisoft && make openapi\` first.`);
  process.exit(0);
}

/** `/users/{user_id}` and `/users/${id}` both become `/users/{}`. */
const normalise = (path) => path.replace(/\{[^}]*\}/g, "{}").replace(/\$\{[^}]*\}/g, "{}");

const schema = JSON.parse(readFileSync(SCHEMA, "utf8"));
const served = new Set(
  Object.entries(schema.paths ?? {}).flatMap(([path, verbs]) =>
    Object.keys(verbs).map((verb) => `${verb.toUpperCase()} ${normalise(path)}`),
  ),
);

const source = readFileSync(CLIENT, "utf8");
const VERBS = { get: "GET", post: "POST", patch: "PATCH", del: "DELETE", getRoot: "GET" };
const called = new Set();
for (const [fn, verb] of Object.entries(VERBS)) {
  const pattern = new RegExp(`\\b${fn}<[^>]*>\\(\\s*[\`"']([^\`"']+)[\`"']`, "g");
  for (const [, raw] of source.matchAll(pattern)) {
    const prefix = fn === "getRoot" ? "" : "/api/v1";
    called.add(`${verb} ${prefix}${normalise(raw)}`);
  }
}

const missing = [...called].filter((call) => !served.has(call)).sort();
if (missing.length > 0) {
  console.error(`These calls have no matching route in the API schema:\n  ${missing.join("\n  ")}`);
  process.exit(1);
}

console.log(`All ${called.size} client calls match a route in ${SCHEMA}.`);
