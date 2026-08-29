import { Search } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { CommandPalette } from "@/components/layout/command-palette";
import {
  BOTTOM_ITEMS,
  INTEGRATION_ITEMS,
  navItemsForPersona,
  WORKSPACE_ITEMS,
} from "@/components/layout/nav-items";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuthStore } from "@/features/auth";
import { ActiveRunIndicator } from "@/features/ingestion";
import { useAppPreferences } from "@/hooks/use-app-preferences";
import { useCommandShortcut } from "@/hooks/use-command-shortcut";
import { useUIStore } from "@/stores/ui";

export function AppShell({ children }: { children: ReactNode }) {
  useAppPreferences();

  const { t } = useTranslation("nav");
  const persona = useAuthStore((s) => s.session?.persona) ?? "viewer";
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);
  const [cmdOpen, setCmdOpen] = useState(false);

  useCommandShortcut(setCmdOpen);

  const workspaceItems = navItemsForPersona(WORKSPACE_ITEMS, persona);
  const integrationItems = navItemsForPersona(INTEGRATION_ITEMS, persona);
  const bottomItems = navItemsForPersona(BOTTOM_ITEMS, persona);

  return (
    <SidebarProvider open={!sidebarCollapsed} onOpenChange={(o) => setSidebarCollapsed(!o)}>
      <AppSidebar
        workspaceItems={workspaceItems}
        integrationItems={integrationItems}
        bottomItems={bottomItems}
      />

      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger />
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-muted-foreground sm:w-72 sm:justify-start"
            onClick={() => setCmdOpen(true)}
          >
            <Search className="size-4" />
            <span className="hidden sm:inline">{t("search.trigger")}</span>
            <kbd className="ml-auto hidden rounded border bg-muted px-1.5 text-[10px] sm:inline">
              ⌘K
            </kbd>
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <ActiveRunIndicator />
            <Badge variant="outline" className="hidden font-mono text-xs sm:inline-flex">
              {t("footer.environment", { name: "local" })}
            </Badge>
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>

      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        items={[...workspaceItems, ...integrationItems, ...bottomItems]}
      />
    </SidebarProvider>
  );
}
