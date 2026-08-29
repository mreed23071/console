import { ingestionConfig, ingestionRuns } from "../mock";
import type {
  ActiveRuns,
  IngestionConfig,
  IngestionRun,
  Platform,
  QueuedRun,
  RunProgress,
} from "../types";
import { delay } from "./_shared";

export interface TriggerRunOptions {
  dry_run?: boolean;
}

/** GET /api/v1/ingestion/runs */
export async function getIngestionRuns(platform?: Platform): Promise<IngestionRun[]> {
  await delay();
  return platform ? ingestionRuns.filter((r) => r.platform === platform) : [...ingestionRuns];
}

/**
 * POST /api/v1/ingestion/runs/{platform}
 *
 * The real API queues the run and answers 202. The mock completes it
 * immediately and reports it as already finished, which keeps the polling
 * caller working without a fake clock: the first `getRunStatus` sees a
 * terminal status and stops.
 */
export async function triggerIngestionRun(
  platform: Platform,
  options: TriggerRunOptions = {},
): Promise<QueuedRun> {
  await delay(600);
  const previous = ingestionRuns[0]!;
  const started = Date.now() - 42_000;
  const fetched = 180 + Math.floor(Math.random() * 400);
  const already = Math.floor(fetched * 0.3);
  const evaluated = fetched - already;
  const retained = Math.floor(evaluated * 0.72);
  const run: IngestionRun = {
    ...previous,
    run_id: `run_${Number(previous.run_id.split("_")[1]) + 1}`,
    started_at: new Date(started).toISOString(),
    finished_at: new Date().toISOString(),
    duration_ms: 42_000,
    dry_run: options.dry_run ?? false,
    platform,
    fetched,
    already_ingested: already,
    evaluated,
    retained,
    discarded: evaluated - retained,
    embedded: retained,
    persisted: options.dry_run ? 0 : retained,
    users_provisioned: Math.floor(Math.random() * 3),
    filter_errors: 0,
    status: "success",
  };
  ingestionRuns.unshift(run);
  return {
    run_id: run.run_id,
    platform,
    status: "completed",
    workflow_id: `mock-${run.run_id}`,
    dry_run: run.dry_run,
  };
}

/** GET /api/v1/ingestion/runs/{platform}/{run_id} */
export async function getRunStatus(platform: Platform, runId: string): Promise<RunProgress> {
  await delay(120);
  const run = ingestionRuns.find((r) => r.run_id === runId);
  if (!run) {
    return {
      run_id: runId,
      status: "failed",
      stage: "unknown",
      fetched: 0,
      evaluated: 0,
      filtered: 0,
      embedded: 0,
      persisted: 0,
      result: null,
    };
  }
  return {
    run_id: runId,
    status: "completed",
    stage: "done",
    fetched: run.fetched,
    evaluated: run.evaluated,
    filtered: run.decisions.length,
    embedded: run.embedded,
    persisted: run.persisted,
    result: run,
  };
}

/**
 * GET /api/v1/ingestion/runs/active
 *
 * The mock's `triggerIngestionRun` resolves a run instantly (see its own
 * comment) - there is never anything actually in flight to report, the same
 * honest answer the real API gives when Temporal is disabled.
 */
export async function getActiveRuns(): Promise<ActiveRuns> {
  await delay(80);
  return { count: 0, runs: [] };
}

/** GET /api/v1/ingestion/config/{platform} */
export async function getIngestionConfig(platform: Platform): Promise<IngestionConfig> {
  await delay(250);
  return { ...ingestionConfig, platform };
}
