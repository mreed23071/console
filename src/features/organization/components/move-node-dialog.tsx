import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUpdateOrgNode } from "@/features/organization/api/mutations";
import type { OrgNode } from "@/lib/api/types";
import { getDescendantIds } from "@/lib/org-tree";

/**
 * Confirms a reparent dropped in from the chart before it's sent.
 *
 * Reordering among siblings commits the moment it's dropped — it can't
 * change who has access to what. Reparenting can: department membership is
 * the boundary the future RBAC work is expected to filter on, so moving a
 * whole subtree under a new parent needs a deliberate "yes" from the user,
 * not just a drop.
 */
export function MoveNodeDialog({
  open,
  onOpenChange,
  node,
  targetParentId,
  targetPosition,
  nodes,
  onMoved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: OrgNode;
  targetParentId: string | null;
  targetPosition: number;
  nodes: OrgNode[];
  onMoved: () => void;
}) {
  const { t } = useTranslation(["organization", "common"]);
  const update = useUpdateOrgNode();

  const targetParent = targetParentId ? nodes.find((n) => n.id === targetParentId) : null;
  const descendantIds = getDescendantIds(nodes, node.id);
  const departmentCount = descendantIds.size;
  const peopleCount =
    node.member_ids.length +
    nodes.filter((n) => descendantIds.has(n.id)).reduce((sum, n) => sum + n.member_ids.length, 0);

  const description = [
    targetParent
      ? t("organization:move.descriptionParent", { name: node.name, parent: targetParent.name })
      : t("organization:move.descriptionRoot", { name: node.name }),
    departmentCount > 0 ? t("organization:move.impactDepartments", { count: departmentCount }) : "",
    peopleCount > 0 ? t("organization:move.impactPeople", { count: peopleCount }) : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("organization:move.title", { name: node.name })}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common:action.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              update.mutate(
                {
                  id: node.id,
                  patch: { parent_id: targetParentId, position: targetPosition },
                },
                {
                  onSuccess: () => {
                    toast.success(t("organization:move.success", { name: node.name }));
                    onMoved();
                  },
                  onError: () => toast.error(t("organization:move.error")),
                },
              )
            }
          >
            {t("organization:move.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
