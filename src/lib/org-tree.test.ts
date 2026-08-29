import { describe, expect, it } from "vitest";

import type { OrgNode } from "./api/types";
import {
  depthById,
  type DropTarget,
  eligibleParents,
  findMemberNode,
  getChildren,
  getDescendantIds,
  getRoots,
  indexChildren,
  nodeByMemberId,
  requiresReassignConfirmation,
  resolveDrop,
  wouldCreateCycle,
} from "./org-tree";

/** Minimal node factory — only the fields the tree logic reads. */
const node = (
  id: string,
  parent_id: string | null = null,
  member_ids: string[] = [],
  position = 0,
): OrgNode => ({
  id,
  name: id,
  subtitle: "",
  parent_id,
  position,
  member_ids,
  created_at: "2026-01-01T00:00:00.000Z",
});

/**
 *   root
 *   ├─ a
 *   │  ├─ a1
 *   │  └─ a2
 *   └─ b
 */
const tree = (): OrgNode[] => [
  node("root"),
  node("a", "root"),
  node("b", "root"),
  node("a1", "a"),
  node("a2", "a"),
];

describe("indexChildren", () => {
  it("groups nodes under their parent", () => {
    const index = indexChildren(tree());
    expect(getChildren(index, "root").map((n) => n.id)).toEqual(["a", "b"]);
    expect(getChildren(index, "a").map((n) => n.id)).toEqual(["a1", "a2"]);
    expect(getChildren(index, "b")).toEqual([]);
  });

  it("returns nodes with no parent as roots", () => {
    expect(getRoots(indexChildren(tree())).map((n) => n.id)).toEqual(["root"]);
  });

  it("treats a dangling parent reference as a root rather than dropping the node", () => {
    // A partial response must still render everything it contained.
    const nodes = [node("a"), node("orphan", "missing-parent")];
    expect(getRoots(indexChildren(nodes)).map((n) => n.id)).toEqual(["a", "orphan"]);
  });

  it("handles an empty set", () => {
    expect(getRoots(indexChildren([]))).toEqual([]);
  });
});

describe("getDescendantIds", () => {
  it("collects the whole subtree, excluding the node itself", () => {
    expect(getDescendantIds(tree(), "a")).toEqual(new Set(["a1", "a2"]));
    expect(getDescendantIds(tree(), "root")).toEqual(new Set(["a", "b", "a1", "a2"]));
  });

  it("returns nothing for a leaf", () => {
    expect(getDescendantIds(tree(), "b").size).toBe(0);
  });

  it("terminates on data that already contains a cycle", () => {
    // a -> b -> a. Without the seen-set this would loop forever.
    const nodes = [node("a", "b"), node("b", "a")];
    expect(() => getDescendantIds(nodes, "a")).not.toThrow();
    expect(getDescendantIds(nodes, "a").has("b")).toBe(true);
  });
});

describe("wouldCreateCycle", () => {
  it("rejects a node becoming its own parent", () => {
    expect(wouldCreateCycle(tree(), "a", "a")).toBe(true);
  });

  it("rejects a node moving under its own descendant", () => {
    expect(wouldCreateCycle(tree(), "a", "a1")).toBe(true);
    expect(wouldCreateCycle(tree(), "root", "a2")).toBe(true);
  });

  it("allows a move to an unrelated branch", () => {
    expect(wouldCreateCycle(tree(), "a1", "b")).toBe(false);
  });

  it("allows a move to the parent it already has", () => {
    expect(wouldCreateCycle(tree(), "a", "root")).toBe(false);
  });

  it("always allows promotion to a root", () => {
    expect(wouldCreateCycle(tree(), "a1", null)).toBe(false);
  });
});

describe("eligibleParents", () => {
  it("excludes the node and its subtree", () => {
    expect(eligibleParents(tree(), "a").map((n) => n.id)).toEqual(["root", "b"]);
  });

  it("offers every other node for a leaf", () => {
    expect(eligibleParents(tree(), "b").map((n) => n.id)).toEqual(["root", "a", "a1", "a2"]);
  });
});

