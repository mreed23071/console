import { describe, expect, it } from "vitest";

import type { OrgNode } from "@/lib/api/types";

import { H_GAP, layoutTree, NODE_H, NODE_W, V_GAP } from "./layout";

const node = (id: string, parent_id: string | null = null): OrgNode => ({
  id,
  name: id,
  subtitle: "",
  parent_id,
  member_ids: [],
  created_at: "2026-01-01T00:00:00.000Z",
});

const at = (layout: ReturnType<typeof layoutTree>, id: string) => {
  const found = layout.nodes.find((p) => p.node.id === id);
  if (!found) throw new Error(`${id} was not placed`);
  return found;
};

describe("layoutTree", () => {
  it("returns an empty layout for no nodes", () => {
    expect(layoutTree([])).toEqual({ nodes: [], edges: [], width: 0, height: 0 });
  });

  it("places a lone node at the origin", () => {
    const layout = layoutTree([node("solo")]);
    expect(at(layout, "solo")).toMatchObject({ x: 0, y: 0 });
    expect(layout.width).toBe(NODE_W);
    expect(layout.height).toBe(NODE_H);
  });

  it("puts each level a full row below the last", () => {
    const layout = layoutTree([node("r"), node("c", "r"), node("g", "c")]);
    expect(at(layout, "r").y).toBe(0);
    expect(at(layout, "c").y).toBe(NODE_H + V_GAP);
    expect(at(layout, "g").y).toBe(2 * (NODE_H + V_GAP));
  });

  it("stacks a single child directly under its parent", () => {
    const layout = layoutTree([node("r"), node("c", "r")]);
    expect(at(layout, "c").x).toBe(at(layout, "r").x);
  });

  it("spaces siblings by the gap and centres the parent over them", () => {
    const layout = layoutTree([node("r"), node("a", "r"), node("b", "r")]);
    const a = at(layout, "a");
    const b = at(layout, "b");

    expect(b.x - a.x).toBe(NODE_W + H_GAP);
    // Parent sits at the midpoint of its children.
    expect(at(layout, "r").x).toBe((a.x + b.x) / 2);
  });

  it("never overlaps nodes on the same row", () => {
    const layout = layoutTree([
      node("r"),
      node("a", "r"),
      node("b", "r"),
      node("a1", "a"),
      node("a2", "a"),
      node("b1", "b"),
    ]);

    const rows = new Map<number, number[]>();
    for (const p of layout.nodes) {
      rows.set(p.y, [...(rows.get(p.y) ?? []), p.x]);
    }

    for (const xs of rows.values()) {
      const sorted = [...xs].sort((m, n) => m - n);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i]! - sorted[i - 1]!).toBeGreaterThanOrEqual(NODE_W);
      }
    }
  });

  it("emits one edge per parent-child link, anchored to the node borders", () => {
    const layout = layoutTree([node("r"), node("c", "r")]);
    expect(layout.edges).toHaveLength(1);

    const [edge] = layout.edges;
    expect(edge).toMatchObject({ fromId: "r", toId: "c" });
    expect(edge!.y1).toBe(NODE_H); // leaves the bottom of the parent
    expect(edge!.y2).toBe(NODE_H + V_GAP); // meets the top of the child
    expect(edge!.x1).toBe(at(layout, "r").x + NODE_W / 2);
  });

  it("lays multiple roots out side by side", () => {
    const layout = layoutTree([node("r1"), node("r2")]);
    expect(at(layout, "r1").y).toBe(0);
    expect(at(layout, "r2").y).toBe(0);
    expect(at(layout, "r2").x).toBeGreaterThan(at(layout, "r1").x);
    expect(layout.edges).toHaveLength(0);
  });

  it("reports a bounding box that contains every node", () => {
    const layout = layoutTree([node("r"), node("a", "r"), node("b", "r")]);
    for (const p of layout.nodes) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x + NODE_W).toBeLessThanOrEqual(layout.width);
      expect(p.y + NODE_H).toBeLessThanOrEqual(layout.height);
    }
  });

  it("still places every node when the data contains a cycle", () => {
    // Neither node is a root, so a naive walk would render nothing — or hang.
    const layout = layoutTree([node("a", "b"), node("b", "a")]);
    expect(layout.nodes).toHaveLength(2);
  });

  it("places a node whose parent is missing", () => {
    const layout = layoutTree([node("r"), node("lost", "gone")]);
    expect(layout.nodes).toHaveLength(2);
    expect(at(layout, "lost").y).toBe(0);
  });

  it("handles a deep chain without quadratic blow-up", () => {
    // 400 deep: the memoised measure makes this instant, the naive one does not.
    const chain = Array.from({ length: 400 }, (_, i) =>
      node(`n${i}`, i === 0 ? null : `n${i - 1}`),
    );
    const started = performance.now();
    const layout = layoutTree(chain);
    expect(layout.nodes).toHaveLength(400);
    expect(performance.now() - started).toBeLessThan(1000);
  });
});
