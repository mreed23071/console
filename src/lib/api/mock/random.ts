/**
 * Deterministic pseudo-random generator shared by every mock dataset.
 *
 * The seed is module-level and mutates as values are drawn, so the dataset is
 * stable across reloads and SSR passes. Modules must therefore be imported in
 * dependency order (people -> accounts -> messages -> ...), which the import
 * graph already enforces.
 */
const INITIAL_SEED = 20260826;
let seed = INITIAL_SEED;

/**
 * Rewinds the generator. Called by `resetMockDatabase()` so a reseeded table
 * is byte-for-byte the same as it was at startup — without this, tests would
 * see different data on every reset and could not assert on specific rows.
 */
export function resetRandom(): void {
  seed = INITIAL_SEED;
}

export function rnd(): number {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)]!;
}

export function int(min: number, max: number): number {
  return Math.floor(rnd() * (max - min + 1)) + min;
}

/** Fixed "now" so relative timestamps in the mock data never drift. */
export const NOW = new Date("2026-08-26T18:00:00Z").getTime();
export const DAY = 86_400_000;
export const HOUR = 3_600_000;

export const iso = (ms: number): string => new Date(ms).toISOString();

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z]+/g, ".");
}

export const PLATFORMS = ["slack", "github", "teams", "email", "linear"] as const;
