import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHasScope } from "@/features/auth";
import {
  AddNodeDialog,
  AssignMemberDialog,
  DeleteNodeDialog,
  EditNodeDialog,
  NodeDetailPanel,
  OrgChart,
  OrgTreeList,
  type OrgView,
  useOrgNodes,
  ViewToggle,
} from "@/features/organization";
import { usePeople } from "@/features/people";
import { i18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/org")({
  head: () => ({
    meta: [
      { title: i18n.t("organization:meta.title") },
      { name: "description", content: i18n.t("organization:meta.description") },
      { property: "og:title", content: i18n.t("organization:meta.title") },
      { property: "og:description", content: i18n.t("organization:meta.ogDescription") },
    ],
  }),
  component: OrganizationPage,
});

function OrganizationPage() {
  const { t } = useTranslation("organization");
  const nodesQuery = useOrgNodes();
  const peopleQuery = usePeople();
  const canEdit = useHasScope("org:write");

  const [view, setView] = useState<OrgView>("chart");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const nodes = useMemo(() => nodesQuery.data ?? [], [nodesQuery.data]);
  const people = useMemo(() => peopleQuery.data ?? [], [peopleQuery.data]);

  // Fall back to the first node so the panel is never empty while data exists;
  // a selection that was just deleted resolves back to the first node too.
  const selected = nodes.find((n) => n.id === selectedId) ?? nodes[0] ?? null;

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const openAdd = (parentId: string | null) => {
    setAddParentId(parentId);
    setAddOpen(true);
  };

  if (nodesQuery.isError) {
    return (
      <div>
        <PageHeader title={t("title")} description={t("description")} />
        <ErrorState onRetry={() => nodesQuery.refetch()} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          canEdit ? (
            <Button onClick={() => openAdd(selected?.id ?? null)}>
              <Plus className="size-4" /> {t("action.addNode")}
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 border-b">
            <div className="space-y-1.5">
              <CardTitle className="text-sm">
                {view === "chart" ? t("view.chartTitle") : t("view.treeTitle")}
              </CardTitle>
              <CardDescription>{t("view.hint")}</CardDescription>
            </div>
            <ViewToggle value={view} onChange={setView} />
          </CardHeader>

          <CardContent className="p-0">
            {nodesQuery.isLoading ? (
              <div className="space-y-3 p-6">
                <Skeleton className="mx-auto h-14 w-48" />
                <Skeleton className="mx-auto h-14 w-3/4" />
                <Skeleton className="mx-auto h-14 w-1/2" />
              </div>
            ) : nodes.length === 0 ? (
              <EmptyState title={t("empty.title")} description={t("empty.description")} />
            ) : view === "tree" ? (
              <OrgTreeList
                nodes={nodes}
                selectedId={selected?.id ?? null}
                onSelect={setSelectedId}
              />
            ) : (
              <OrgChart nodes={nodes} selectedId={selected?.id ?? null} onSelect={setSelectedId} />
            )}
          </CardContent>
        </Card>

        <NodeDetailPanel
          node={selected}
          peopleById={peopleById}
          canEdit={canEdit}
          onAssign={() => setAssignOpen(true)}
          onAddChild={() => openAdd(selected?.id ?? null)}
          onEdit={() => setEditOpen(true)}
          onDelete={() => setDeleteOpen(true)}
        />
      </div>

      <AddNodeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        nodes={nodes}
        defaultParentId={addParentId}
      />

      {selected && (
        <>
          <EditNodeDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            node={selected}
            nodes={nodes}
          />
          <AssignMemberDialog
            open={assignOpen}
            onOpenChange={setAssignOpen}
            node={selected}
            nodes={nodes}
            people={people}
          />
          <DeleteNodeDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            node={selected}
            onDeleted={() => setSelectedId(null)}
          />
        </>
      )}
    </div>
  );
}
