/**
 * Shared setup for tests that exercise the mock endpoint layer.
 *
 * Call `setupCleanDatabase()` at the top of a suite. It disables the simulated
 * network latency once, and restores every table before each test so cases can
 * create and delete freely without leaking into one another.
 *
 * Deliberately not named `use…`: it registers Vitest lifecycle hooks, not React
 * ones, and the prefix would put it under the rules of hooks.
 */
import { beforeAll, beforeEach } from "vitest";

import { setMockLatency } from "@/lib/api/endpoints";
import { resetMockDatabase } from "@/lib/api/mock";

export function setupCleanDatabase(): void {
  beforeAll(() => setMockLatency(false));
  beforeEach(() => resetMockDatabase());
}
