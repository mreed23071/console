import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PlatformBadge } from "@/components/common/platform-icon";
import type { ActiveRun } from "@/lib/api/types";

/**
 * Runs currently in flight, read live from Temporal. Sits above the history
 * table on the Runs page because a run only earns a row there once
 * `record_run` fires at the very end - without this, a run in progress is
 * invisible on the one page meant to be the "one stop shop" for it.
 */
export function ActiveRunsList({
  runs,
  onSelect,
}: {
  runs: ActiveRun[];
  onSelect: (run: ActiveRun) => void;
}) {
  const { t } = useTranslation("ingestion");

  if (runs.length === 0) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-lg border">
      <p className="border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
        {t("activeList.title")}
      </p>
      <ul className="divide-y">
        {runs.map((run) => (
          <li key={run.run_id}>
            <button
              type="button"
              onClick={() => onSelect(run)}
              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/50"
            >
              <span className="flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden />
                {run.platform && <PlatformBadge platform={run.platform} />}
                <span className="tnum text-xs text-muted-foreground">{run.run_id}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {t(`step.${run.stage}` as never, { defaultValue: run.stage })}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
