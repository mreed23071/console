import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Waves } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { NavItem } from "@/components/layout/nav-items";
import { SignOutDialog } from "@/components/layout/sign-out-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

function SidebarMenuLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const { t } = useTranslation("nav");
  const label = t(item.labelKey as never);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
        <Link to={item.to}>
          <item.icon className="size-4" />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarSection({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (items.length === 0) return null;
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuLink key={item.to} item={item} isActive={pathname === item.to} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar({
  workspaceItems,
  integrationItems,
  bottomItems,
}: {
  workspaceItems: NavItem[];
  integrationItems: NavItem[];
  bottomItems: NavItem[];
}) {
  const { t } = useTranslation(["nav", "auth"]);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Waves className="size-4" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm leading-tight font-semibold">{t("nav:brand.name")}</p>
            <p className="text-xs leading-tight text-muted-foreground">{t("nav:brand.subtitle")}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarSection label={t("nav:section.workspace")} items={workspaceItems} />
        <SidebarSection label={t("nav:section.integrations")} items={integrationItems} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup className="border-t pt-2 pb-0 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => (
                <SidebarMenuLink key={item.to} item={item} isActive={pathname === item.to} />
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={t("auth:signOut.action")}
                  onClick={() => setLogoutOpen(true)}
                >
                  <LogOut className="size-4" />
                  <span>{t("auth:signOut.action")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <p className="px-2 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          {t("nav:footer.mockData")}
        </p>
      </SidebarFooter>

      <SignOutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </Sidebar>
  );
}
