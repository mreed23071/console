import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";

import { getMessages } from "@/lib/api/endpoints";
import type { MessageFilters, PageParams } from "@/lib/api/types";
import { DEFAULT_PAGE_SIZE } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";

export const messagesQueryOptions = (
  filters: MessageFilters = {},
  page: PageParams = { limit: DEFAULT_PAGE_SIZE, offset: 0 },
) =>
  queryOptions({
    queryKey: queryKeys.messages.list(filters, page),
    queryFn: () => getMessages(filters, page),
    // Keeps the current page's rows on screen while the next page loads,
    // instead of the table flashing to its loading state on every click.
    placeholderData: keepPreviousData,
  });

export function useMessages(
  filters: MessageFilters = {},
  page: PageParams = { limit: DEFAULT_PAGE_SIZE, offset: 0 },
) {
  return useQuery(messagesQueryOptions(filters, page));
}
