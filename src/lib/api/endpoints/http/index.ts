/**
 * The endpoint layer, talking to the real FastAPI service.
 *
 * Every function here has the same name, signature and return shape as its
 * counterpart in the mock modules one directory up - that is the whole contract
 * this layer honours, and it is what lets `endpoints/index.ts` choose between
 * them without anything in `features/` knowing which is in play.
 *
 * The bodies are deliberately thin: a verb, a path, and an adapter. When the
 * OpenAPI client is generated (`bun run openapi:sync`), each `get(...)` becomes
 * a call into the generated SDK and the adapters collapse to nothing.
 */
import { del, get, getPage, getRoot, patch, post } from "../../http";
import type {
  ConnectedAccount,
  Connector,
  HealthResponse,
  IngestionConfig,
  IngestionRun,
  Message,
  MessageFilters,
  OrgNode,
  Page,
  PageParams,
  Person,
  PersonNote,
  PersonWithMeta,
  Platform,
  ReadinessResponse,
  Summary,
  SummaryRange,
} from "../../types";
import { DEFAULT_PAGE_SIZE } from "../../types";
import type { CreateAccountInput, UnlinkedAccount } from "../accounts";
import type { TriggerRunOptions } from "../ingestion";
import type { CreateOrgNodeInput, UpdateOrgNodePatch } from "../org";
import type { CreatePersonInput, ForgetUserResult } from "../people";
import {
  type ApiAccount,
  type ApiMessage,
  type ApiNote,
  type ApiOrgNode,
  type ApiPage,
  type ApiSummary,
  type ApiUnlinkedAccount,
  type ApiUser,
  type ApiUserListItem,
  toAccount,
  toMessage,
  toNote,
  toOrgNode,
  toPage,
  toPerson,
  toPersonWithMeta,
  toSummary,
  toUnlinkedAccount,
} from "./adapters";

// -- people ----------------------------------------------------------------

/**
 * Unpaged, deliberately - the org chart, sender-name lookups and the
 * account-linking picker all call this and need the whole roster, not one
 * page of it. `getUsersPage` is the counterpart for the directory screen.
 */
export const getUsers = async (): Promise<PersonWithMeta[]> =>
  (await get<ApiUserListItem[]>("/users")).map(toPersonWithMeta);

/**
 * One page of the directory, for a roster too large to browse in one table.
 *
 * `/users` answers this with the same flat array either way - passing
 * `limit`/`offset` just windows it - and reports the total and whether more
 * remains on response headers rather than an envelope, so `getUsers` above
 * didn't have to change shape for callers that don't page.
 */
export const getUsersPage = async (page: PageParams): Promise<Page<PersonWithMeta>> => {
  const { items, total, hasMore } = await getPage<ApiUserListItem[]>("/users", {
    limit: page.limit,
    offset: page.offset,
  });
  return {
    items: items.map(toPersonWithMeta),
    total,
    limit: page.limit,
    offset: page.offset,
    hasMore,
  };
};

export const getUser = async (id: string): Promise<Person> =>
  toPerson(await get<ApiUser>(`/users/${id}`));

export const getUserAccounts = async (id: string): Promise<ConnectedAccount[]> =>
  (await get<ApiAccount[]>(`/users/${id}/accounts`)).map(toAccount);

export const getUserMessages = async (id: string): Promise<Message[]> =>
  (await get<ApiMessage[]>(`/users/${id}/messages`)).map(toMessage);

export const updateUser = async (id: string, changes: Partial<Person>): Promise<Person> =>
  toPerson(await patch<ApiUser>(`/users/${id}`, changes));

export const createUser = async (input: CreatePersonInput): Promise<Person> =>
  toPerson(await post<ApiUser>("/users", input));

export const forgetUser = (id: string): Promise<ForgetUserResult> =>
  del<ForgetUserResult>(`/users/${id}`);

// -- notes -----------------------------------------------------------------

export const getUserNotes = async (id: string): Promise<PersonNote[]> =>
  (await get<ApiNote[]>(`/users/${id}/notes`)).map(toNote);

export const createUserNote = async (
  id: string,
  body: string,
  author: string,
): Promise<PersonNote> => toNote(await post<ApiNote>(`/users/${id}/notes`, { body, author }));

export const deleteUserNote = (noteId: string): Promise<{ id: string }> =>
  del<{ id: string }>(`/notes/${noteId}`);

// -- accounts --------------------------------------------------------------

export const getUnlinkedAccounts = async (): Promise<UnlinkedAccount[]> =>
  (await get<ApiUnlinkedAccount[]>("/accounts/unlinked")).map(toUnlinkedAccount);

export const linkAccount = async (accountId: string, userId: string): Promise<ConnectedAccount> =>
  toAccount(await post<ApiAccount>(`/accounts/${accountId}/link`, { user_id: userId }));

