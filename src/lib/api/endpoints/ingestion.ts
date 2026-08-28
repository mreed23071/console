import { ingestionConfig, ingestionRuns } from "../mock";
import type { IngestionConfig, IngestionRun } from "../types";
import { delay } from "./_shared";

export interface TriggerRunOptions {
  dry_run?: boolean;
}

/** GET /api/v1/ingestion/runs */
export async function getIngestionRuns(): Promise<IngestionRun[]> {
  await delay();
  return [...ingestionRuns];
}

/** POST /api/v1/ingestion/runs */
export async function triggerIngestionRun(options: TriggerRunOptions = {}): Promise<IngestionRun> {
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
  return run;
}

/** GET /api/v1/ingestion/config */
export async function getIngestionConfig(): Promise<IngestionConfig> {
  await delay(250);
  return ingestionConfig;
}
