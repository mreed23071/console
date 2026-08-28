import { createFileRoute } from "@tanstack/react-router";
import { MessageSquareText, PlugZap, Users, Waves } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { StatusBadge } from "@/components/common/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  CategoryChartCard,
  ChartDataTables,
  RecentRunsCard,
  StatTile,
  SystemHealthRow,
  useCategoryData,
  useVolumeData,
  VolumeChartCard,
} from "@/features/dashboard";
import { runLevel, useIngestionRuns } from "@/features/ingestion";
import { useConnectors } from "@/features/integrations";
import { useMessages } from "@/features/messages";
import { usePeople } from "@/features/people";
import { MAX_PAGE_SIZE } from "@/lib/api/types";
import { i18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: i18n.t("dashboard:meta.title") },
      { name: "description", content: i18n.t("dashboard:meta.description") },
      { property: "og:title", content: i18n.t("dashboard:meta.title") },
      { property: "og:description", content: i18n.t("dashboard:meta.ogDescription") },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useTranslation(["dashboard", "ingestion"]);
  const people = usePeople();
  // The dashboard's charts and stat tiles want a recent window to summarise,
  // not a page to browse - the largest single page the API allows, rather
  // than the message browser's smaller default page size.
  const messages = useMessages({}, { limit: MAX_PAGE_SIZE, offset: 0 });
  const runs = useIngestionRuns();
  const connectors = useConnectors();
  const [showTables, setShowTables] = useState(false);

  const categoryData = useCategoryData(messages.data?.items);
  const volumeData = useVolumeData(messages.data?.items);

  const lastRun = runs.data?.[0];
  const activeConnectors = (connectors.data ?? []).filter((c) => c.status === "connected").length;
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = (messages.data?.items ?? []).filter(
    (m) => m.sent_at.slice(0, 10) === today,
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader title={t("dashboard:title")} description={t("dashboard:description")} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label={t("dashboard:stat.people")}
          value={String(people.data?.length ?? 0)}
          icon={Users}
          loading={people.isLoading}
          hint={t("dashboard:stat.peopleHint")}
        />
        <StatTile
          label={t("dashboard:stat.messagesToday")}
          value={String(todayCount)}
          icon={MessageSquareText}
          loading={messages.isLoading}
          hint={t("dashboard:stat.messagesHint", { count: messages.data?.total ?? 0 })}
        />
        <StatTile
          label={t("dashboard:stat.connectors")}
          value={`${activeConnectors}/${connectors.data?.length ?? 0}`}
          icon={PlugZap}
          loading={connectors.isLoading}
          hint={t("dashboard:stat.connectorsHint")}
        />
        <StatTile
          label={t("dashboard:stat.lastRun")}
          icon={Waves}
          loading={runs.isLoading || !lastRun}
        >
          {lastRun && (
            <>
              <StatusBadge
                level={runLevel(lastRun.status, lastRun.filter_errors)}
                label={t(`ingestion:status.${lastRun.status}` as never)}
              />
              <p className="tnum text-xs text-muted-foreground">
                {t("dashboard:stat.lastRunDetail", {
                  runId: lastRun.run_id,
                  count: lastRun.persisted,
                })}
              </p>
            </>
          )}
        </StatTile>
      </div>

      <SystemHealthRow />

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryChartCard
          data={categoryData}
          isLoading={messages.isLoading}
          isError={messages.isError}
          onRetry={() => messages.refetch()}
        />
        <VolumeChartCard
          data={volumeData}
          isLoading={messages.isLoading}
          isError={messages.isError}
          onRetry={() => messages.refetch()}
        />
      </div>

      <Button variant="link" className="px-0" onClick={() => setShowTables((s) => !s)}>
        {showTables ? t("dashboard:chart.hideTables") : t("dashboard:chart.showTables")}
      </Button>

      {showTables && <ChartDataTables categories={categoryData} volume={volumeData} />}

      <RecentRunsCard />
    </div>
  );
}
