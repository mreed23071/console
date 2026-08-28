import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { runLevel, useIngestionRuns } from "@/features/ingestion";

const VISIBLE_RUNS = 5;

export function RecentRunsCard() {
  const { t } = useTranslation(["dashboard", "ingestion"]);
  const runs = useIngestionRuns();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{t("dashboard:recentRuns.title")}</CardTitle>
          <CardDescription>{t("dashboard:recentRuns.description")}</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/runs">{t("dashboard:recentRuns.allRuns")}</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {runs.isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
          : (runs.data ?? []).slice(0, VISIBLE_RUNS).map((run) => (
              <div
                key={run.run_id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge
                    level={runLevel(run.status, run.filter_errors)}
                    label={t(`ingestion:status.${run.status}` as never)}
                  />
                  <span className="tnum text-sm font-medium">{run.run_id}</span>
                </div>
                <p className="tnum text-xs text-muted-foreground">
                  {new Date(run.started_at).toLocaleString()} ·{" "}
                  {t("dashboard:recentRuns.counts", {
                    retained: run.retained,
                    fetched: run.fetched,
                  })}
                </p>
              </div>
            ))}
      </CardContent>
    </Card>
  );
}
