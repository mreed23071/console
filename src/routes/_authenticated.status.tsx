import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ErrorState } from "@/components/common/error-state";
import { StatusPill } from "@/components/common/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { EnvironmentCard, IngestionConfigCard, useHealth, useReadiness } from "@/features/system";
import { i18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/status")({
  head: () => ({
    meta: [
      { title: i18n.t("system:meta.title") },
      { name: "description", content: i18n.t("system:meta.description") },
      { property: "og:title", content: i18n.t("system:meta.title") },
      { property: "og:description", content: i18n.t("system:meta.ogDescription") },
    ],
  }),
  component: StatusPage,
});

function StatusPage() {
  const { t } = useTranslation("system");
  const health = useHealth();
  const readiness = useReadiness();
  const checkedAt = new Date().toLocaleTimeString();

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      {health.isError || readiness.isError ? (
        <ErrorState
          onRetry={() => {
            health.refetch();
            readiness.refetch();
          }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatusPill
            level={health.data?.status === "ok" ? "good" : "critical"}
            title={t("pill.api")}
            detail={
              health.isLoading ? t("pill.checking") : t("pill.apiDetail", { time: checkedAt })
            }
          />
          <StatusPill
            level={readiness.data?.database ? "good" : "critical"}
            title={t("pill.database")}
            detail={
              readiness.isLoading
                ? t("pill.checking")
                : t("pill.databaseDetail", { time: checkedAt })
            }
          />
          <StatusPill
            level={readiness.data?.embeddings ? "good" : "warning"}
            title={t("pill.worker")}
            detail={
              readiness.isLoading ? t("pill.checking") : t("pill.workerDetail", { time: checkedAt })
            }
          />
        </div>
      )}

      <EnvironmentCard />
      <IngestionConfigCard />
    </div>
  );
}
