import { Link } from "@tanstack/react-router";
import { GitCommitHorizontal } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { CategoryBadge } from "@/components/common/category-badge";
import { usePlatformLabels } from "@/components/common/platform";
import { PlatformIcon } from "@/components/common/platform-icon";
import type { AnyColumnDef } from "@/components/common/table-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExpandableContent } from "@/features/messages/components/expandable-content";
import type { ConnectedAccount, Message } from "@/lib/api/types";

export interface MessageColumnHandlers {
  /** Names keyed by person id, for resolving the sender column. */
  nameById: Map<string, string>;
  /** Unresolved accounts keyed by account id, so a sender can be linked inline. */
  accountsById: Map<string, ConnectedAccount>;
  onOpenCommit: (message: Message) => void;
  onLinkAccount: (account: ConnectedAccount) => void;
}
export function useMessageColumns(h: MessageColumnHandlers): AnyColumnDef<Message>[] {
  const { t } = useTranslation("messages");
  const platformLabels = usePlatformLabels();
  const { nameById, accountsById, onOpenCommit, onLinkAccount } = h;

  return useMemo(
    () => [
      {
        accessorKey: "platform",
        header: t("column.platform"),
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5 text-sm">
            <PlatformIcon
              platform={row.original.platform}
              className="size-4 text-muted-foreground"
            />
            {platformLabels[row.original.platform]}
          </span>
        ),
      },
      {
        id: "sender",
        header: t("column.sender"),
        accessorFn: (m) =>
          m.sender_user_id
            ? (nameById.get(m.sender_user_id) ?? m.sender_user_id)
            : t("sender.unresolvedValue"),
        cell: ({ row }) => {
          const senderId = row.original.sender_user_id;
          const account = accountsById.get(row.original.sender_relation_id);

          if (!senderId) {
            return (
              <Button
                variant="link"
                className="h-auto p-0 text-sm text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  if (account) onLinkAccount(account);
                }}
                disabled={!account}
                title={account ? t("sender.linkTooltip") : t("sender.unavailableTooltip")}
              >
                {t("sender.unresolved")}
              </Button>
            );
          }

          return (
            <Link
              to="/people/$id"
              params={{ id: senderId }}
              className="font-medium text-primary hover:underline"
            >
              {nameById.get(senderId) ?? senderId}
            </Link>
          );
        },
      },
      {
        accessorKey: "content",
        header: t("column.content"),
        cell: ({ row }) =>
          row.original.kind === "commit" && row.original.commit ? (
            <div className="flex max-w-xl flex-col items-start gap-1">
              <Button
                variant="link"
                className="h-auto max-w-xl justify-start p-0 text-left text-sm whitespace-normal"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCommit(row.original);
                }}
              >
                <GitCommitHorizontal className="size-3.5 shrink-0" />
                {row.original.content}
              </Button>
              <span className="tnum text-xs text-muted-foreground">
                {t("commitMeta", {
                  repository: row.original.commit.repository,
                  count: row.original.commit.files.length,
                  sha: row.original.commit.sha,
                })}
              </span>
            </div>
          ) : (
            <ExpandableContent content={row.original.content} />
          ),
      },
      {
        id: "kind",
        header: t("column.type"),
        accessorFn: (m) => m.kind,
        cell: ({ row }) => (
          <Badge variant="outline">{t(`kind.${row.original.kind}` as never)}</Badge>
        ),
      },
      {
        accessorKey: "filter_category",
        header: t("column.category"),
        cell: ({ row }) => <CategoryBadge category={row.original.filter_category} />,
      },
      {
        accessorKey: "sent_at",
        header: t("column.sent"),
        cell: ({ getValue }) => (
          <span className="tnum text-sm text-muted-foreground">
            {new Date(getValue<string>()).toLocaleString()}
          </span>
        ),
      },
    ],
    [t, platformLabels, nameById, accountsById, onOpenCommit, onLinkAccount],
  );
}

export function useMessageColumnLabels(): Record<string, string> {
  const { t } = useTranslation("messages");
  return {
    platform: t("column.platform"),
    sender: t("column.sender"),
    content: t("column.content"),
    kind: t("column.type"),
    filter_category: t("column.category"),
    sent_at: t("column.sent"),
  };
}
