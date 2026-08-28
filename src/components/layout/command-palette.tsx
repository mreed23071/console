import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { NavItem } from "@/components/layout/nav-items";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function CommandPalette({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: NavItem[];
}) {
  const { t } = useTranslation(["nav", "common"]);
  const navigate = useNavigate();

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t("nav:search.placeholder")} />
      <CommandList>
        <CommandEmpty>{t("common:empty.noResults")}</CommandEmpty>
        <CommandGroup heading={t("nav:search.pages")}>
          {items.map((item) => (
            <CommandItem
              key={item.to}
              value={t(`nav:${item.labelKey}` as never)}
              onSelect={() => {
                onOpenChange(false);
                navigate({ to: item.to });
              }}
            >
              <item.icon className="size-4" />
              {t(`nav:${item.labelKey}` as never)}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
