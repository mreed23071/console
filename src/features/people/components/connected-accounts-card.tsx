import { Plus, Trash2, Unlink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { usePlatformLabels } from "@/components/common/platform";
import { PlatformIcon } from "@/components/common/platform-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteAccount, useUnlinkAccount } from "@/features/people/api/accounts";
import { usePersonAccounts } from "@/features/people/api/queries";

export function ConnectedAccountsCard({
  personId,
  onAddAccount,
}: {
  personId: string;
  onAddAccount: () => void;
}) {
  const { t } = useTranslation("people");
  const platformLabels = usePlatformLabels();
  const accounts = usePersonAccounts(personId);
  const unlink = useUnlinkAccount();
  const removeAccount = useDeleteAccount();

  return (
    <Card className="lg:col-span-1">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base">{t("accounts.title")}</CardTitle>
          <CardDescription>{t("accounts.description")}</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onAddAccount}>
          <Plus className="size-4" /> {t("accounts.add")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {accounts.isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : (accounts.data ?? []).length === 0 ? (
          <EmptyState
            title={t("accounts.emptyTitle")}
            description={t("accounts.emptyDescription")}
          />
        ) : (
          accounts.data!.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg border p-3">
              <PlatformIcon platform={a.platform} className="size-5 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{platformLabels[a.platform]}</p>
                <p className="truncate text-xs text-muted-foreground">{a.external_handle}</p>
              </div>
              <div className="ml-auto flex items-center gap-1">
                {a.is_primary && (
                  <Badge variant="outline" className="text-xs">
                    {t("accounts.primary")}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  title={t("accounts.unlinkTooltip")}
                  aria-label={t("accounts.unlinkTooltip")}
                  disabled={unlink.isPending}
                  onClick={() =>
                    unlink.mutate(a.id, {
                      onSuccess: () => toast.success(t("accounts.unlinkSuccess")),
                      onError: () => toast.error(t("accounts.unlinkError")),
                    })
                  }
                >
                  <Unlink className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  title={t("accounts.removeTooltip")}
                  aria-label={t("accounts.removeTooltip")}
                  disabled={removeAccount.isPending}
                  onClick={() =>
                    removeAccount.mutate(a.id, {
                      onSuccess: (r) =>
                        toast.success(t("accounts.removeSuccess", { count: r.deleted_messages })),
                      onError: () => toast.error(t("accounts.removeError")),
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
