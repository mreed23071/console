import { describe, expect, it } from "vitest";

import { queryKeys } from "./query-keys";

/**
 * These look trivial, but the hierarchy is load-bearing: mutations invalidate
 * by prefix, so a key that stops starting with its parent silently stops being
 * invalidated and the UI serves stale data.
 */
const startsWith = (key: readonly unknown[], prefix: readonly unknown[]) =>
  prefix.every((part, i) => key[i] === part);

describe("key hierarchy", () => {
  it("nests every user key under users.all", () => {
    const { all } = queryKeys.users;
    expect(startsWith(queryKeys.users.list(), all)).toBe(true);
    expect(startsWith(queryKeys.users.detail("u1"), all)).toBe(true);
    expect(startsWith(queryKeys.users.accounts("u1"), all)).toBe(true);
    expect(startsWith(queryKeys.users.messages("u1"), all)).toBe(true);
    expect(startsWith(queryKeys.users.notes("u1"), all)).toBe(true);
    expect(startsWith(queryKeys.users.summary("u1"), all)).toBe(true);
  });

  it("nests per-person keys under that person's detail key", () => {
    const detail = queryKeys.users.detail("u1");
    expect(startsWith(queryKeys.users.accounts("u1"), detail)).toBe(true);
    expect(startsWith(queryKeys.users.notes("u1"), detail)).toBe(true);
  });

  it("nests org, messages, ingestion, connectors and system keys under their roots", () => {
    expect(startsWith(queryKeys.org.nodes(), queryKeys.org.all)).toBe(true);
    expect(startsWith(queryKeys.messages.list(), queryKeys.messages.all)).toBe(true);
    expect(startsWith(queryKeys.ingestion.runs(), queryKeys.ingestion.all)).toBe(true);
    expect(startsWith(queryKeys.ingestion.config(), queryKeys.ingestion.all)).toBe(true);
    expect(startsWith(queryKeys.connectors.list(), queryKeys.connectors.all)).toBe(true);
    expect(startsWith(queryKeys.system.health(), queryKeys.system.all)).toBe(true);
    expect(startsWith(queryKeys.accounts.unlinked(), queryKeys.accounts.all)).toBe(true);
  });
});

describe("key identity", () => {
  it("distinguishes different people", () => {
    expect(queryKeys.users.detail("u1")).not.toEqual(queryKeys.users.detail("u2"));
  });

  it("distinguishes summary ranges", () => {
    expect(queryKeys.users.summary("u1", { from: "2026-01-01" })).not.toEqual(
      queryKeys.users.summary("u1"),
    );
  });

  it("is stable for the same inputs, so React Query dedupes", () => {
    expect(queryKeys.users.summary("u1", { from: "2026-01-01" })).toEqual(
      queryKeys.users.summary("u1", { from: "2026-01-01" }),
    );
    expect(queryKeys.messages.list({ platform: "slack" })).toEqual(
      queryKeys.messages.list({ platform: "slack" }),
    );
  });

  it("normalises an absent range to nulls rather than undefined", () => {
    expect(queryKeys.users.summary("u1")).toEqual(["users", "u1", "summary", null, null]);
  });

  it("keeps the roots distinct from one another", () => {
    const roots = [
      queryKeys.users.all[0],
      queryKeys.messages.all[0],
      queryKeys.org.all[0],
      queryKeys.accounts.all[0],
      queryKeys.ingestion.all[0],
      queryKeys.connectors.all[0],
      queryKeys.system.all[0],
    ];
    expect(new Set(roots).size).toBe(roots.length);
  });
});
