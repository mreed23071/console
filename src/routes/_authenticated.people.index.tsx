import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { DataTable } from "@/components/common/data-table";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useOrgNodes } from "@/features/organization";
import {
  AddPersonDialog,
  LinkAccountDialog,
  UnresolvedAccountsCard,
  usePeopleColumnLabels,
  usePeopleColumns,
  usePeoplePage,
} from "@/features/people";
import { DEFAULT_PAGE_SIZE } from "@/lib/api/types";
import { i18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/people/")({
  head: () => ({
    meta: [
      { title: i18n.t("people:meta.listTitle") },
      { name: "description", content: i18n.t("people:meta.listDescription") },
      { property: "og:title", content: i18n.t("people:meta.listTitle") },
      { property: "og:description", content: i18n.t("people:meta.listOgDescription") },
    ],
  }),
  component: PeopleListPage,
});

function PeopleListPage() {
  const { t } = useTranslation("people");
  const navigate = useNavigate();

  const [pageIndex, setPageIndex] = useState(0);
  const page = useMemo(
    () => ({ limit: DEFAULT_PAGE_SIZE, offset: pageIndex * DEFAULT_PAGE_SIZE }),
    [pageIndex],
  );
  const people = usePeoplePage(page);

  // The org tree is the only source for a person's department. Resolving it
  // here keeps the people feature from depending on the organization one —
  // the route is the single place that knows about both.
  const orgNodes = useOrgNodes();
  const departmentByPersonId = useMemo(() => {
    const byPerson = new Map<string, string>();
    for (const node of orgNodes.data ?? []) {
      for (const memberId of node.member_ids) byPerson.set(memberId, node.name);
    }
    return byPerson;
  }, [orgNodes.data]);

  const columns = usePeopleColumns({ departmentByPersonId });
  const columnLabels = usePeopleColumnLabels();

  const [addOpen, setAddOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState<{ id: string; label: string } | null>(null);

  return (
    <div>
      <PageHeader
        title={t("list.title")}
        description={t("list.description")}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="size-4" /> {t("list.addPerson")}
          </Button>
        }
      />

      <UnresolvedAccountsCard onLink={setLinkTarget} />

      {people.isError ? (
        <ErrorState onRetry={() => people.refetch()} />
      ) : (
        <DataTable
          columns={columns}
          columnLabels={columnLabels}
          data={people.data?.items ?? []}
          isLoading={people.isLoading}
          showSearch={false}
          pageSize={DEFAULT_PAGE_SIZE}
          manualPagination={{
            pageIndex,
            rowCount: people.data?.total ?? 0,
            onPageChange: setPageIndex,
          }}
          onRowClick={(row) => navigate({ to: "/people/$id", params: { id: row.original.id } })}
          emptyTitle={t("list.emptyTitle")}
          emptyDescription={t("list.emptyDescription")}
        />
      )}

      <AddPersonDialog open={addOpen} onOpenChange={setAddOpen} />
      <LinkAccountDialog
        accountId={linkTarget?.id ?? null}
        accountLabel={linkTarget?.label ?? t("dialog.link.fallbackLabel")}
        open={linkTarget !== null}
        onOpenChange={(v) => !v && setLinkTarget(null)}
      />
    </div>
  );
}
