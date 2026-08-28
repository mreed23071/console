import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";

import {
  getUser,
  getUserAccounts,
  getUserMessages,
  getUserNotes,
  getUsers,
  getUsersPage,
  getUserSummary,
} from "@/lib/api/endpoints";
import type { PageParams, SummaryRange } from "@/lib/api/types";
import { DEFAULT_PAGE_SIZE } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";

export const peopleQueryOptions = () =>
  queryOptions({ queryKey: queryKeys.users.list(), queryFn: () => getUsers() });

export const peoplePageQueryOptions = (
  page: PageParams = { limit: DEFAULT_PAGE_SIZE, offset: 0 },
) =>
  queryOptions({
    queryKey: queryKeys.users.page(page),
    queryFn: () => getUsersPage(page),
    // Keeps the current page's rows on screen while the next page loads.
    placeholderData: keepPreviousData,
  });

export const personQueryOptions = (id: string) =>
  queryOptions({ queryKey: queryKeys.users.detail(id), queryFn: () => getUser(id) });

export const personAccountsQueryOptions = (id: string) =>
  queryOptions({ queryKey: queryKeys.users.accounts(id), queryFn: () => getUserAccounts(id) });

export const personMessagesQueryOptions = (id: string) =>
  queryOptions({ queryKey: queryKeys.users.messages(id), queryFn: () => getUserMessages(id) });

export const personSummaryQueryOptions = (id: string, range: SummaryRange = {}) =>
  queryOptions({
    queryKey: queryKeys.users.summary(id, range),
    queryFn: () => getUserSummary(id, range),
  });

export function usePeople() {
  return useQuery(peopleQueryOptions());
}

export function usePeoplePage(page: PageParams = { limit: DEFAULT_PAGE_SIZE, offset: 0 }) {
  return useQuery(peoplePageQueryOptions(page));
}

export function usePerson(id: string) {
  return useQuery(personQueryOptions(id));
}

export function usePersonAccounts(id: string) {
  return useQuery(personAccountsQueryOptions(id));
}

export function usePersonMessages(id: string) {
  return useQuery(personMessagesQueryOptions(id));
}

export function usePersonSummary(id: string, range: SummaryRange = {}) {
  return useQuery(personSummaryQueryOptions(id, range));
}

export function usePersonNotes(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.notes(id),
    queryFn: () => getUserNotes(id),
    enabled,
  });
}
