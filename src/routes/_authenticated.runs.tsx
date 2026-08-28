import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { DataTable } from "@/components/common/data-table";
import { ErrorState } from "@/components/common/error-state";
import { usePlatformLabels } from "@/components/common/platform";
import { PageHeader } from "@/components/layout/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RunDetailSheet,
  RunProgress,
  TriggerRunButton,
  useIngestionRuns,
  useRunColumnLabels,
  useRunColumns,
  useSimulatedRun,
} from "@/features/ingestion";
import type { IngestionRun, Platform } from "@/lib/api/types";
import { i18n } from "@/lib/i18n";

//: Mirrors the backend's connector registry - only these three platforms
//: have a mock source wired up, so triggering any other would just 404.
const TRIGGERABLE_PLATFORMS: Platform[] = ["slack", "github", "teams"];

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
  const platformLabels = usePlatformLabels();
  const runs = useIngestionRuns();
  const columns = useRunColumns();
  const columnLabels = useRunColumnLabels();

  const [selected, setSelected] = useState<IngestionRun | null>(null);
  const [step, setStep] = useState<number | null>(null);
  const [triggerPlatform, setTriggerPlatform] = useState<Platform>("slack");

  useSimulatedRun(step, setStep, triggerPlatform);

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={triggerPlatform}
              onValueChange={(v) => setTriggerPlatform(v as Platform)}
              disabled={step !== null}
            >
              <SelectTrigger className="w-[140px]" aria-label={t("column.platform")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGERABLE_PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {platformLabels[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <TriggerRunButton running={step !== null} onStart={() => setStep(0)} />
          </div>
        }
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
