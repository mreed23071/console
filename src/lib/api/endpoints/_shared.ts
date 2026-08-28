/**
 * Shared plumbing for the mock endpoint layer.
 *
 * Every function under `endpoints/` is named and shaped like the real FastAPI
 * route it stands in for. Swapping to the real backend means replacing each
 * body with a `fetch(`${API_BASE_URL}/...`)` call — signatures and returned
 * shapes stay identical, so nothing in `features/` has to change.
 */
import { API_BASE_URL } from "../http";
import { summaryCache } from "../mock";

export { API_BASE_URL } from "../http";

/**
 * Whether to answer from the in-browser mock database rather than the API.
 *
 * Defaults to the mock, on purpose. The console then runs standalone with no
 * backend, and the endpoint test suite - which asserts against specific mock
 * rows - is unaffected by this work. Set `VITE_USE_MOCKS=false` to talk to the
 * real service; `endpoints/index.ts` is the one place that reads this.
 */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

/** Where requests would go if mocks were off. Logged once, to aid setup. */
export const RESOLVED_API_BASE_URL = API_BASE_URL;

let latencyEnabled = true;

/**
 * Turns the simulated latency below on or off.
 *
 * Tests disable it: a single pass over the endpoint layer would otherwise
 * spend around twelve seconds asleep, which is enough to make the suite too
 * slow to run on every save.
 */
export function setMockLatency(enabled: boolean): void {
  latencyEnabled = enabled;
}

/** Simulates network latency so loading states are exercised in development. */
export const delay = (ms = 320 + Math.random() * 280): Promise<void> =>
  latencyEnabled ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();

/** Drops every cached summary belonging to a person, across all date ranges. */
export function clearSummaryCache(personId: string): void {
  for (const key of Array.from(summaryCache.keys())) {
    if (key === personId || key.startsWith(`${personId}|`)) summaryCache.delete(key);
  }
}
