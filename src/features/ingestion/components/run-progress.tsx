import { CheckCircle2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Progress } from "@/components/ui/progress";
import { RUN_STAGES, RUN_STEP_COUNT, stageIndex } from "@/features/ingestion/lib/run-level";
import type { RunProgress as RunProgressState } from "@/lib/api/types";

/**
 * Real pipeline progress, reported by the running workflow.
 *
 * This used to animate a timer through invented steps because the API had
 * nothing to say until a run finished. Every number here now comes from the
 * workflow itself.
 */
export function RunProgress({ progress }: { progress: RunProgressState }) {
  const { t } = useTranslation("ingestion");

  const current = stageIndex(progress.stage);
  // An unrecognised stage (the API grew one the console does not know yet)
  // should show as "just started" rather than crash or render as complete.
  const position = current < 0 ? 0 : current;

  return (
    <div className="mb-6 rounded-lg border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
          {progress.status === "queued"
            ? t("progress.queued")
            : t("progress.inProgress", { step: t(`step.${progress.stage}` as never) })}
        </p>
        <p className="tnum text-xs text-muted-foreground">
          {t("progress.stepOf", { current: position + 1, total: RUN_STEP_COUNT })}
        </p>
      </div>

      <Progress value={((position + 1) / RUN_STEP_COUNT) * 100} />

      <ul className="mt-3 flex flex-wrap gap-3 text-xs">
        {RUN_STAGES.map((stage, i) => (
          <li
            key={stage}
            className={
              i <= position ? "flex items-center gap-1 text-foreground" : "text-muted-foreground"
            }
          >
            {i < position && <CheckCircle2 className="size-3.5 text-status-good" />}
            {t(`step.${stage}` as never)}
          </li>
        ))}
      </ul>

      {progress.evaluated > 0 && (
        <p className="tnum mt-3 text-xs text-muted-foreground">
          {t("progress.counts", {
            filtered: progress.filtered,
            evaluated: progress.evaluated,
            embedded: progress.embedded,
          })}
        </p>
      )}
    </div>
  );
}
