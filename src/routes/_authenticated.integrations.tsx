import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { CardSkeleton } from "@/components/common/card-skeleton";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { ConfigureConnectorDialog, ConnectorCard, useConnectors } from "@/features/integrations";
import type { Connector } from "@/lib/api/types";
import { i18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => ({
    meta: [
      { title: i18n.t("integrations:meta.title") },
      { name: "description", content: i18n.t("integrations:meta.description") },
      { property: "og:title", content: i18n.t("integrations:meta.title") },
      { property: "og:description", content: i18n.t("integrations:meta.ogDescription") },
    ],
  }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const { t } = useTranslation("integrations");
  const connectors = useConnectors();
  const [configuring, setConfiguring] = useState<Connector | null>(null);

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />

      {connectors.isError ? (
        <ErrorState onRetry={() => connectors.refetch()} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {connectors.isLoading
            ? Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
            : connectors.data!.map((c) => (
                <ConnectorCard key={c.platform} connector={c} onConfigure={setConfiguring} />
              ))}
        </div>
      )}

      <ConfigureConnectorDialog
        connector={configuring}
        onOpenChange={(o) => !o && setConfiguring(null)}
      />
    </div>
  );
}
