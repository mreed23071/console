import { useTranslation } from "react-i18next";

import { CategoryBadge } from "@/components/common/category-badge";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { runLevel } from "@/features/ingestion/lib/run-level";
import type { IngestionRun } from "@/lib/api/types";

export function RunDetailSheet({
  run,
  onOpenChange,
}: {
  run: IngestionRun | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation("ingestion");

  const counters: Array<[string, number]> = run
    ? [
        [t("column.fetched"), run.fetched],
        [t("detail.alreadyIngested"), run.already_ingested],
        [t("detail.evaluated"), run.evaluated],
        [t("column.retained"), run.retained],
        [t("column.discarded"), run.discarded],
        [t("column.embedded"), run.embedded],
        [t("column.persisted"), run.persisted],
        [t("detail.usersProvisioned"), run.users_provisioned],
        [t("column.filterErrors"), run.filter_errors],
      ]
    : [];

  return (
    <Sheet open={run !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="tnum">{run?.run_id}</SheetTitle>
          <SheetDescription>
            {run && `${run.filter_provider} · ${run.embedding_model}`}
          </SheetDescription>
        </SheetHeader>

        {run && (
          <div className="space-y-5 overflow-y-auto px-4 pb-6">
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                level={runLevel(run.status, run.filter_errors)}
                label={t(`status.${run.status}` as never)}
              />
              {run.dry_run && <Badge variant="outline">{t("detail.dryRun")}</Badge>}
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {counters.map(([label, value]) => (
                <div key={label} className="rounded-lg border p-2.5">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="tnum text-lg font-semibold">{value}</dd>
                </div>
              ))}
            </dl>

            <div>
              <h3 className="mb-2 text-sm font-semibold">{t("detail.decisionsTitle")}</h3>
              <ScrollArea className="h-80 rounded-lg border">
                <ul className="divide-y">
                  {run.decisions.map((d, i) => (
                    <li key={`${d.id}-${i}`} className="space-y-1 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="tnum text-xs text-muted-foreground">{d.id}</span>
                        <CategoryBadge category={d.category} />
                        <StatusBadge
                          level={d.keep ? "good" : "serious"}
                          label={d.keep ? t("detail.kept") : t("detail.discarded")}
                          className="ml-auto"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{d.reason}</p>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
