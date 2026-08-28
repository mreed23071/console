import { messages } from "../mock";
import {
  DEFAULT_PAGE_SIZE,
  type Message,
  type MessageFilters,
  type Page,
  type PageParams,
} from "../types";
import { delay } from "./_shared";

/** GET /api/v1/messages */
export async function getMessages(
  filters: MessageFilters = {},
  page: PageParams = { limit: DEFAULT_PAGE_SIZE, offset: 0 },
): Promise<Page<Message>> {
  await delay();
  const matching = messages.filter((m) => {
    if (filters.platform && filters.platform !== "all" && m.platform !== filters.platform) {
      return false;
    }
    if (filters.category && filters.category !== "all" && m.filter_category !== filters.category) {
      return false;
    }
    if (filters.from && m.sent_at < filters.from) return false;
    if (filters.to && m.sent_at > filters.to) return false;
    if (filters.search && !m.content.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const items = matching.slice(page.offset, page.offset + page.limit);
  return {
    items,
    total: matching.length,
    limit: page.limit,
    offset: page.offset,
    hasMore: page.offset + items.length < matching.length,
  };
}