describe("depthById", () => {
  it("measures depth from the root", () => {
    const depths = depthById(tree());
    expect(depths.get("root")).toBe(0);
    expect(depths.get("a")).toBe(1);
    expect(depths.get("a1")).toBe(2);
  });

  it("starts every root at zero", () => {
    const depths = depthById([node("r1"), node("r2"), node("c", "r2")]);
    expect(depths.get("r1")).toBe(0);
    expect(depths.get("r2")).toBe(0);
    expect(depths.get("c")).toBe(1);
  });
});

/** Two departments, one person in each, and one person assigned nowhere. */
const staffed = (): OrgNode[] => [
  node("eng", null, ["amara"]),
  node("design", null, ["hannah"]),
  node("empty"),
];

describe("nodeByMemberId", () => {
  it("maps each assigned person to their department", () => {
    const byMember = nodeByMemberId(staffed());
    expect(byMember.get("amara")?.id).toBe("eng");
    expect(byMember.get("hannah")?.id).toBe("design");
  });

  it("omits people who are not assigned anywhere", () => {
    expect(nodeByMemberId(staffed()).has("nobody")).toBe(false);
  });

  it("keeps the first node when data assigns someone twice", () => {
    const nodes = [node("a", null, ["dup"]), node("b", null, ["dup"])];
    expect(nodeByMemberId(nodes).get("dup")?.id).toBe("a");
  });
});

describe("findMemberNode", () => {
  it("returns the department a person belongs to", () => {
    expect(findMemberNode(staffed(), "amara")?.id).toBe("eng");
  });

  it("returns null for an unassigned person", () => {
    expect(findMemberNode(staffed(), "nobody")).toBe(null);
  });
});

describe("requiresReassignConfirmation", () => {
  it("confirms when the person is moving out of another department", () => {
    // The move is destructive: `eng` silently loses Amara.
    expect(requiresReassignConfirmation(staffed(), "amara", "design")).toBe(true);
  });

  it("does not confirm for an unassigned person", () => {
    expect(requiresReassignConfirmation(staffed(), "nobody", "eng")).toBe(false);
  });

  it("does not confirm when the person is already in the target department", () => {
    // A no-op assignment has nothing to warn about.
    expect(requiresReassignConfirmation(staffed(), "amara", "eng")).toBe(false);
  });

  it("does not confirm when no department has any members", () => {
    expect(requiresReassignConfirmation([node("a"), node("b")], "amara", "a")).toBe(false);
  });
});

describe("resolveDrop", () => {
  const slot = (parentId: string | null, index: number): DropTarget => ({
    kind: "slot",
    parentId,
    index,
  });
  const onto = (nodeId: string): DropTarget => ({ kind: "onto", nodeId });

  it("resolves a slot to that exact parent and position", () => {
    expect(resolveDrop(tree(), "b", slot("a", 1))).toEqual({
      parentId: "a",
      position: 1,
      valid: true,
    });
  });

  it("resolves a root slot with a null parent", () => {
    expect(resolveDrop(tree(), "a", slot(null, 0))).toEqual({
      parentId: null,
      position: 0,
      valid: true,
    });
  });

  it("resolves dropping onto a node as becoming its last child", () => {
    // "b" has no children, so it lands at index 0.
    expect(resolveDrop(tree(), "a1", onto("b"))).toEqual({
      parentId: "b",
      position: 0,
      valid: true,
    });
  });

  it("appends after existing children when dropping onto a node that has some", () => {
    // "a" already has a1 and a2.
    expect(resolveDrop(tree(), "b", onto("a")).position).toBe(2);
  });

  it("rejects dropping a node onto itself", () => {
    expect(resolveDrop(tree(), "a", onto("a")).valid).toBe(false);
  });

  it("rejects dropping a node onto its own descendant", () => {
    expect(resolveDrop(tree(), "a", onto("a1")).valid).toBe(false);
  });

  it("rejects a slot inside a node's own subtree", () => {
    expect(resolveDrop(tree(), "a", slot("a1", 0)).valid).toBe(false);
  });

  it("allows a slot among unrelated siblings", () => {
    expect(resolveDrop(tree(), "a1", slot("root", 0)).valid).toBe(true);
  });
});
