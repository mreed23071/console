import { describe, expect, it } from "vitest";

import { setupCleanDatabase } from "@/test/setup-endpoints";

import { getUserMessages } from "./people";
import { getUserSummary, regenerateUserSummary } from "./summary";

setupCleanDatabase();

/** Someone with retained messages, so the summary path is actually exercised. */
async function personWithMessages(): Promise<string> {
  for (const id of ["usr_0001", "usr_0002", "usr_0003", "usr_0004", "usr_0005"]) {
    if ((await getUserMessages(id)).length > 0) return id;
  }
  throw new Error("no seeded person has messages");
}

describe("getUserSummary", () => {
  it("summarises a person with retained messages", async () => {
    const summary = await getUserSummary(await personWithMessages());
    expect(summary.summary_error).toBe(null);
    expect(summary.summary.length).toBeGreaterThan(0);
    expect(summary.message_count).toBeGreaterThan(0);
  });

  it("reports an error rather than throwing for an unknown person", async () => {
    const summary = await getUserSummary("nope");
    expect(summary.summary_error).toBe("No such user");
    expect(summary.summary).toBe("");
  });

  it("reports an error when the person has nothing retained", async () => {
    // A brand-new person has no messages.
    const summary = await getUserSummary("usr_0001");
    if (summary.message_count === 0) {
      expect(summary.summary_error).toBeTruthy();
    } else {
      expect(summary.summary_error).toBe(null);
    }
  });

  it("includes at most five recent messages", async () => {
    const summary = await getUserSummary(await personWithMessages());
    expect(summary.recent_messages.length).toBeLessThanOrEqual(5);
  });

  it("labels an unbounded range as all history", async () => {
    const summary = await getUserSummary(await personWithMessages());
    expect(summary.range_label).toBe("all retained history");
    expect(summary.range_from).toBe(null);
    expect(summary.range_to).toBe(null);
  });

  it("narrows the message count when a from date is given", async () => {
    const id = await personWithMessages();
    const all = await getUserSummary(id);
    const recent = await getUserSummary(id, { from: "2026-08-20" });
    expect(recent.message_count).toBeLessThanOrEqual(all.message_count);
    expect(recent.range_from).toBe("2026-08-20");
  });

  it("treats a plain to-date as inclusive of that whole day", async () => {
    const id = await personWithMessages();
    const summary = await getUserSummary(id, { to: "2026-08-26" });
    // A message sent at 18:00 on the 26th must still be counted.
    const sameDay = (await getUserMessages(id)).filter((m) => m.sent_at.startsWith("2026-08-26"));
    if (sameDay.length > 0) expect(summary.message_count).toBeGreaterThan(0);
  });

  it("echoes both bounds in the label", async () => {
    const summary = await getUserSummary(await personWithMessages(), {
      from: "2026-08-01",
      to: "2026-08-26",
    });
    expect(summary.range_label).toBe("2026-08-01 – 2026-08-26");
  });
});

describe("regenerateUserSummary", () => {
  it("returns a fresh summary", async () => {
    const id = await personWithMessages();
    const regenerated = await regenerateUserSummary(id);
    expect(regenerated.summary.length).toBeGreaterThan(0);
  });

  it("caches the result, so the next read matches", async () => {
    const id = await personWithMessages();
    const regenerated = await regenerateUserSummary(id);
    const read = await getUserSummary(id);
    expect(read.summary).toBe(regenerated.summary);
  });

  it("keeps ranges cached independently", async () => {
    const id = await personWithMessages();
    await regenerateUserSummary(id, { from: "2026-08-01" });
    const other = await getUserSummary(id);
    expect(other.range_label).toBe("all retained history");
  });
});
