import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ForgetPersonDialog } from "@/features/people/components/forget-person-dialog";
import type { Person } from "@/lib/api/types";
import { initialsOf } from "@/lib/utils";

export function PersonHeader({
  person,
  isLoading,
  canForget,
  onEdit,
}: {
  person: Person | undefined;
  isLoading: boolean;
  canForget: boolean;
  onEdit: () => void;
}) {
  const { t } = useTranslation("people");

  if (isLoading || !person) return <Skeleton className="h-16 w-64" />;

  return (
    <>
      <Avatar className="size-14">
        <AvatarFallback className="bg-accent text-lg text-accent-foreground">
          {initialsOf(person.full_name)}
        </AvatarFallback>
      </Avatar>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{person.full_name}</h1>
        <p className="text-sm text-muted-foreground">
          {t("detail.identity", {
            jobTitle: person.job_title,
            email: person.email,
            timezone: person.timezone,
          })}
        </p>
        <p className="tnum text-xs text-muted-foreground">
          {person.address || t("detail.noAddress")} · {person.employment_start ?? "—"} →{" "}
          {person.employment_end ?? t("detail.present")}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Badge variant={person.is_active ? "secondary" : "outline"}>
          {person.is_active ? t("detail.active") : t("detail.inactive")}
        </Badge>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="size-4" /> {t("detail.editProfile")}
        </Button>
        {canForget && <ForgetPersonDialog personId={person.id} personName={person.full_name} />}
      </div>
    </>
  );
}
