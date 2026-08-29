import { wouldCreateCycle } from "../../org-tree";
import { orgNodes } from "../mock";
import type { OrgNode } from "../types";
import { delay } from "./_shared";

export interface CreateOrgNodeInput {
  name: string;
  subtitle?: string;
  parent_id: string | null;
}

export type UpdateOrgNodePatch = Partial<
  Pick<OrgNode, "name" | "subtitle" | "parent_id" | "position">
>;

/** Copy on the way out so callers can't mutate the table by reference. */
const clone = (node: OrgNode): OrgNode => ({ ...node, member_ids: [...node.member_ids] });

/** How many children `parentId` already has - i.e. where a new one appended
 * to the end would land. Mirrors the real API's append-on-create behaviour. */
const nextPosition = (parentId: string | null): number =>
  orgNodes.filter((n) => n.parent_id === parentId).length;

/**
 * Renumber every child of `parentId` to 0..n-1, in their current relative
 * order (by `position`, ties broken by id) but with `movedId` relocated to
 * `targetIndex`. Mirrors the real API's whole-sibling-list reindex - simple
 * over partial, since the mock table is never large enough for it to matter.
 */
function reindexSiblings(parentId: string | null, movedId: string, targetIndex: number): void {
  const siblings = orgNodes
    .filter((n) => n.parent_id === parentId && n.id !== movedId)
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
    .map((n) => n.id);
  const clamped = Math.max(0, Math.min(targetIndex, siblings.length));
  siblings.splice(clamped, 0, movedId);
  siblings.forEach((id, index) => {
    const sibling = orgNodes.find((n) => n.id === id);
    if (sibling) sibling.position = index;
  });
}

/** GET /api/v1/org/nodes */
export async function getOrgNodes(): Promise<OrgNode[]> {
  await delay(220);
  return orgNodes.map(clone);
}

/** POST /api/v1/org/nodes */
export async function createOrgNode(input: CreateOrgNodeInput): Promise<OrgNode> {
  await delay(350);
  if (input.parent_id && !orgNodes.some((n) => n.id === input.parent_id)) {
    throw new Error(`Parent ${input.parent_id} not found`);
  }
  const node: OrgNode = {
    id: `org_${Date.now()}`,
    name: input.name,
    subtitle: input.subtitle ?? "",
    parent_id: input.parent_id,
    position: nextPosition(input.parent_id),
    member_ids: [],
    created_at: new Date().toISOString(),
  };
  orgNodes.push(node);
  return clone(node);
}

/**
 * PATCH /api/v1/org/nodes/{id}
 *
 * Re-parenting is validated here, not only in the UI: a cycle would make the
 * tree walk non-terminating, and the real API will eventually accept moves the
 * console did not originate.
 */
export async function updateOrgNode(id: string, patch: UpdateOrgNodePatch): Promise<OrgNode> {
  await delay(300);
  const node = orgNodes.find((n) => n.id === id);
  if (!node) throw new Error(`Node ${id} not found`);

  const reparenting = patch.parent_id !== undefined;
  if (reparenting) {
    if (patch.parent_id && !orgNodes.some((n) => n.id === patch.parent_id)) {
      throw new Error(`Parent ${patch.parent_id} not found`);
    }
    if (wouldCreateCycle(orgNodes, id, patch.parent_id!)) {
      throw new Error("A node cannot report to itself or to one of its own descendants");
    }
  }

  if (patch.name !== undefined) node.name = patch.name;
  if (patch.subtitle !== undefined) node.subtitle = patch.subtitle;

  if (reparenting || patch.position !== undefined) {
    const oldParentId = node.parent_id;
    const newParentId = reparenting ? patch.parent_id! : oldParentId;
    const target = patch.position ?? orgNodes.filter((n) => n.parent_id === newParentId).length;

    if (reparenting) node.parent_id = newParentId;
    reindexSiblings(newParentId, id, target);
    if (reparenting && oldParentId !== newParentId) {
      // Close the gap left behind - renumber what remains, moved node excluded.
      const remaining = orgNodes
        .filter((n) => n.parent_id === oldParentId && n.id !== id)
        .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
      remaining.forEach((sibling, index) => (sibling.position = index));
    }
  }

  return clone(node);
}

/**
 * DELETE /api/v1/org/nodes/{id}
 *
 * Children are promoted to the removed node's parent rather than deleted, so
 * a mis-click never destroys a subtree. Assigned people are only unassigned —
 * their person records are untouched.
 */
export async function deleteOrgNode(id: string): Promise<{ id: string; promoted: number }> {
  await delay(350);
  const idx = orgNodes.findIndex((n) => n.id === id);
  if (idx === -1) return { id, promoted: 0 };

  const [removed] = orgNodes.splice(idx, 1);
  const children = orgNodes
    .filter((n) => n.parent_id === id)
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
  if (children.length > 0) {
    // Promoted children keep their relative order but are appended after the
    // grandparent's existing children, same as the real API.
    const existing = orgNodes
      .filter((n) => n.parent_id === removed!.parent_id)
      .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
    [...existing, ...children].forEach((node, index) => {
      node.parent_id = removed!.parent_id;
      node.position = index;
    });
  }
  return { id, promoted: children.length };
}

/**
 * POST /api/v1/org/nodes/{id}/members
 *
 * A person belongs to exactly one node, so assigning them here detaches them
 * from wherever they were.
 */
export async function assignOrgMember(nodeId: string, userId: string): Promise<OrgNode> {
  await delay(300);
  const node = orgNodes.find((n) => n.id === nodeId);
  if (!node) throw new Error(`Node ${nodeId} not found`);

  for (const other of orgNodes) {
    other.member_ids = other.member_ids.filter((m) => m !== userId);
  }
  node.member_ids.push(userId);
  return clone(node);
}

/** DELETE /api/v1/org/nodes/{id}/members/{userId} */
export async function removeOrgMember(nodeId: string, userId: string): Promise<OrgNode> {
  await delay(250);
  const node = orgNodes.find((n) => n.id === nodeId);
  if (!node) throw new Error(`Node ${nodeId} not found`);
  node.member_ids = node.member_ids.filter((m) => m !== userId);
  return clone(node);
}
