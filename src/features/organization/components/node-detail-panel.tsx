import { Link } from "@tanstack/react-router";
import { Network, Pencil, Trash2, UserMinus, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRemoveOrgMember } from "@/features/organization/api/mutations";
import type { OrgNode, PersonWithMeta } from "@/lib/api/types";
import { initialsOf } from "@/lib/utils";

/** Right-hand column: who is in the selected department, and what you can do to it. */
export function NodeDetailPanel({
  node,
  peopleById,
  canEdit,
  onAssign,
  onAddChild,
  onEdit,
  onDelete,
}: {
  node: OrgNode | null;
  peopleById: Map<string, PersonWithMeta>;
  canEdit: boolean;
  onAssign: () => void;
  onAddChild: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation("organization");
  const removeMember = useRemoveOrgMember();

  return (
    <Card className="h-fit">
      <CardHeader className="border-b">
        <CardTitle className="text-sm">{t("panel.title")}</CardTitle>
        <CardDescription>{node ? node.name : t("empty.noSelection")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 pt-4">
        {!node ? (
          <p className="text-sm text-muted-foreground">{t("empty.description")}</p>
        ) : (
          <>
            <p className="text-xs font-medium text-muted-foreground">{t("panel.assignedPeople")}</p>

            {node.member_ids.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("panel.noneAssigned")}</p>
            ) : (
              <ul className="space-y-2">
                {node.member_ids.map((id) => {
                  const person = peopleById.get(id);
                  const name = person?.full_name ?? t("panel.unknownPerson");
                  return (
                    <li key={id} className="flex items-center gap-2 rounded-md border p-2">
                      <Avatar className="size-7">
                        <AvatarFallback className="bg-accent text-[10px] text-accent-foreground">
                          {person ? initialsOf(person.full_name) : "?"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        {person ? (
                          <Link
                            to="/people/$id"
                            params={{ id }}
                            className="block truncate text-sm font-medium text-primary hover:underline"
                          >
                            {person.full_name}
                          </Link>
                        ) : (
                          <p className="truncate text-sm font-medium">{name}</p>
                        )}
                        <p className="truncate text-xs text-muted-foreground">
                          {person?.job_title || t("panel.noJobTitle")}
                        </p>
                      </div>

                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("panel.remove", { name })}
                          disabled={removeMember.isPending}
                          onClick={() =>
                            removeMember.mutate(
                              { nodeId: node.id, userId: id },
                              {
                                onSuccess: () => toast.success(t("panel.removeSuccess", { name })),
                                onError: () => toast.error(t("panel.removeError")),
                              },
                            )
                          }
                        >
                          <UserMinus className="size-4" />
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {canEdit && (
              <div className="space-y-2 pt-2">
                <Button className="w-full" onClick={onAssign}>
                  <UserPlus className="size-4" /> {t("action.assign")}
                </Button>
                <Button variant="outline" className="w-full" onClick={onAddChild}>
                  <Network className="size-4" /> {t("action.addChild")}
                </Button>
                <Button variant="outline" className="w-full" onClick={onEdit}>
                  <Pencil className="size-4" /> {t("action.edit")}
                </Button>
                <Button variant="ghost" className="w-full text-destructive" onClick={onDelete}>
                  <Trash2 className="size-4" /> {t("action.delete")}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
