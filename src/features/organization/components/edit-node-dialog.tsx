import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Form } from "@/components/ui/form";
import { useUpdateOrgNode } from "@/features/organization/api/mutations";
import { NodeFormFields } from "@/features/organization/components/node-form-fields";
import {
  NO_PARENT,
  nodeFormSchema,
  type NodeFormValues,
} from "@/features/organization/lib/schemas";
import type { OrgNode } from "@/lib/api/types";
import { eligibleParents } from "@/lib/org-tree";

const formValuesFor = (node: OrgNode): NodeFormValues => ({
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
  const form = useForm<NodeFormValues>({
    resolver: zodResolver(nodeFormSchema(t)),
    defaultValues: formValuesFor(node),
  });

  const seed = () => form.reset(formValuesFor(node));

  // Offering a node its own subtree would let the user build a cycle. The API
  // rejects one too; this keeps it from being presented as a valid choice.
  const parentOptions = eligibleParents(nodes, node.id);

  const onSubmit = form.handleSubmit((values) => {
    update.mutate(
      {
        id: node.id,
        patch: {
          name: values.name,
          subtitle: values.subtitle,
          parent_id: values.parentId === NO_PARENT ? null : values.parentId,
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
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) seed();
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("organization:edit.title")}</DialogTitle>
          <DialogDescription>{t("organization:edit.description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit}>
            <NodeFormFields control={form.control} parentOptions={parentOptions} />
          </form>
        </Form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common:action.cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={update.isPending}>
            {t("common:action.saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
