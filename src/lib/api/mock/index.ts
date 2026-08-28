/**
 * In-memory mock database.
 *
 * Import order matters: each module draws from the shared seeded RNG in
 * `random.ts`, and the import graph (people -> accounts -> messages ->
 * ingestion/connectors) is what keeps the generated dataset deterministic.
 *
 * When the real FastAPI backend is wired up, nothing outside
 * `lib/api/endpoints/` should need to change — these tables are only ever read
 * and written by the endpoint functions.
 */
import { connectedAccounts, seedConnectedAccounts } from "./accounts.mock";
import { connectors, seedConnectors } from "./connectors.mock";
import { ingestionRuns, seedIngestionRuns } from "./ingestion.mock";
import { messages, seedMessages } from "./messages.mock";
import { personNotes, seedPersonNotes } from "./notes.mock";
import { orgNodes, seedOrgNodes } from "./org.mock";
import { people, seedPeople } from "./people.mock";
import { resetRandom } from "./random";

export { connectedAccounts } from "./accounts.mock";
export { connectors } from "./connectors.mock";
export { ingestionConfig, ingestionRuns } from "./ingestion.mock";
export { messages } from "./messages.mock";
export { personNotes } from "./notes.mock";
export { orgNodes } from "./org.mock";
export { people } from "./people.mock";

/** Cache of generated summaries, keyed by `${personId}|${from}|${to}`. */
export const summaryCache = new Map<string, string>();

/** Replaces an array's contents while keeping its identity. */
function refill<T>(table: T[], next: T[]): void {
  table.splice(0, table.length, ...next);
}

/**
 * Restores every table to its startup state.
 *
 * The endpoint functions mutate these tables in place, so without this each
 * test would inherit whatever the previous one left behind and the suite would
 * depend on its own execution order. Tables are refilled rather than
 * reassigned so the module-level bindings every endpoint holds stay valid.
 *
 * The RNG is rewound first, which is what makes the regenerated rows identical
 * to the originals rather than merely similar.
 */
export function resetMockDatabase(): void {
  resetRandom();

  // Rebuilt in dependency order — messages are derived from people and
  // accounts, connectors from messages and accounts.
  refill(people, seedPeople());
  refill(connectedAccounts, seedConnectedAccounts(people));
  refill(messages, seedMessages(people, connectedAccounts));
  refill(personNotes, seedPersonNotes());
  refill(orgNodes, seedOrgNodes(people));
  refill(ingestionRuns, seedIngestionRuns());
  refill(connectors, seedConnectors());

  summaryCache.clear();
}
