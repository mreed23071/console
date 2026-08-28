/**
 * Tidy top-down layout for the org canvas.
 *
 * Classic two-pass tree layout: measure every subtree's width bottom-up, then
 * place each node centred over its children top-down. Subtree widths are
 * memoised — without that, measuring is quadratic, because every parent
 * re-measures the whole subtree beneath it.
 */
import type { OrgNode } from "@/lib/api/types";
import { type ChildIndex, getChildren, getRoots, indexChildren } from "@/lib/org-tree";

export const NODE_W = 190;
export const NODE_H = 60;
/** Horizontal gap between sibling subtrees. */
export const H_GAP = 26;
/** Vertical gap between a node and its children. */
export const V_GAP = 84;
/** Gap between separate root trees. */
export const ROOT_GAP = H_GAP * 2;

export interface PositionedNode {
  node: OrgNode;
  x: number;
  y: number;
}

export interface LayoutEdge {
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface OrgLayout {
  nodes: PositionedNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}

const EMPTY: OrgLayout = { nodes: [], edges: [], width: 0, height: 0 };

function measurer(index: ChildIndex) {
  const cache = new Map<string, number>();

  const subtreeWidth = (node: OrgNode): number => {
    const cached = cache.get(node.id);
    if (cached !== undefined) return cached;

    // Seed before recursing so a malformed cycle resolves instead of hanging.
    cache.set(node.id, NODE_W);

    const children = getChildren(index, node.id);
    const width =
      children.length === 0
        ? NODE_W
        : Math.max(
            NODE_W,
            children.reduce((sum, child, i) => sum + subtreeWidth(child) + (i ? H_GAP : 0), 0),
          );

    cache.set(node.id, width);
    return width;
  };

  return subtreeWidth;
}

export function layoutTree(nodes: OrgNode[]): OrgLayout {
  if (nodes.length === 0) return EMPTY;

  const index = indexChildren(nodes);
  const subtreeWidth = measurer(index);

  const positioned: PositionedNode[] = [];
  const edges: LayoutEdge[] = [];
  const placed = new Set<string>();

  const place = (node: OrgNode, left: number, depth: number): PositionedNode => {
    const width = subtreeWidth(node);
    const self: PositionedNode = {
      node,
      x: left + width / 2 - NODE_W / 2,
      y: depth * (NODE_H + V_GAP),
    };
    positioned.push(self);
    placed.add(node.id);

    let cursor = left;
    for (const child of getChildren(index, node.id)) {
      // Guards against a cycle in the data: a node is only ever placed once.
      if (placed.has(child.id)) continue;
      const childPos = place(child, cursor, depth + 1);
      edges.push({
        fromId: node.id,
        toId: child.id,
        x1: self.x + NODE_W / 2,
        y1: self.y + NODE_H,
        x2: childPos.x + NODE_W / 2,
        y2: childPos.y,
      });
      cursor += subtreeWidth(child) + H_GAP;
    }

    return self;
  };

  let cursor = 0;
  for (const root of getRoots(index)) {
    place(root, cursor, 0);
    cursor += subtreeWidth(root) + ROOT_GAP;
  }

  // Anything unreachable from a root — only possible if the data contains a
  // cycle — is laid out alongside the roots so it is visible rather than lost.
  for (const node of nodes) {
    if (placed.has(node.id)) continue;
    place(node, cursor, 0);
    cursor += subtreeWidth(node) + ROOT_GAP;
  }

  return {
    nodes: positioned,
    edges,
    width: Math.max(cursor - ROOT_GAP, NODE_W),
    height: positioned.reduce((max, p) => Math.max(max, p.y + NODE_H), NODE_H),
  };
}
