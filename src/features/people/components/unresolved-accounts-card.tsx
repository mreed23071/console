import { Link2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { usePlatformLabels } from "@/components/common/platform";
import { PlatformIcon } from "@/components/common/platform-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUnlinkedAccounts } from "@/features/people/api/accounts";

/**
 * Surfaces platform identities that ingestion could not attribute to anyone.
 * Renders nothing when the pool is empty, so the people list stays clean.
 */
export function UnresolvedAccountsCard({
  onLink,
}: {
  onLink: (account: { id: string; label: string }) => void;
}) {
  const { t } = useTranslation("people");
  const platformLabels = usePlatformLabels();
  const unlinked = useUnlinkedAccounts();

  if (!unlinked.isLoading && (unlinked.data ?? []).length === 0) return null;

  return (
    <Card className="mb-6 border-dashed">
      <CardHeader>
        <CardTitle className="text-base">{t("unresolved.title")}</CardTitle>
        <CardDescription>{t("unresolved.description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {unlinked.isLoading
          ? [0, 1].map((i) => <Skeleton key={i} className="h-14 w-full" />)
          : unlinked.data!.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border p-3">
                <PlatformIcon platform={a.platform} className="size-5 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.external_handle}</p>
                  <p className="tnum truncate text-xs text-muted-foreground">
                    {t("unresolved.messageCount", {
                      platform: platformLabels[a.platform],
                      count: a.message_count,
                    })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={() => onLink({ id: a.id, label: a.external_handle })}
                >
                  <Link2 className="size-4" /> {t("unresolved.link")}
                </Button>
              </div>
            ))}
      </CardContent>
    </Card>
  );
}
