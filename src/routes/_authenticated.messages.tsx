import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { DataTable } from "@/components/common/data-table";
import { ErrorState } from "@/components/common/error-state";
import { usePlatformLabels } from "@/components/common/platform";
import { PageHeader } from "@/components/layout/page-header";
import {
  CommitDialog,
  MessageFilters,
  type MessageFilterState,
  useMessageColumnLabels,
  useMessageColumns,
  useMessages,
} from "@/features/messages";
import { LinkAccountDialog, usePeople, useUnlinkedAccounts } from "@/features/people";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { ConnectedAccount, Message } from "@/lib/api/types";
import { DEFAULT_PAGE_SIZE } from "@/lib/api/types";
import { i18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: i18n.t("messages:meta.title") },
      { name: "description", content: i18n.t("messages:meta.description") },
      { property: "og:title", content: i18n.t("messages:meta.title") },
      { property: "og:description", content: i18n.t("messages:meta.ogDescription") },
    ],
  }),
  component: MessagesPage,
});

const initialFilters: MessageFilterState = {
  platform: "all",
  category: "all",
  from: "",
  to: "",
  search: "",
};

function MessagesPage() {
  const { t } = useTranslation("messages");
  const platformLabels = usePlatformLabels();

  const [filters, setFilters] = useState<MessageFilterState>(initialFilters);
  const [pageIndex, setPageIndex] = useState(0);
  const [activeCommit, setActiveCommit] = useState<Message | null>(null);
  const [linkAccount, setLinkAccount] = useState<ConnectedAccount | null>(null);

  // A search term is sent to the server, unlike the other filters - debounce
  // it so typing doesn't fire a request per keystroke.
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const apiFilters = useMemo(
    () => ({
      platform: filters.platform,
      category: filters.category,
      from: filters.from ? new Date(filters.from).toISOString() : undefined,
      to: filters.to ? new Date(`${filters.to}T23:59:59Z`).toISOString() : undefined,
      search: debouncedSearch || undefined,
    }),
    [filters.platform, filters.category, filters.from, filters.to, debouncedSearch],
  );

  // Any filter change invalidates the current offset - staying on page 5 of a
  // now-different, likely-shorter result set would either show a stale page
  // or (past its end) show nothing at all.
  useEffect(() => {
    setPageIndex(0);
  }, [apiFilters]);

  const page = useMemo(
    () => ({ limit: DEFAULT_PAGE_SIZE, offset: pageIndex * DEFAULT_PAGE_SIZE }),
    [pageIndex],
  );

  const messages = useMessages(apiFilters, page);
  const people = usePeople();
  const unlinked = useUnlinkedAccounts();

  const nameById = useMemo(
    () => new Map((people.data ?? []).map((u) => [u.id, u.full_name])),
    [people.data],
  );
  const accountsById = useMemo(
    () => new Map<string, ConnectedAccount>((unlinked.data ?? []).map((a) => [a.id, a])),
    [unlinked.data],
  );

  const columns = useMessageColumns({
    nameById,
    accountsById,
    onOpenCommit: setActiveCommit,
    onLinkAccount: setLinkAccount,
  });
  const columnLabels = useMessageColumnLabels();

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />

      {messages.isError ? (
        <ErrorState onRetry={() => messages.refetch()} />
      ) : (
        <DataTable
          columns={columns}
          columnLabels={columnLabels}
          data={messages.data?.items ?? []}
          isLoading={messages.isLoading}
          showSearch={false}
          pageSize={DEFAULT_PAGE_SIZE}
          manualPagination={{
            pageIndex,
            rowCount: messages.data?.total ?? 0,
            onPageChange: setPageIndex,
          }}
          emptyTitle={t("emptyTitle")}
          emptyDescription={t("emptyDescription")}
          toolbar={
            <MessageFilters
              value={filters}
              onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
            />
          }
        />
      )}

      <CommitDialog
        message={activeCommit}
        open={activeCommit !== null}
        onOpenChange={(o) => !o && setActiveCommit(null)}
      />
      <LinkAccountDialog
        accountId={linkAccount?.id ?? null}
        accountLabel={
          linkAccount
            ? `${platformLabels[linkAccount.platform]} @${linkAccount.external_handle}`
            : ""
        }
        open={linkAccount !== null}
        onOpenChange={(o) => !o && setLinkAccount(null)}
      />
    </div>
  );
}
