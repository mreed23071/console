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
import { useCreateOrgNode } from "@/features/organization/api/mutations";
import {
  NO_PARENT,
  NodeFormFields,
  type NodeFormState,
} from "@/features/organization/components/node-form-fields";
import type { OrgNode } from "@/lib/api/types";

const emptyForm = (parentId: string): NodeFormState => ({ name: "", subtitle: "", parentId });

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
  const [form, setForm] = useState<NodeFormState>(() => emptyForm(defaultParentId ?? NO_PARENT));

  // The dialog is opened from several places, each with its own idea of the
  // parent, so re-seed on open rather than only on mount.
  useEffect(() => {
    if (open) setForm(emptyForm(defaultParentId ?? NO_PARENT));
  }, [open, defaultParentId]);

  const name = form.name.trim();

  const submit = () => {
    if (!name) return;
    create.mutate(
      {
        name,
        subtitle: form.subtitle.trim(),
        parent_id: form.parentId === NO_PARENT ? null : form.parentId,
      },
      {
        onSuccess: (node) => {
          toast.success(t("organization:add.success", { name: node.name }));
          onOpenChange(false);
        },
        onError: () => toast.error(t("organization:add.error")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("organization:add.title")}</DialogTitle>
          <DialogDescription>{t("organization:add.description")}</DialogDescription>
        </DialogHeader>

        <NodeFormFields
          idPrefix="org-add"
          value={form}
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          parentOptions={nodes}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common:action.cancel")}
          </Button>
          <Button onClick={submit} disabled={!name || create.isPending}>
            {create.isPending ? t("organization:add.pending") : t("organization:add.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
