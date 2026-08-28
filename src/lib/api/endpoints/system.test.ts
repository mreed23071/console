import { describe, expect, it } from "vitest";

import { setupCleanDatabase } from "@/test/setup-endpoints";

import { getConnectors } from "./connectors";
import { getIngestionConfig, getIngestionRuns, triggerIngestionRun } from "./ingestion";
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
    const run = await triggerIngestionRun("slack");

    const after = await getIngestionRuns();
    expect(after).toHaveLength(before + 1);
    expect(after[0]!.run_id).toBe(run.run_id);
  });

  it("marks a triggered run successful with consistent counters", async () => {
    const run = await triggerIngestionRun("slack");
    expect(run.status).toBe("success");
    expect(run.evaluated).toBe(run.fetched - run.already_ingested);
    expect(run.discarded).toBe(run.evaluated - run.retained);
    expect(run.filter_errors).toBe(0);
  });

  it("persists nothing on a dry run", async () => {
    const run = await triggerIngestionRun("slack", { dry_run: true });
    expect(run.dry_run).toBe(true);
    expect(run.persisted).toBe(0);
    // Embedding still happens; only the write is skipped.
    expect(run.embedded).toBe(run.retained);
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
