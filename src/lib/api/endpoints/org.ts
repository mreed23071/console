import { wouldCreateCycle } from "../../org-tree";
import { orgNodes } from "../mock";
import type { OrgNode } from "../types";
import { delay } from "./_shared";

export interface CreateOrgNodeInput {
  name: string;
  subtitle?: string;
  parent_id: string | null;
}

export type UpdateOrgNodePatch = Partial<Pick<OrgNode, "name" | "subtitle" | "parent_id">>;

/** Copy on the way out so callers can't mutate the table by reference. */
const clone = (node: OrgNode): OrgNode => ({ ...node, member_ids: [...node.member_ids] });

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

  if (patch.parent_id !== undefined) {
    if (patch.parent_id && !orgNodes.some((n) => n.id === patch.parent_id)) {
      throw new Error(`Parent ${patch.parent_id} not found`);
    }
    if (wouldCreateCycle(orgNodes, id, patch.parent_id)) {
      throw new Error("A node cannot report to itself or to one of its own descendants");
    }
  }

  Object.assign(node, patch);
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
  let promoted = 0;
  for (const node of orgNodes) {
    if (node.parent_id === id) {
      node.parent_id = removed!.parent_id;
      promoted++;
    }
  }
  return { id, promoted };
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
