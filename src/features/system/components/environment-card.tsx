import { useTranslation } from "react-i18next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealth, useReadiness } from "@/features/system/api/queries";

export function EnvironmentCard() {
  const { t } = useTranslation("system");
  const health = useHealth();
  const readiness = useReadiness();

  const rows: Array<[string, string | undefined]> = [
    [t("environment.status"), health.data?.status],
    [t("environment.version"), health.data?.version],
    [t("environment.environment"), health.data?.environment],
    [t("environment.readiness"), readiness.data?.status],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("environment.title")}</CardTitle>
        <CardDescription>{t("environment.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {health.isLoading || readiness.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <dl className="grid gap-3 sm:grid-cols-4">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
