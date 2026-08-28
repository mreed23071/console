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
import { useDeleteOrgNode } from "@/features/organization/api/mutations";
import type { OrgNode } from "@/lib/api/types";

export function DeleteNodeDialog({
  open,
  onOpenChange,
  node,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: OrgNode;
  onDeleted: () => void;
}) {
  const { t } = useTranslation(["organization", "common"]);
  const remove = useDeleteOrgNode();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("organization:delete.title", { name: node.name })}</AlertDialogTitle>
          <AlertDialogDescription>{t("organization:delete.description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common:action.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              remove.mutate(node.id, {
                onSuccess: ({ promoted }) => {
                  // Saying how many sub-departments moved makes the
                  // promote-don't-cascade behaviour visible after the fact.
                  toast.success(
                    promoted > 0
                      ? t("organization:delete.successPromoted", {
                          name: node.name,
                          count: promoted,
                        })
                      : t("organization:delete.success", { name: node.name }),
                  );
                  onDeleted();
                },
                onError: () => toast.error(t("organization:delete.error")),
              })
            }
          >
            {t("organization:delete.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
