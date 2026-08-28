/**
 * Regenerates the API's demo dataset from this console's mock tables.
 *
 *   bun run scripts/dump-fixtures.ts ../mabisoft/src/app/seed/fixtures.json
 *
 * The mock database is generated from a seeded pseudo-random generator with a
 * fixed `NOW`, so this produces byte-identical output on every machine and every
 * run. That determinism is the point: the API seeds the exact rows this console
 * was built and screenshotted against, so the two can be compared directly
 * rather than approximately.
 *
 * Re-run this after changing anything under `src/lib/api/mock/`, and commit the
 * regenerated file alongside the change.
 */
import { writeFileSync } from "node:fs";

import {
  connectedAccounts,
  ingestionRuns,
  messages,
  orgNodes,
  people,
  personNotes,
} from "../src/lib/api/mock";

const DEFAULT_OUT = "../mabisoft/src/app/seed/fixtures.json";

const fixtures = {
  generated_from: "console mock database (seeded RNG 20260826, fixed NOW 2026-08-26T18:00:00Z)",
  people,
  connected_accounts: connectedAccounts,
  messages,
  person_notes: personNotes,
  org_nodes: orgNodes,
  ingestion_runs: ingestionRuns,
};

const out = process.argv[2] ?? DEFAULT_OUT;
writeFileSync(out, `${JSON.stringify(fixtures, null, 2)}\n`);

const counts = Object.entries(fixtures)
  .filter(([, value]) => Array.isArray(value))
  .map(([key, value]) => `  ${key.padEnd(20)} ${(value as unknown[]).length}`)
  .join("\n");

console.log(`Wrote ${out}\n${counts}`);
