import type { StatusLevel } from "@/components/common/status-badge";
import type { Connector } from "@/lib/api/types";

/** Maps connector health onto the shared status scale plus its label key. */
export const CONNECTOR_STATUS: Record<
  Connector["status"],
  { level: StatusLevel; labelKey: string }
> = {
  connected: { level: "good", labelKey: "status.connected" },
  degraded: { level: "warning", labelKey: "status.degraded" },
  needs_attention: { level: "serious", labelKey: "status.needs_attention" },
  disconnected: { level: "critical", labelKey: "status.disconnected" },
};
