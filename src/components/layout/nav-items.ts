import {
  Activity,
  BarChart3,
  MessageSquareText,
  Network,
  PlugZap,
  Settings,
  Users,
  Waves,
} from "lucide-react";

import type { Persona } from "@/features/auth";

export interface NavItem {
  to: string;
  /** Key into the `nav` namespace, e.g. `item.dashboard`. */
  labelKey: string;
  icon: typeof Users;
  personas: Persona[];
}

const ALL: Persona[] = ["admin", "analyst", "viewer"];
const STAFF: Persona[] = ["admin", "analyst"];

export const WORKSPACE_ITEMS: NavItem[] = [
  { to: "/", labelKey: "item.dashboard", icon: BarChart3, personas: ALL },
  { to: "/people", labelKey: "item.people", icon: Users, personas: STAFF },
  { to: "/org", labelKey: "item.org", icon: Network, personas: STAFF },
  { to: "/messages", labelKey: "item.messages", icon: MessageSquareText, personas: STAFF },
];

export const INTEGRATION_ITEMS: NavItem[] = [
  { to: "/integrations", labelKey: "item.integrations", icon: PlugZap, personas: ALL },
  { to: "/runs", labelKey: "item.runs", icon: Waves, personas: STAFF },
  { to: "/status", labelKey: "item.status", icon: Activity, personas: ALL },
];

export const BOTTOM_ITEMS: NavItem[] = [
  { to: "/settings", labelKey: "item.settings", icon: Settings, personas: ALL },
];

export const ALL_NAV_ITEMS: NavItem[] = [...WORKSPACE_ITEMS, ...INTEGRATION_ITEMS, ...BOTTOM_ITEMS];

export function navItemsForPersona(items: NavItem[], persona: Persona): NavItem[] {
  return items.filter((i) => i.personas.includes(persona));
}
