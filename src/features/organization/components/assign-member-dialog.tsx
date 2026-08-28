import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAssignOrgMember } from "@/features/organization/api/mutations";
import type { OrgNode, PersonWithMeta } from "@/lib/api/types";
import { nodeByMemberId, requiresReassignConfirmation } from "@/lib/org-tree";
import { initialsOf } from "@/lib/utils";

export function AssignMemberDialog({
  open,
  onOpenChange,
  node,
  nodes,
  people,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: OrgNode;
  /** The whole tree, so the picker can show where each person currently sits. */
  nodes: OrgNode[];
  people: PersonWithMeta[];
}) {
  const { t } = useTranslation(["organization", "common"]);
  const assign = useAssignOrgMember();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comboOpen, setComboOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const currentNodeOf = useMemo(() => nodeByMemberId(nodes), [nodes]);
  const selected = people.find((p) => p.id === selectedId) ?? null;
  const currentNode = selected ? (currentNodeOf.get(selected.id) ?? null) : null;

  const runAssign = () => {
    if (!selected) return;
    assign.mutate(
      { nodeId: node.id, userId: selected.id },
      {
        onSuccess: () => {
          toast.success(
            currentNode && currentNode.id !== node.id
              ? t("organization:assign.moveSuccess", {
                  person: selected.full_name,
                  from: currentNode.name,
                  to: node.name,
                })
              : t("organization:assign.success", {
                  person: selected.full_name,
                  node: node.name,
                }),
          );
          setSelectedId(null);
          setConfirmOpen(false);
          onOpenChange(false);
        },
        onError: () => toast.error(t("organization:assign.error")),
      },
    );
  };

  /**
   * Moving someone out of a department is destructive — the department they
   * are in loses them without being asked. Confirm that, and only that: an
   * unassigned person has nothing to lose, and re-assigning to the department
   * they are already in changes nothing.
   */
  const submit = () => {
    if (!selected) return;
    if (requiresReassignConfirmation(nodes, selected.id, node.id)) {
      setConfirmOpen(true);
      return;
    }
    runAssign();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("organization:assign.title", { name: node.name })}</DialogTitle>
            <DialogDescription>{t("organization:assign.description")}</DialogDescription>
          </DialogHeader>

          <Popover open={comboOpen} onOpenChange={setComboOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={comboOpen}
                className="h-auto w-full justify-between py-2 font-normal"
              >
                {selected ? (
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar className="size-5 shrink-0">
                      <AvatarFallback className="bg-accent text-[10px] text-accent-foreground">
                        {initialsOf(selected.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{selected.full_name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      ·{" "}
                      {currentNode
                        ? currentNode.name
                        : t("organization:assign.currentlyUnassigned")}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {t("organization:assign.placeholder")}
                  </span>
                )}
                <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder={t("organization:assign.searchPlaceholder")} />
                <CommandList>
                  <CommandEmpty>{t("organization:assign.notFound")}</CommandEmpty>
                  <CommandGroup>
                    {people.map((person) => {
                      const personNode = currentNodeOf.get(person.id) ?? null;
                      const isHere = personNode?.id === node.id;
                      return (
                        <CommandItem
                          key={person.id}
                          // Department is searchable too, so you can pull up
                          // everyone in a team by typing its name.
                          value={`${person.full_name} ${person.email} ${person.job_title} ${personNode?.name ?? ""}`}
                          onSelect={() => {
                            setSelectedId(person.id);
                            setComboOpen(false);
                          }}
                        >
                          <Avatar className="size-6 shrink-0">
                            <AvatarFallback className="bg-accent text-[10px] text-accent-foreground">
                              {initialsOf(person.full_name)}
                            </AvatarFallback>
                          </Avatar>

                          <span className="flex min-w-0 flex-col">
                            <span className="truncate text-sm">{person.full_name}</span>
                            <span className="truncate text-xs text-muted-foreground">
                              {person.job_title || t("organization:panel.noJobTitle")} ·{" "}
                              {personNode
                                ? personNode.name
                                : t("organization:assign.currentlyUnassigned")}
                            </span>
                          </span>

                          {isHere && (
                            <Badge variant="outline" className="ml-auto shrink-0 text-xs">
                              {t("organization:assign.alreadyHere")}
                            </Badge>
                          )}
                          {selectedId === person.id && !isHere && (
                            <Check className="ml-auto size-4 shrink-0" />
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common:action.cancel")}
            </Button>
            <Button onClick={submit} disabled={!selected || assign.isPending}>
              {assign.isPending
                ? t("organization:assign.pending")
                : t("organization:assign.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("organization:reassign.title", { name: selected?.full_name ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("organization:reassign.description", {
                person: selected?.full_name ?? "",
                from: currentNode?.name ?? "",
                to: node.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common:action.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={runAssign} disabled={assign.isPending}>
              {t("organization:reassign.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
