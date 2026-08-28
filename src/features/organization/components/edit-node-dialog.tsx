import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateOrgNode } from "@/features/organization/api/mutations";
import {
  NO_PARENT,
  NodeFormFields,
  type NodeFormState,
} from "@/features/organization/components/node-form-fields";
import type { OrgNode } from "@/lib/api/types";
import { eligibleParents } from "@/lib/org-tree";

const formFor = (node: OrgNode): NodeFormState => ({
  name: node.name,
  subtitle: node.subtitle,
  parentId: node.parent_id ?? NO_PARENT,
});

/**
 * Renaming and re-parenting. Changing "Reports to" here is what moves a branch
 * of the hierarchy — the role drag-and-drop would otherwise play.
 */
export function EditNodeDialog({
  open,
  onOpenChange,
  node,
  nodes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: OrgNode;
  nodes: OrgNode[];
}) {
  const { t } = useTranslation(["organization", "common"]);
  const update = useUpdateOrgNode();
  const [form, setForm] = useState<NodeFormState>(() => formFor(node));

  useEffect(() => {
    if (open) setForm(formFor(node));
  }, [open, node]);

  const name = form.name.trim();

  // Offering a node its own subtree would let the user build a cycle. The API
  // rejects one too; this keeps it from being presented as a valid choice.
  const parentOptions = eligibleParents(nodes, node.id);

  const submit = () => {
    if (!name) return;
    update.mutate(
      {
        id: node.id,
        patch: {
          name,
          subtitle: form.subtitle.trim(),
          parent_id: form.parentId === NO_PARENT ? null : form.parentId,
        },
      },
      {
        onSuccess: (updated) => {
          toast.success(t("organization:edit.success", { name: updated.name }));
          onOpenChange(false);
        },
        onError: () => toast.error(t("organization:edit.error")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("organization:edit.title")}</DialogTitle>
          <DialogDescription>{t("organization:edit.description")}</DialogDescription>
        </DialogHeader>

        <NodeFormFields
          idPrefix="org-edit"
          value={form}
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          parentOptions={parentOptions}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common:action.cancel")}
          </Button>
          <Button onClick={submit} disabled={!name || update.isPending}>
            {t("common:action.saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
