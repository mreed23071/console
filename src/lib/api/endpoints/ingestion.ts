import { ingestionConfig, ingestionRuns } from "../mock";
import type { IngestionConfig, IngestionRun, Platform } from "../types";
import { delay } from "./_shared";

export interface TriggerRunOptions {
  dry_run?: boolean;
}

/** GET /api/v1/ingestion/runs */
export async function getIngestionRuns(platform?: Platform): Promise<IngestionRun[]> {
  await delay();
  return platform ? ingestionRuns.filter((r) => r.platform === platform) : [...ingestionRuns];
}

/** POST /api/v1/ingestion/runs/{platform} */
export async function triggerIngestionRun(
  platform: Platform,
  options: TriggerRunOptions = {},
): Promise<IngestionRun> {
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
  return run;
}

/** GET /api/v1/ingestion/config/{platform} */
export async function getIngestionConfig(platform: Platform): Promise<IngestionConfig> {
  await delay(250);
  return { ...ingestionConfig, platform };
}
