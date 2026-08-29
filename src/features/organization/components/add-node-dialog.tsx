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
import { useCreateOrgNode } from "@/features/organization/api/mutations";
import { NodeFormFields } from "@/features/organization/components/node-form-fields";
import {
  NO_PARENT,
  nodeFormSchema,
  type NodeFormValues,
} from "@/features/organization/lib/schemas";
import type { OrgNode } from "@/lib/api/types";

const defaultValues = (parentId: string): NodeFormValues => ({
  name: "",
  subtitle: "",
  parentId,
});

export function AddNodeDialog({
  open,
  onOpenChange,
  nodes,
  defaultParentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: OrgNode[];
  defaultParentId: string | null;
}) {
  const { t } = useTranslation(["organization", "common"]);
  const create = useCreateOrgNode();
  const form = useForm<NodeFormValues>({
    resolver: zodResolver(nodeFormSchema(t)),
    defaultValues: defaultValues(defaultParentId ?? NO_PARENT),
  });

  // The dialog is opened from several places, each with its own idea of the
  // parent, and stays mounted across opens — re-seed on open rather than only
  // on mount.
  const seed = () => form.reset(defaultValues(defaultParentId ?? NO_PARENT));

  const onSubmit = form.handleSubmit((values) => {
    create.mutate(
      {
        name: values.name,
        subtitle: values.subtitle,
        parent_id: values.parentId === NO_PARENT ? null : values.parentId,
      },
      {
        onSuccess: (node) => {
          toast.success(t("organization:add.success", { name: node.name }));
          onOpenChange(false);
        },
        onError: () => toast.error(t("organization:add.error")),
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
          <DialogTitle>{t("organization:add.title")}</DialogTitle>
          <DialogDescription>{t("organization:add.description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit}>
            <NodeFormFields control={form.control} parentOptions={nodes} />
          </form>
        </Form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common:action.cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={create.isPending}>
            {create.isPending ? t("organization:add.pending") : t("organization:add.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
