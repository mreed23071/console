import type { IngestionConfig, IngestionRun, RunDecision } from "../types";
import { messages } from "./messages.mock";
import { DAY, HOUR, int, iso, NOW, pick, rnd } from "./random";

function makeDecisions(n: number): RunDecision[] {
  const out: RunDecision[] = [];
  for (let i = 0; i < n; i++) {
    const m = pick(messages);
    const keep = m.filter_category === "business" || rnd() > 0.7;
    out.push({
      id: m.external_message_id,
      keep,
      category: m.filter_category,
      reason: m.filter_reason,
    });
  }
  return out;
}

/** Builds a fresh copy of the table. Decisions are sampled from `messages`. */
export function seedIngestionRuns(): IngestionRun[] {
  return Array.from({ length: 9 }).map((_, i) => {
    const started = NOW - (i + 1) * DAY - int(0, 6) * HOUR;
    const duration = int(18_000, 240_000);
    const fetched = int(180, 640);
    const already = Math.floor(fetched * (0.2 + rnd() * 0.3));
    const evaluated = fetched - already;
    const retained = Math.floor(evaluated * (0.55 + rnd() * 0.3));
    const discarded = evaluated - retained;
    let status: IngestionRun["status"] = "success";
    let filter_errors = 0;
    if (i === 2) {
      status = "partial";
      filter_errors = int(3, 12);
    }
    if (i === 5) {
      status = "failed";
      filter_errors = int(20, 48);
    }
    return {
      run_id: `run_${String(1200 - i)}`,
      started_at: iso(started),
      finished_at: iso(started + duration),
      duration_ms: duration,
      dry_run: i === 7,
      fetched,
      already_ingested: already,
      evaluated,
      retained: status === "failed" ? 0 : retained,
      discarded: status === "failed" ? 0 : discarded,
      embedded: status === "failed" ? 0 : retained,
      persisted: status === "failed" ? 0 : retained,
      users_provisioned: int(0, 4),
      filter_provider: "openai:gpt-4o-mini",
      embedding_model: "text-embedding-3-small",
      filter_errors,
      status,
      decisions: makeDecisions(status === "failed" ? 6 : int(12, 24)),
    };
  });
}

/** Mutable in-memory table of ingestion runs, newest first. */
export const ingestionRuns: IngestionRun[] = seedIngestionRuns();

export const ingestionConfig: IngestionConfig = {
  filter_system_prompt:
    "You classify workplace messages into business, personal, automated, or unclear. Retain business messages verbatim. Discard personal content. Flag automation output. When the message lacks enough context to decide, return unclear with a short reason.",
  llm_provider: "openai:gpt-4o-mini",
  embedding_model: "text-embedding-3-small",
  embedding_dim: 1536,
  embedding_executor: "thread-pool",
  embedding_workers: 4,
};
