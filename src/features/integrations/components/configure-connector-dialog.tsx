import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { usePlatformLabels } from "@/components/common/platform";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Connector } from "@/lib/api/types";

export function ConfigureConnectorDialog({
  connector,
  onOpenChange,
}: {
  connector: Connector | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation(["integrations", "common"]);
  const platformLabels = usePlatformLabels();

  return (
    <Dialog open={connector !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("integrations:configure.title", {
              platform: connector ? platformLabels[connector.platform] : "",
            })}
          </DialogTitle>
          <DialogDescription>{t("integrations:configure.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace">{t("integrations:configure.workspaceLabel")}</Label>
            <Input id="workspace" defaultValue="mabinsoft" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="poll">{t("integrations:configure.pollLabel")}</Label>
            <Input id="poll" type="number" defaultValue={15} className="tnum" />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">{t("integrations:configure.backfillTitle")}</p>
              <p className="text-xs text-muted-foreground">
                {t("integrations:configure.backfillDescription")}
              </p>
            </div>
            <Switch />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common:action.cancel")}
          </Button>
          <Button
            onClick={() => {
              toast.success(t("integrations:configure.saved"));
              onOpenChange(false);
            }}
          >
            {t("common:action.saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
