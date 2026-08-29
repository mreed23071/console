import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  type Over,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useUpdateOrgNode } from "@/features/organization/api/mutations";
import { MoveNodeDialog } from "@/features/organization/components/move-node-dialog";
import { OrgCanvas } from "@/features/organization/components/org-canvas";
import {
  computeSlots,
  layoutTree,
  NODE_H,
  NODE_W,
  type Slot,
  SLOT_W,
} from "@/features/organization/lib/layout";
import type { OrgNode } from "@/lib/api/types";
import { type DropTarget, resolveDrop } from "@/lib/org-tree";
import { cn } from "@/lib/utils";

const CANVAS_PADDING = 32;
const ROOT_SLOT_KEY = "__root__";

const slotId = (parentId: string | null, index: number): string =>
  `slot:${parentId ?? ROOT_SLOT_KEY}:${index}`;
const ontoId = (nodeId: string): string => `onto:${nodeId}`;

function parseDroppableId(id: string): DropTarget {
  if (id.startsWith("onto:")) return { kind: "onto", nodeId: id.slice("onto:".length) };
  const rest = id.slice("slot:".length);
  const sep = rest.lastIndexOf(":");
  const parentPart = rest.slice(0, sep);
  return {
    kind: "slot",
    parentId: parentPart === ROOT_SLOT_KEY ? null : parentPart,
    index: Number(rest.slice(sep + 1)),
  };
}

