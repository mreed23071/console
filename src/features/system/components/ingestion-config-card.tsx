import { useTranslation } from "react-i18next";

import { ErrorState } from "@/components/common/error-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHasScope } from "@/features/auth";
import { useIngestionConfig } from "@/features/ingestion";
import type { Platform } from "@/lib/api/types";

/**
 * Settings are effectively global today (prompt, model, embedder) - only the
 * connector varies by platform - so any registered platform is a fair
 * representative to show here rather than adding a picker for one field.
 */
export function IngestionConfigCard({ platform = "slack" }: { platform?: Platform }) {
  const { t } = useTranslation("system");
  const config = useIngestionConfig(platform);
  const canView = useHasScope("config:read");

  const rows = config.data
    ? ([
        [t("config.llmProvider"), config.data.llm_provider],
        [t("config.embeddingModel"), config.data.embedding_model],
        [t("config.embeddingDim"), String(config.data.embedding_dim)],
        [t("config.executor"), config.data.embedding_executor],
        [t("config.workers"), String(config.data.embedding_workers)],
      ] as const)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("config.title")}</CardTitle>
        <CardDescription>{t("config.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {!canView ? (
          <p className="text-sm text-muted-foreground">{t("config.denied")}</p>
        ) : config.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : config.isError ? (
          <ErrorState onRetry={() => config.refetch()} />
        ) : (
          <div className="space-y-4">
            <dl className="grid gap-3 sm:grid-cols-3">
              {rows.map(([label, value]) => (
                <div key={label} className="rounded-lg border p-3">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="tnum text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">{t("config.filterPrompt")}</p>
              <pre className="overflow-x-auto rounded-lg border bg-muted p-3 text-xs whitespace-pre-wrap">
                {config.data!.filter_system_prompt}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
