import { Loader2, Play } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHasScope } from "@/features/auth";

export function TriggerRunButton({ running, onStart }: { running: boolean; onStart: () => void }) {
  const { t } = useTranslation("ingestion");
  const canRun = useHasScope("runs:write");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* A disabled button emits no pointer events, so the tooltip needs a
            wrapper to hang off — otherwise the explanation for *why* it is
            disabled never appears. */}
        <span>
          <Button disabled={!canRun || running} onClick={onStart}>
            {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            {t("trigger.action")}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{canRun ? t("trigger.allowed") : t("trigger.denied")}</TooltipContent>
    </Tooltip>
  );
}
