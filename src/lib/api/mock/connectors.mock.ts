import type { Connector } from "../types";
import { connectedAccounts } from "./accounts.mock";
import { messages } from "./messages.mock";
import { int, iso, NOW, PLATFORMS } from "./random";

/** Builds a fresh copy of the table from the current messages and accounts. */
export function seedConnectors(): Connector[] {
  return PLATFORMS.map((platform, i) => {
    const contributed = messages.filter((m) => m.platform === platform).length;
    const status: Connector["status"] =
      i === 2 ? "degraded" : i === 4 ? "disconnected" : i === 3 ? "needs_attention" : "connected";
    return {
      platform,
      status,
      last_sync_at: status === "disconnected" ? null : iso(NOW - int(1, 300) * 60_000),
      messages_contributed: contributed,
      account_count: connectedAccounts.filter((a) => a.platform === platform).length,
    };
  });
}

export const connectors: Connector[] = seedConnectors();
