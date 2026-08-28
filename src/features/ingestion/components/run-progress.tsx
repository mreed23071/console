import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Progress } from "@/components/ui/progress";
import { RUN_STEP_COUNT, RUN_STEP_KEYS } from "@/features/ingestion/lib/run-level";

/** Simulated pipeline progress shown while a triggered run is in flight. */
export function RunProgress({ step }: { step: number }) {
  const { t } = useTranslation("ingestion");

  return (
    <div className="mb-6 rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">
          {t("progress.inProgress", { step: t(RUN_STEP_KEYS[step]! as never) })}
        </p>
        <p className="tnum text-xs text-muted-foreground">
          {t("progress.stepOf", { current: step + 1, total: RUN_STEP_COUNT })}
        </p>
      </div>

      <Progress value={((step + 1) / RUN_STEP_COUNT) * 100} />

      <ul className="mt-3 flex flex-wrap gap-3 text-xs">
        {RUN_STEP_KEYS.map((key, i) => (
          <li
            key={key}
            className={
              i <= step ? "flex items-center gap-1 text-foreground" : "text-muted-foreground"
            }
          >
            {i < step && <CheckCircle2 className="size-3.5 text-status-good" />}
            {t(key as never)}
          </li>
        ))}
      </ul>
    </div>
  );
}
