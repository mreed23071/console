/**
 * Central React Query key factory.
 *
 * Keys live here rather than inside each feature because mutations routinely
 * invalidate across feature boundaries — linking an account, for example,
 * touches users, messages, unlinked accounts and connectors at once.
 *
 * Every key is hierarchical, so invalidating a parent invalidates everything
 * beneath it: `queryClient.invalidateQueries({ queryKey: queryKeys.users.all })`
 * clears list, detail, summary and note queries in one call.
 */
import type { MessageFilters, PageParams, SummaryRange } from "./api/types";
import { DEFAULT_PAGE_SIZE } from "./api/types";

export const queryKeys = {
  users: {
    all: ["users"] as const,
    list: () => [...queryKeys.users.all, "list"] as const,
    page: (page: PageParams = { limit: DEFAULT_PAGE_SIZE, offset: 0 }) =>
      [...queryKeys.users.all, "page", page] as const,
    detail: (id: string) => [...queryKeys.users.all, id] as const,
    accounts: (id: string) => [...queryKeys.users.detail(id), "accounts"] as const,
    messages: (id: string) => [...queryKeys.users.detail(id), "messages"] as const,
    notes: (id: string) => [...queryKeys.users.detail(id), "notes"] as const,
    summary: (id: string, range: SummaryRange = {}) =>
      [...queryKeys.users.detail(id), "summary", range.from ?? null, range.to ?? null] as const,
  },

  messages: {
    all: ["messages"] as const,
    list: (
      filters: MessageFilters = {},
      page: PageParams = { limit: DEFAULT_PAGE_SIZE, offset: 0 },
    ) => [...queryKeys.messages.all, filters, page] as const,
  },

  accounts: {
    all: ["accounts"] as const,
    unlinked: () => [...queryKeys.accounts.all, "unlinked"] as const,
  },

  org: {
    all: ["org"] as const,
    nodes: () => [...queryKeys.org.all, "nodes"] as const,
  },

  ingestion: {
    all: ["ingestion"] as const,
    runs: (platform?: string) => [...queryKeys.ingestion.all, "runs", platform] as const,
    config: (platform: string) => [...queryKeys.ingestion.all, "config", platform] as const,
  },

  connectors: {
    all: ["connectors"] as const,
    list: () => [...queryKeys.connectors.all, "list"] as const,
  },

  system: {
    all: ["system"] as const,
    health: () => [...queryKeys.system.all, "health"] as const,
    readiness: () => [...queryKeys.system.all, "readiness"] as const,
  },
} as const;