export const unlinkAccount = async (accountId: string): Promise<ConnectedAccount> =>
  toAccount(await post<ApiAccount>(`/accounts/${accountId}/unlink`));

export const deleteAccount = (accountId: string): Promise<{ deleted_messages: number }> =>
  del<{ deleted_messages: number }>(`/accounts/${accountId}`);

export const createAccount = async (input: CreateAccountInput): Promise<ConnectedAccount> =>
  toAccount(await post<ApiAccount>("/accounts", input));

// -- messages --------------------------------------------------------------

/**
 * The console's "all" sentinel is dropped rather than sent.
 *
 * The API expresses "do not narrow by this" as an absent parameter; the console
 * expresses it as the string "all". Translating here keeps that vocabulary out
 * of the API, where it would have to be special-cased in every filter.
 */
export const getMessages = async (
  filters: MessageFilters = {},
  page: PageParams = { limit: DEFAULT_PAGE_SIZE, offset: 0 },
): Promise<Page<Message>> =>
  toPage(
    await get<ApiPage<ApiMessage>>("/messages", {
      platform: filters.platform === "all" ? undefined : filters.platform,
      category: filters.category === "all" ? undefined : filters.category,
      sent_from: filters.from,
      sent_to: filters.to,
      search: filters.search,
      limit: page.limit,
      offset: page.offset,
    }),
    toMessage,
  );

// -- summaries -------------------------------------------------------------

const summaryQuery = (range?: SummaryRange) => ({
  range_from: range?.from,
  range_to: range?.to,
});

export const getUserSummary = async (id: string, range?: SummaryRange): Promise<Summary> =>
  toSummary(await get<ApiSummary>(`/insights/users/${id}/summary`, summaryQuery(range)));

/**
 * Identical to `getUserSummary`, deliberately.
 *
 * The API generates a summary on every request rather than caching one, so
 * there is nothing to invalidate and no separate regeneration to trigger. The
 * function is kept because the console has a button for it and because that
 * will change: when summaries are persisted against an input fingerprint, this
 * becomes the call that forces a new one.
 */
export const regenerateUserSummary = getUserSummary;

// -- organization ----------------------------------------------------------

export const getOrgNodes = async (): Promise<OrgNode[]> =>
  (await get<ApiOrgNode[]>("/org/nodes")).map(toOrgNode);

export const createOrgNode = async (input: CreateOrgNodeInput): Promise<OrgNode> =>
  toOrgNode(await post<ApiOrgNode>("/org/nodes", input));

/**
 * `reparent` is derived from whether the caller mentioned `parent_id` at all.
 *
 * The API refuses a `parent_id` without that flag rather than silently ignoring
 * it, because null is a real value there - it means "make this a root" - and a
 * caller who meant to move a department should not get a successful no-op.
 * `in` distinguishes an explicit `parent_id: null` from an absent key, which is
 * exactly the distinction the flag exists to carry.
 */
export const updateOrgNode = async (id: string, changes: UpdateOrgNodePatch): Promise<OrgNode> =>
  toOrgNode(
    await patch<ApiOrgNode>(`/org/nodes/${id}`, {
      ...changes,
      reparent: "parent_id" in changes,
    }),
  );

export const deleteOrgNode = (id: string): Promise<{ id: string; promoted: number }> =>
  del<{ id: string; promoted: number }>(`/org/nodes/${id}`);

export const assignOrgMember = async (nodeId: string, userId: string): Promise<OrgNode> =>
  toOrgNode(await post<ApiOrgNode>(`/org/nodes/${nodeId}/members`, { user_id: userId }));

export const removeOrgMember = async (nodeId: string, userId: string): Promise<OrgNode> =>
  toOrgNode(await del<ApiOrgNode>(`/org/nodes/${nodeId}/members/${userId}`));

// -- platform --------------------------------------------------------------

export const getConnectors = (): Promise<Connector[]> => get<Connector[]>("/connectors");

export const getIngestionRuns = (platform?: Platform): Promise<IngestionRun[]> =>
  get<IngestionRun[]>("/ingestion/runs", { platform });

export const triggerIngestionRun = (
  platform: Platform,
  options: TriggerRunOptions = {},
): Promise<IngestionRun> => post<IngestionRun>(`/ingestion/runs/${platform}`, options);

export const getIngestionConfig = (platform: Platform): Promise<IngestionConfig> =>
  get<IngestionConfig>(`/ingestion/config/${platform}`);

export const getHealth = (): Promise<HealthResponse> => getRoot<HealthResponse>("/health");

export const getReadiness = (): Promise<ReadinessResponse> => getRoot<ReadinessResponse>("/ready");
