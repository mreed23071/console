import { describe, expect, it } from "vitest";

import { setupCleanDatabase } from "@/test/setup-endpoints";

import { getMessages } from "./messages";

setupCleanDatabase();

const ALL = { limit: 500, offset: 0 };

describe("getMessages", () => {
  it("returns a page, not the whole table", async () => {
    const page = await getMessages();
    expect(page.items.length).toBeLessThanOrEqual(20);
    expect(page.limit).toBe(20);
    expect(page.offset).toBe(0);
  });

  it("total reflects every matching row, not just the page returned", async () => {
    const page = await getMessages({}, { limit: 1, offset: 0 });
    expect(page.items).toHaveLength(1);
    expect(page.total).toBeGreaterThan(1);
    expect(page.hasMore).toBe(true);
  });

  it("offset moves the window, and the last page reports no more", async () => {
    const { total } = await getMessages({}, { limit: 1, offset: 0 });
    const last = await getMessages({}, { limit: 1, offset: total - 1 });
    expect(last.items).toHaveLength(1);
    expect(last.hasMore).toBe(false);
  });

  it("filters by platform", async () => {
    const slack = await getMessages({ platform: "slack" }, ALL);
    expect(slack.items.length).toBeGreaterThan(0);
    expect(slack.items.every((m) => m.platform === "slack")).toBe(true);
  });

  it("treats 'all' as no platform filter", async () => {
    const withAll = await getMessages({ platform: "all" }, ALL);
    const withNone = await getMessages({}, ALL);
    expect(withAll.total).toBe(withNone.total);
  });

  it("filters by category", async () => {
    const business = await getMessages({ category: "business" }, ALL);
    expect(business.items.every((m) => m.filter_category === "business")).toBe(true);
  });

  it("treats 'all' as no category filter", async () => {
    const withAll = await getMessages({ category: "all" }, ALL);
    const withNone = await getMessages({}, ALL);
    expect(withAll.total).toBe(withNone.total);
  });

  it("combines platform and category", async () => {
    const filtered = await getMessages({ platform: "slack", category: "business" }, ALL);
    expect(
      filtered.items.every((m) => m.platform === "slack" && m.filter_category === "business"),
    ).toBe(true);
  });

  it("filters by a from date", async () => {
    const all = await getMessages({}, ALL);
    const pivot = all.items[Math.floor(all.items.length / 2)]!.sent_at;
    const after = await getMessages({ from: pivot }, ALL);
    expect(after.items.every((m) => m.sent_at >= pivot)).toBe(true);
  });

  it("filters by a to date", async () => {
    const all = await getMessages({}, ALL);
    const pivot = all.items[Math.floor(all.items.length / 2)]!.sent_at;
    const before = await getMessages({ to: pivot }, ALL);
    expect(before.items.every((m) => m.sent_at <= pivot)).toBe(true);
  });

  it("searches content case-insensitively", async () => {
    const { items } = await getMessages({}, ALL);
    const fragment = items[0]!.content.slice(0, 12);

    const hits = await getMessages({ search: fragment.toUpperCase() }, ALL);
    expect(hits.items.length).toBeGreaterThan(0);
    expect(hits.items.every((m) => m.content.toLowerCase().includes(fragment.toLowerCase()))).toBe(
      true,
    );
  });

  it("returns nothing for a search that matches nothing", async () => {
    const page = await getMessages({ search: "zzzz-no-such-content-zzzz" }, ALL);
    expect(page.items).toEqual([]);
    expect(page.total).toBe(0);
  });

  it("returns newest first", async () => {
    const { items } = await getMessages({}, ALL);
    for (let i = 1; i < items.length; i++) {
      expect(items[i - 1]!.sent_at >= items[i]!.sent_at).toBe(true);
    }
  });
});
