import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import type { OrgNode } from "@/lib/api/types";
import { getChildren, getRoots, indexChildren } from "@/lib/org-tree";
import { cn } from "@/lib/utils";

const INDENT_PX = 18;
const BASE_PAD_PX = 12;

/**
 * Indented directory view. Always expanded: the hierarchy is the point, and at
 * org scale there is nothing to gain from hiding branches.
 */
export function OrgTreeList({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: OrgNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const index = indexChildren(nodes);

  const renderNode = (node: OrgNode, depth: number): ReactNode => {
    const children = getChildren(index, node.id);
    const isSelected = selectedId === node.id;

    return (
      <li key={node.id}>
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          aria-pressed={isSelected}
          style={{ paddingLeft: BASE_PAD_PX + depth * INDENT_PX }}
          className={cn(
            "flex w-full items-center gap-2 rounded-md py-2 pr-3 text-left transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted",
          )}
        >
          <ChevronRight
            className={cn("size-3.5 shrink-0", children.length ? "opacity-60" : "opacity-0")}
            aria-hidden
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{node.name}</span>
            <span
              className={cn(
                "block truncate text-xs",
                isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
              )}
            >
              {node.subtitle || "—"}
            </span>
          </span>
          <span
            className={cn(
              "tnum shrink-0 text-xs",
              isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
            )}
          >
            {node.member_ids.length}
          </span>
        </button>

        {children.length > 0 && (
          <ul className="space-y-0.5">{children.map((child) => renderNode(child, depth + 1))}</ul>
        )}
      </li>
    );
  };

  return <ul className="space-y-0.5 p-2">{getRoots(index).map((root) => renderNode(root, 0))}</ul>;
}
