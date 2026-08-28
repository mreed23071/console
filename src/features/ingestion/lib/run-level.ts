import type { StatusLevel } from "@/components/common/status-badge";
import type { IngestionRun } from "@/lib/api/types";

/**
 * Maps a run's outcome onto the shared status scale. Lives here rather than in
 * a route so the dashboard and the runs page cannot drift apart.
 */
export function runLevel(status: IngestionRun["status"], filterErrors = 0): StatusLevel {
  if (status === "failed") return "critical";
  if (status === "partial") return "serious";
  if (filterErrors > 0) return "warning";
  return "good";
}

/** Ordered pipeline stages, as translation keys into the `ingestion` namespace. */
export const RUN_STEP_KEYS = [
  "step.fetching",
  "step.deduplicating",
  "step.filtering",
  "step.embedding",
  "step.persisting",
  "step.done",
] as const;

export const RUN_STEP_COUNT = RUN_STEP_KEYS.length;
