import { describe, expect, it } from "vitest";

import { setupCleanDatabase } from "@/test/setup-endpoints";

import { getConnectors } from "./connectors";
import {
  getIngestionConfig,
  getIngestionRuns,
  getRunStatus,
  triggerIngestionRun,
} from "./ingestion";
import { getHealth, getReadiness } from "./system";

setupCleanDatabase();

describe("system probes", () => {
  it("reports health", async () => {
    expect(await getHealth()).toMatchObject({ status: "ok" });
  });

  it("reports readiness with per-dependency flags", async () => {
    const readiness = await getReadiness();
    expect(typeof readiness.database).toBe("boolean");
    expect(typeof readiness.embeddings).toBe("boolean");
  });
});

describe("getConnectors", () => {
  it("returns one connector per platform", async () => {
    const connectors = await getConnectors();
    expect(connectors.map((c) => c.platform)).toEqual([
      "slack",
      "github",
      "teams",
      "email",
      "linear",
    ]);
  });

  it("gives a disconnected connector no last sync", async () => {
    for (const connector of await getConnectors()) {
      if (connector.status === "disconnected") expect(connector.last_sync_at).toBe(null);
      else expect(connector.last_sync_at).toBeTruthy();
    }
  });
});

describe("ingestion runs", () => {
  it("returns the run history", async () => {
    expect((await getIngestionRuns()).length).toBeGreaterThan(0);
  });

  it("returns a copy, so callers cannot mutate the history", async () => {
    (await getIngestionRuns()).push({} as never);
    expect(await getIngestionRuns()).toHaveLength((await getIngestionRuns()).length);
  });

  it("prepends a new run when triggered", async () => {
    const before = (await getIngestionRuns()).length;
    const queued = await triggerIngestionRun("slack");

    const after = await getIngestionRuns();
    expect(after).toHaveLength(before + 1);
    expect(after[0]!.run_id).toBe(queued.run_id);
  });

  it("returns a queued envelope rather than a finished run", async () => {
    // The real API answers 202 with an id to poll; the mock mirrors that shape
    // so nothing in features/ has to know which one it is talking to.
    const queued = await triggerIngestionRun("slack");
    expect(queued.run_id).toBeTruthy();
    expect(queued.workflow_id).toBeTruthy();
    expect(queued.platform).toBe("slack");
  });

  it("marks a triggered run successful with consistent counters", async () => {
    const queued = await triggerIngestionRun("slack");
    const run = (await getRunStatus("slack", queued.run_id)).result!;

    expect(run.status).toBe("success");
    expect(run.evaluated).toBe(run.fetched - run.already_ingested);
    expect(run.discarded).toBe(run.evaluated - run.retained);
    expect(run.filter_errors).toBe(0);
  });

  it("persists nothing on a dry run", async () => {
    const queued = await triggerIngestionRun("slack", { dry_run: true });
    expect(queued.dry_run).toBe(true);

    const run = (await getRunStatus("slack", queued.run_id)).result!;
    expect(run.persisted).toBe(0);
    // Embedding still happens; only the write is skipped.
    expect(run.embedded).toBe(run.retained);
  });

  it("reports a terminal status so a poller knows to stop", async () => {
    const queued = await triggerIngestionRun("slack");
    const progress = await getRunStatus("slack", queued.run_id);
    expect(progress.status).toBe("completed");
    expect(progress.stage).toBe("done");
  });

  it("reports an unknown run as failed rather than hanging a poller", async () => {
    const progress = await getRunStatus("slack", "does-not-exist");
    expect(progress.status).toBe("failed");
    expect(progress.result).toBeNull();
  });

  it("returns the pipeline config", async () => {
    const config = await getIngestionConfig("slack");
    expect(config.embedding_dim).toBeGreaterThan(0);
    expect(config.filter_system_prompt.length).toBeGreaterThan(0);
  });

  it("tags a triggered run with the platform it ran", async () => {
    const run = await triggerIngestionRun("github");
    expect(run.platform).toBe("github");
  });

  it("filters run history by platform", async () => {
    await triggerIngestionRun("teams");
    const runs = await getIngestionRuns("teams");
    expect(runs.length).toBeGreaterThan(0);
    expect(runs.every((r) => r.platform === "teams")).toBe(true);
  });
});
