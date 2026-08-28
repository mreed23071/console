import { useTranslation } from "react-i18next";

import { OrgCanvas } from "@/features/organization/components/org-canvas";
import { layoutTree, NODE_H, NODE_W } from "@/features/organization/lib/layout";
import type { OrgNode } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const CANVAS_PADDING = 32;

/** The pan/zoom org chart: boxes positioned by the layout pass, joined by SVG edges. */
export function OrgChart({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: OrgNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation("organization");
  const layout = layoutTree(nodes);

  return (
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

          {layout.nodes.map(({ node, x, y }) => {
            const isSelected = selectedId === node.id;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelect(node.id)}
                aria-pressed={isSelected}
                style={{ left: x, top: y, width: NODE_W, height: NODE_H }}
                className={cn(
                  "absolute rounded-md border px-3 text-left transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/60",
                )}
              >
                <p className="truncate text-sm font-semibold">{node.name}</p>
                <p
                  className={cn(
                    "truncate text-xs",
                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {node.subtitle || t("node.memberCount", { count: node.member_ids.length })}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </OrgCanvas>
  );
}
