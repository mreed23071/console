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

/**
 * Ordered pipeline stages, as translation keys into the `ingestion` namespace.
 *
 * The identifiers match the `stage` the workflow reports, so progress shown in
 * the console is the stage actually executing rather than a timer. Keep this
 * list in step with `IngestionWorkflow` in the API.
 */
export const RUN_STAGES = [
  "queued",
  "fetching",
  "filtering",
  "embedding",
  "persisting",
  "done",
] as const;

export type RunStage = (typeof RUN_STAGES)[number];

export const RUN_STEP_KEYS = RUN_STAGES.map((stage) => `step.${stage}`);
export const RUN_STEP_COUNT = RUN_STAGES.length;

/** Where a reported stage sits in the sequence; -1 when it is unrecognised. */
export function stageIndex(stage: string): number {
  return RUN_STAGES.indexOf(stage as RunStage);
}
