import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { DataTable } from "@/components/common/data-table";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/layout/page-header";
import {
  RunDetailSheet,
  RunProgress,
  TriggerRunButton,
  useIngestionRuns,
  useRunColumnLabels,
  useRunColumns,
  useSimulatedRun,
} from "@/features/ingestion";
import type { IngestionRun } from "@/lib/api/types";
import { i18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/runs")({
  head: () => ({
    meta: [
      { title: i18n.t("ingestion:meta.title") },
      { name: "description", content: i18n.t("ingestion:meta.description") },
      { property: "og:title", content: i18n.t("ingestion:meta.title") },
      { property: "og:description", content: i18n.t("ingestion:meta.ogDescription") },
    ],
  }),
  component: RunsPage,
});

function RunsPage() {
  const { t } = useTranslation("ingestion");
  const runs = useIngestionRuns();
  const columns = useRunColumns();
  const columnLabels = useRunColumnLabels();

  const [selected, setSelected] = useState<IngestionRun | null>(null);
  const [step, setStep] = useState<number | null>(null);

  useSimulatedRun(step, setStep);

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<TriggerRunButton running={step !== null} onStart={() => setStep(0)} />}
      />

      {step !== null && <RunProgress step={step} />}

      {runs.isError ? (
        <ErrorState onRetry={() => runs.refetch()} />
      ) : (
        <DataTable
          columns={columns}
          columnLabels={columnLabels}
          data={runs.data ?? []}
          isLoading={runs.isLoading}
          searchPlaceholder={t("searchPlaceholder")}
          onRowClick={(row) => setSelected(row.original)}
          emptyTitle={t("emptyTitle")}
          emptyDescription={t("emptyDescription")}
        />
      )}

      <RunDetailSheet run={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}
