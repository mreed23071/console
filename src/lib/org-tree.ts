/**
 * Pure helpers over the organization adjacency list.
 *
 * These live in `lib/` rather than inside the feature because both sides need
 * them: the API layer validates re-parenting with `wouldCreateCycle`, and the
 * feature builds its views from the same index. They take data and return
 * data — no React, no DOM — which is what makes them testable in isolation.
 */
import type { OrgNode } from "./api/types";

/** Sentinel key for roots in the children index, since Map keys can't be null. */
export const ROOT_KEY = "__root__";

export type ChildIndex = Map<string, OrgNode[]>;

/**
 * Groups nodes by parent. A node whose `parent_id` points at something that
 * isn't in the set is treated as a root rather than being dropped, so a
 * partial or inconsistent response still renders everything it was given.
 */
export function indexChildren(nodes: OrgNode[]): ChildIndex {
  const known = new Set(nodes.map((n) => n.id));
  const index: ChildIndex = new Map();

  for (const node of nodes) {
    const key = node.parent_id && known.has(node.parent_id) ? node.parent_id : ROOT_KEY;
    const siblings = index.get(key);
    if (siblings) siblings.push(node);
    else index.set(key, [node]);
  }

  return index;
}

export function getChildren(index: ChildIndex, nodeId: string): OrgNode[] {
  return index.get(nodeId) ?? [];
}

export function getRoots(index: ChildIndex): OrgNode[] {
  return index.get(ROOT_KEY) ?? [];
}

/**
 * Every id beneath `nodeId`, excluding `nodeId` itself.
 *
 * The `seen` set does double duty: it dedupes, and it makes the walk
 * terminate even if the data already contains a cycle — which matters
 * because this is the function used to *prevent* cycles.
 */
export function getDescendantIds(nodes: OrgNode[], nodeId: string): Set<string> {
  const index = indexChildren(nodes);
  const seen = new Set<string>();
  const queue = [...getChildren(index, nodeId)];

  while (queue.length > 0) {
    const next = queue.shift()!;
    if (seen.has(next.id)) continue;
    seen.add(next.id);
    queue.push(...getChildren(index, next.id));
  }

  return seen;
}

/**
 * Whether re-parenting `nodeId` under `nextParentId` would create a loop.
 *
 * A node cannot become its own parent, nor a child of anything already
 * beneath it. Moving to a root (`null`) is always safe.
 */
export function wouldCreateCycle(
  nodes: OrgNode[],
  nodeId: string,
  nextParentId: string | null,
): boolean {
  if (nextParentId === null) return false;
  if (nextParentId === nodeId) return true;
  return getDescendantIds(nodes, nodeId).has(nextParentId);
}

/**
 * The nodes that may legally become the parent of `nodeId` — everything
 * except itself and its own subtree. Drives the "Reports to" picker.
 */
export function eligibleParents(nodes: OrgNode[], nodeId: string): OrgNode[] {
  const blocked = getDescendantIds(nodes, nodeId);
  return nodes.filter((n) => n.id !== nodeId && !blocked.has(n.id));
}

/** Depth of each node from its root, keyed by id. Roots are depth 0. */
export function depthById(nodes: OrgNode[]): Map<string, number> {
  const index = indexChildren(nodes);
  const depths = new Map<string, number>();
  const queue: Array<{ node: OrgNode; depth: number }> = getRoots(index).map((node) => ({
    node,
    depth: 0,
  }));

  while (queue.length > 0) {
    const { node, depth } = queue.shift()!;
    if (depths.has(node.id)) continue;
    depths.set(node.id, depth);
    for (const child of getChildren(index, node.id)) {
      queue.push({ node: child, depth: depth + 1 });
    }
  }

  return depths;
}

/**
 * Maps each assigned person's id to the node they belong to.
 *
 * A person belongs to exactly one node, so this is a plain lookup rather than
 * a multimap. If the data ever disagrees, the first node wins and the rest are
 * ignored — deterministic, and better than throwing at render time.
 */
export function nodeByMemberId(nodes: OrgNode[]): Map<string, OrgNode> {
  const byMember = new Map<string, OrgNode>();
  for (const node of nodes) {
    for (const memberId of node.member_ids) {
      if (!byMember.has(memberId)) byMember.set(memberId, node);
    }
  }
  return byMember;
}

/** The node a person currently belongs to, or null if they are unassigned. */
export function findMemberNode(nodes: OrgNode[], userId: string): OrgNode | null {
  return nodeByMemberId(nodes).get(userId) ?? null;
}

/**
 * Whether assigning `userId` to `targetNodeId` needs confirming first.
 *
 * Assigning is destructive when the person already belongs somewhere, because
 * it moves them — the previous department silently loses them. Confirmation is
 * only warranted in that case: an unassigned person has nothing to lose, and
 * re-assigning to the department they are already in changes nothing.
 */
export function requiresReassignConfirmation(
  nodes: OrgNode[],
  userId: string,
  targetNodeId: string,
): boolean {
  const current = findMemberNode(nodes, userId);
  return current !== null && current.id !== targetNodeId;
}
