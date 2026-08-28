import { ChevronsUpDown, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useLinkAccount } from "@/features/people/api/accounts";
import { usePeople } from "@/features/people/api/queries";
import { initialsOf } from "@/lib/utils";

/** Attaches an existing unresolved account to a person. */
export function LinkAccountDialog({
  accountId,
  accountLabel,
  open,
  onOpenChange,
}: {
  accountId: string | null;
  accountLabel: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useTranslation(["people", "common"]);
  const people = usePeople();
  const link = useLinkAccount();
  const [userId, setUserId] = useState("");
  const [openCombo, setOpenCombo] = useState(false);

  const selected = useMemo(
    () => (people.data ?? []).find((p) => p.id === userId) ?? null,
    [people.data, userId],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("people:dialog.link.title")}</DialogTitle>
          <DialogDescription>
            {t("people:dialog.link.description", { account: accountLabel })}
          </DialogDescription>
        </DialogHeader>

        <Popover open={openCombo} onOpenChange={setOpenCombo}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openCombo}
              className="w-full justify-between"
            >
              {selected ? (
                <span className="flex items-center gap-2 truncate">
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-accent text-[10px] text-accent-foreground">
                      {initialsOf(selected.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">
                    {selected.full_name} · {selected.email}
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {t("people:dialog.link.selectPlaceholder")}
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder={t("people:dialog.link.searchPlaceholder")} />
              <CommandList>
                <CommandEmpty>{t("people:dialog.link.notFound")}</CommandEmpty>
                <CommandGroup>
                  {(people.data ?? []).map((p) => (
                    <CommandItem
                      key={p.id}
                      value={`${p.full_name} ${p.email} ${p.job_title} ${p.id}`}
                      onSelect={() => {
                        setUserId(p.id);
                        setOpenCombo(false);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarFallback className="bg-accent text-[10px] text-accent-foreground">
                            {initialsOf(p.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{p.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {p.email} · {p.job_title}
                          </span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common:action.cancel")}
          </Button>
          <Button
            disabled={!userId || !accountId || link.isPending}
            onClick={() =>
              link.mutate(
                { accountId: accountId!, userId },
                {
                  onSuccess: () => {
                    toast.success(t("people:dialog.link.success"));
                    setUserId("");
                    onOpenChange(false);
                  },
                  onError: () => toast.error(t("people:dialog.link.error")),
                },
              )
            }
          >
            {link.isPending && <Loader2 className="size-4 animate-spin" />}{" "}
            {t("people:dialog.link.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
