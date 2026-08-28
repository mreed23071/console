import { GitCommitHorizontal } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { CardSkeleton } from "@/components/common/card-skeleton";
import { CategoryBadge } from "@/components/common/category-badge";
import { EmptyState } from "@/components/common/empty-state";
import { PlatformIcon } from "@/components/common/platform-icon";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CommitDialog } from "@/features/messages";
import { usePersonMessages } from "@/features/people/api/queries";
import type { Message } from "@/lib/api/types";

const VISIBLE_COUNT = 12;

export function PersonActivityCard({ personId }: { personId: string }) {
  const { t } = useTranslation("people");
  const messages = usePersonMessages(personId);
  const [activeCommit, setActiveCommit] = useState<Message | null>(null);

  if (messages.isLoading) return <CardSkeleton lines={5} />;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("activity.title")}</CardTitle>
          <CardDescription>{t("activity.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(messages.data ?? []).length === 0 ? (
            <EmptyState
              title={t("activity.emptyTitle")}
              description={t("activity.emptyDescription")}
            />
          ) : (
            messages.data!.slice(0, VISIBLE_COUNT).map((m) => (
              <div key={m.id} className="rounded-lg border p-3">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <PlatformIcon platform={m.platform} className="size-4 text-muted-foreground" />
                  <CategoryBadge category={m.filter_category} />
                  <span className="tnum ml-auto text-xs text-muted-foreground">
                    {new Date(m.sent_at).toLocaleString()}
                  </span>
                </div>
                {m.kind === "commit" && m.commit ? (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setActiveCommit(m)}
                      className="flex items-start gap-1.5 text-left text-sm font-medium text-primary hover:underline"
                    >
                      <GitCommitHorizontal className="mt-0.5 size-3.5 shrink-0" />
                      {m.content}
                    </button>
                    <p className="tnum text-xs text-muted-foreground">
                      {t("activity.commitMeta", {
                        repository: m.commit.repository,
                        count: m.commit.files.length,
                        additions: m.commit.additions,
                        deletions: m.commit.deletions,
                      })}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm">{m.content}</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <CommitDialog
        message={activeCommit}
        open={activeCommit !== null}
        onOpenChange={(o) => !o && setActiveCommit(null)}
      />
    </>
  );
}
