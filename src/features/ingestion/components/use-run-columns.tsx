import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { StatusBadge } from "@/components/common/status-badge";
import type { AnyColumnDef } from "@/components/common/table-types";
import { Badge } from "@/components/ui/badge";
import { runLevel } from "@/features/ingestion/lib/run-level";
import type { IngestionRun } from "@/lib/api/types";
export function useRunColumns(): AnyColumnDef<IngestionRun>[] {
  const { t } = useTranslation("ingestion");

  return useMemo(() => {
    const numeric = (key: keyof IngestionRun, header: string): AnyColumnDef<IngestionRun> => ({
      accessorKey: key,
      header,
      cell: ({ getValue }) => <span className="tnum">{getValue<number>()}</span>,
    });

    return [
      {
        accessorKey: "run_id",
        header: t("column.run"),
        cell: ({ getValue }) => <span className="tnum font-medium">{getValue<string>()}</span>,
      },
      {
        accessorKey: "status",
        header: t("column.status"),
        cell: ({ row }) => (
          <StatusBadge
            level={runLevel(row.original.status, row.original.filter_errors)}
            label={t(`status.${row.original.status}` as never)}
          />
        ),
      },
      {
        accessorKey: "started_at",
        header: t("column.started"),
        cell: ({ getValue }) => (
          <span className="tnum text-sm">{new Date(getValue<string>()).toLocaleString()}</span>
        ),
      },
      {
        accessorKey: "duration_ms",
        header: t("column.duration"),
        cell: ({ getValue }) => (
          <span className="tnum">{(getValue<number>() / 1000).toFixed(1)}s</span>
        ),
      },
      numeric("fetched", t("column.fetched")),
      numeric("retained", t("column.retained")),
      numeric("discarded", t("column.discarded")),
      numeric("embedded", t("column.embedded")),
      numeric("persisted", t("column.persisted")),
      {
        accessorKey: "filter_errors",
        header: t("column.filterErrors"),
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return v > 0 ? (
            <StatusBadge level="warning" label={t("detail.errorCount", { count: v })} />
          ) : (
            <span className="tnum text-muted-foreground">0</span>
          );
        },
      },
      {
        accessorKey: "dry_run",
        header: t("column.dryRun"),
        cell: ({ getValue }) =>
          getValue<boolean>() ? (
            <Badge variant="outline">{t("detail.dryRun")}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ];
  }, [t]);
}

export function useRunColumnLabels(): Record<string, string> {
  const { t } = useTranslation("ingestion");
  return {
    run_id: t("column.run"),
    status: t("column.status"),
    started_at: t("column.started"),
    duration_ms: t("column.duration"),
    fetched: t("column.fetched"),
    retained: t("column.retained"),
    discarded: t("column.discarded"),
    embedded: t("column.embedded"),
    persisted: t("column.persisted"),
    filter_errors: t("column.filterErrors"),
    dry_run: t("column.dryRun"),
  };
}
