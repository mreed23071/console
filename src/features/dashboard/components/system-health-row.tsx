import { useTranslation } from "react-i18next";

import { StatusPill } from "@/components/common/status-badge";
import { useHealth, useReadiness } from "@/features/system";

export function SystemHealthRow() {
  const { t } = useTranslation("dashboard");
  const health = useHealth();
  const readiness = useReadiness();

  return (
    <section aria-label={t("health.sectionLabel")} className="grid gap-3 sm:grid-cols-3">
      <StatusPill
        level={health.data?.status === "ok" ? "good" : "critical"}
        title={t("health.api")}
        detail={
          health.isLoading
            ? t("health.checking")
            : t("health.apiDetail", {
                version: health.data?.version ?? "",
                environment: health.data?.environment ?? "",
              })
        }
      />
      <StatusPill
        level={readiness.data?.database ? "good" : "critical"}
        title={t("health.database")}
        detail={readiness.data?.database ? t("health.databaseOk") : t("health.databaseFail")}
      />
      <StatusPill
        level={readiness.data?.embeddings ? "good" : "warning"}
        title={t("health.worker")}
        detail={readiness.data?.embeddings ? t("health.workerOk") : t("health.workerFail")}
      />
    </section>
  );
}