function DraggableNode({
  node,
  x,
  y,
  isSelected,
  isDragging,
  isDropTarget,
  canEdit,
  onSelect,
  subtitleLabel,
}: {
  node: OrgNode;
  x: number;
  y: number;
  isSelected: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  canEdit: boolean;
  onSelect: (id: string) => void;
  subtitleLabel: string;
}) {
  const {
    setNodeRef: setDragRef,
    listeners,
    attributes,
  } = useDraggable({
    id: node.id,
    disabled: !canEdit,
  });
  const { setNodeRef: setDropRef } = useDroppable({ id: ontoId(node.id) });

  return (
    <button
      ref={(el) => {
        setDragRef(el);
        setDropRef(el);
      }}
      type="button"
      onClick={() => onSelect(node.id)}
      style={{ left: x, top: y, width: NODE_W, height: NODE_H, touchAction: "none" }}
      className={cn(
        "absolute rounded-md border px-3 text-left transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        isSelected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:border-primary/60",
        isDragging && "opacity-40",
        isDropTarget && "ring-2 ring-primary ring-offset-2",
        canEdit && "cursor-grab active:cursor-grabbing",
      )}
      {...listeners}
      {...attributes}
      aria-pressed={isSelected}
    >
      <p className="truncate text-sm font-semibold">{node.name}</p>
      <p
        className={cn(
          "truncate text-xs",
          isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {subtitleLabel}
      </p>
    </button>
  );
}

function SlotIndicator({ slot, isActive }: { slot: Slot; isActive: boolean }) {
  const { setNodeRef } = useDroppable({ id: slotId(slot.parentId, slot.index) });
  return (
    <div
      ref={setNodeRef}
      style={{ left: slot.x, top: slot.y, width: SLOT_W, height: NODE_H }}
      className={cn(
        "pointer-events-none absolute rounded-sm border-2 border-dashed transition-colors",
        isActive ? "border-primary bg-primary/10" : "border-transparent",
      )}
    />
  );
}

/** The pan/zoom org chart: boxes positioned by the layout pass, joined by SVG edges. */
export function OrgChart({
  nodes,
  selectedId,
  onSelect,
  canEdit,
}: {
  nodes: OrgNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  canEdit: boolean;
}) {
  const { t } = useTranslation("organization");
  const layout = layoutTree(nodes);
  const update = useUpdateOrgNode();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overTarget, setOverTarget] = useState<DropTarget | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    node: OrgNode;
    parentId: string | null;
    position: number;
  } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const slots = activeId ? computeSlots(nodes, layout) : [];
  const activeNode = activeId ? (nodes.find((n) => n.id === activeId) ?? null) : null;
  const resolution = activeId && overTarget ? resolveDrop(nodes, activeId, overTarget) : null;

  const readOver = (over: Over | null) => (over ? parseDroppableId(String(over.id)) : null);

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));
  const handleDragOver = (event: { over: Over | null }) => setOverTarget(readOver(event.over));
  const handleDragCancel = () => {
    setActiveId(null);
    setOverTarget(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const draggedId = String(event.active.id);
    const target = readOver(event.over);
    setActiveId(null);
    setOverTarget(null);
    if (!target) return;

    const result = resolveDrop(nodes, draggedId, target);
    if (!result.valid) return;

    const dragged = nodes.find((n) => n.id === draggedId);
    if (!dragged) return;
    if (dragged.parent_id === result.parentId && dragged.position === result.position) return;

    if (dragged.parent_id === result.parentId) {
      update.mutate(
        { id: draggedId, patch: { position: result.position } },
        { onError: () => toast.error(t("move.error")) },
      );
    } else {
      setPendingMove({ node: dragged, parentId: result.parentId, position: result.position });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      // The dragged overlay is a full node-sized box (190x60), much wider
      // than the thin between-slots — the default rectIntersection compares
      // that whole box against every drop zone, so it almost always favours
      // a neighbouring node's much larger "onto" zone over the skinny slot
      // beside it. pointerWithin looks at the cursor point instead, which is
      // what actually distinguishes "between these two" from "onto this one".
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <OrgCanvas
        width={layout.width + CANVAS_PADDING * 2}
        height={layout.height + CANVAS_PADDING * 2}
      >
        <div style={{ padding: CANVAS_PADDING }}>
          <div className="relative" style={{ width: layout.width, height: layout.height }}>
            <svg
              className="pointer-events-none absolute inset-0"
              width={layout.width}
              height={layout.height}
              aria-hidden
            >
              {layout.edges.map((edge) => (
                <path
                  key={`${edge.fromId}-${edge.toId}`}
                  // Elbow rather than a diagonal: parallel verticals read as a
                  // hierarchy, crossing diagonals read as a network.
                  d={`M ${edge.x1} ${edge.y1} V ${(edge.y1 + edge.y2) / 2} H ${edge.x2} V ${edge.y2}`}
                  className="text-border"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  fill="none"
                />
              ))}
            </svg>

            {layout.nodes.map(({ node, x, y }) => (
              <DraggableNode
                key={node.id}
                node={node}
                x={x}
                y={y}
                isSelected={selectedId === node.id}
                isDragging={activeId === node.id}
                isDropTarget={
                  overTarget?.kind === "onto" &&
                  overTarget.nodeId === node.id &&
                  Boolean(resolution?.valid)
                }
                canEdit={canEdit}
                onSelect={onSelect}
                subtitleLabel={
                  node.subtitle || t("node.memberCount", { count: node.member_ids.length })
                }
              />
            ))}

            {slots.map((slot) => (
              <SlotIndicator
                key={slotId(slot.parentId, slot.index)}
                slot={slot}
                isActive={
                  overTarget?.kind === "slot" &&
                  overTarget.parentId === slot.parentId &&
                  overTarget.index === slot.index &&
                  Boolean(resolution?.valid)
                }
              />
            ))}
          </div>
        </div>
      </OrgCanvas>

      <DragOverlay>
        {activeNode ? (
          <div
            style={{ width: NODE_W, height: NODE_H }}
            className="rounded-md border border-primary bg-card px-3 py-2 shadow-lg"
          >
            <p className="truncate text-sm font-semibold">{activeNode.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {activeNode.subtitle ||
                t("node.memberCount", { count: activeNode.member_ids.length })}
            </p>
          </div>
        ) : null}
      </DragOverlay>

      {pendingMove && (
        <MoveNodeDialog
          open
          onOpenChange={(open) => {
            if (!open) setPendingMove(null);
          }}
          node={pendingMove.node}
          targetParentId={pendingMove.parentId}
          targetPosition={pendingMove.position}
          nodes={nodes}
          onMoved={() => setPendingMove(null)}
        />
      )}
    </DndContext>
  );
}
