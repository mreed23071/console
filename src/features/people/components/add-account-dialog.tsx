import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { PLATFORMS, usePlatformLabels } from "@/components/common/platform";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAccount } from "@/features/people/api/accounts";
import { FormField } from "@/features/people/components/form-field";
import type { Platform } from "@/lib/api/types";

/** Manually attaches a brand-new platform identity to a person. */
export function AddAccountDialog({
  userId,
  open,
  onOpenChange,
}: {
  userId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useTranslation(["people", "common"]);
  const platformLabels = usePlatformLabels();
  const create = useCreateAccount();
  const [platform, setPlatform] = useState<Platform>("github");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("people:dialog.addAccount.title")}</DialogTitle>
          <DialogDescription>{t("people:dialog.addAccount.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <FormField id="aa-platform" label={t("people:field.platform")}>
            <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
              <SelectTrigger id="aa-platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {platformLabels[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField id="aa-handle" label={t("people:dialog.addAccount.handleLabel")}>
            <Input
              id="aa-handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder={t("people:dialog.addAccount.handlePlaceholder")}
            />
          </FormField>
          <FormField id="aa-email" label={t("people:dialog.addAccount.emailLabel")}>
            <Input id="aa-email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common:action.cancel")}
          </Button>
          <Button
            disabled={!handle.trim() || create.isPending}
            onClick={() =>
              create.mutate(
                { user_id: userId, platform, external_handle: handle, external_email: email },
                {
                  onSuccess: () => {
                    toast.success(t("people:dialog.addAccount.success"));
                    setHandle("");
                    setEmail("");
                    onOpenChange(false);
                  },
                  onError: () => toast.error(t("people:dialog.addAccount.error")),
                },
              )
            }
          >
            {create.isPending && <Loader2 className="size-4 animate-spin" />}{" "}
            {t("people:dialog.addAccount.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
