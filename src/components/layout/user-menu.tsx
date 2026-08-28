import { useNavigate } from "@tanstack/react-router";
import { LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { SignOutDialog } from "@/components/layout/sign-out-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/features/auth";
import { initialsOf } from "@/lib/utils";

export function UserMenu() {
  const { t } = useTranslation(["auth", "nav"]);
  const session = useAuthStore((s) => s.session);
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);

  if (!session) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <Avatar className="size-7">
              <AvatarFallback className="bg-accent text-xs text-accent-foreground">
                {initialsOf(session.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">{session.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="text-sm font-medium">{session.name}</p>
            <p className="text-xs font-normal text-muted-foreground">{session.email}</p>
            <p className="mt-1 text-xs font-normal text-muted-foreground">
              {t("auth:menu.role", { persona: t(`auth:persona.${session.persona}.label`) })}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}>
            <Settings className="size-4" /> {t("nav:item.settings")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setLogoutOpen(true)}>
            <LogOut className="size-4" /> {t("auth:signOut.action")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </>
  );
}
