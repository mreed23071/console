import { Loader2, Play, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { usePlatformLabels } from "@/components/common/platform";
import { PlatformIcon } from "@/components/common/platform-icon";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHasScope } from "@/features/auth";
import { useTriggerIngestionRun } from "@/features/ingestion";
import { CONNECTOR_STATUS } from "@/features/integrations/lib/connector-status";
import type { Connector } from "@/lib/api/types";

export function ConnectorCard({
  connector,
  onConfigure,
}: {
  connector: Connector;
  onConfigure: (c: Connector) => void;
}) {
  const { t } = useTranslation("integrations");
  const platformLabels = usePlatformLabels();
  const trigger = useTriggerIngestionRun();
  const canRun = useHasScope("runs:write");

  const status = CONNECTOR_STATUS[connector.status];
  const platformName = platformLabels[connector.platform];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PlatformIcon platform={connector.platform} className="size-5 text-muted-foreground" />
          <CardTitle className="text-base">{platformName}</CardTitle>
          <StatusBadge
            level={status.level}
            label={t(status.labelKey as never)}
            className="ml-auto"
          />
        </div>
        <CardDescription>
          {t("card.linkedAccounts", { count: connector.account_count })}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">{t("card.lastSync")}</dt>
            <dd className="tnum">
              {connector.last_sync_at ? new Date(connector.last_sync_at).toLocaleTimeString() : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t("card.messages")}</dt>
            <dd className="tnum">{connector.messages_contributed}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onConfigure(connector)}>
            <Settings2 className="size-4" /> {t("card.configure")}
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  size="sm"
                  disabled={!canRun || trigger.isPending}
                  onClick={() =>
                    trigger.mutate(
                      {},
                      {
                        onSuccess: (run) =>
                          toast.success(
                            t("card.runSuccess", {
                              runId: run.run_id,
                              platform: platformName,
                            }),
                          ),
                        onError: () => toast.error(t("card.runError")),
                      },
                    )
                  }
                >
                  {trigger.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Play className="size-4" />
                  )}
                  {t("card.runNow")}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{canRun ? t("card.runAllowed") : t("card.runDenied")}</TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}
