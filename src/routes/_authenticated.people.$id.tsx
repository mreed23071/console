import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { useHasScope } from "@/features/auth";
import {
  AddAccountDialog,
  ConnectedAccountsCard,
  EditPersonDialog,
  PersonActivityCard,
  PersonHeader,
  PersonNotesCard,
  PersonSummaryCard,
  usePerson,
} from "@/features/people";
import { i18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/people/$id")({
  head: () => ({
    meta: [
      { title: i18n.t("people:meta.detailTitle") },
      { name: "description", content: i18n.t("people:meta.detailDescription") },
      { property: "og:title", content: i18n.t("people:meta.detailTitle") },
      { property: "og:description", content: i18n.t("people:meta.detailOgDescription") },
    ],
  }),
  component: PersonDetailPage,
});

function PersonDetailPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation("people");
  const person = usePerson(id);
  const isAdmin = useHasScope("config:read");

  const [editOpen, setEditOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);

  if (person.isError) {
    return <ErrorState title={t("detail.notFound")} onRetry={() => person.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/people">
          <ArrowLeft className="size-4" /> {t("detail.back")}
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-4">
        <PersonHeader
          person={person.data}
          isLoading={person.isLoading}
          canForget={isAdmin}
          onEdit={() => setEditOpen(true)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ConnectedAccountsCard personId={id} onAddAccount={() => setAddAccountOpen(true)} />
        <PersonSummaryCard personId={id} />
      </div>

      <PersonActivityCard personId={id} />

      {isAdmin && <PersonNotesCard personId={id} />}

      {person.data && (
        <EditPersonDialog person={person.data} open={editOpen} onOpenChange={setEditOpen} />
      )}
      <AddAccountDialog userId={id} open={addAccountOpen} onOpenChange={setAddAccountOpen} />
    </div>
  );
}
