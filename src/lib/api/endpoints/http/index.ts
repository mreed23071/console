/**
 * The endpoint layer, talking to the real FastAPI service through the
 * generated OpenAPI client.
 *
 * Every function here has the same name, signature and return shape as its
 * counterpart in the mock modules one directory up - that is the whole contract
 * this layer honours, and it is what lets `endpoints/index.ts` choose between
 * them without anything in `features/` knowing which is in play.
 *
 * The bodies are deliberately thin: call the generated SDK function
 * (`lib/api/generated/sdk.gen.ts`), adapt the response into the console's own
 * vocabulary. `client.setConfig` (base URL, credential, error handling) and the
 * `ApiError` type live in `../../http`, configured once at import time.
 *
 * `throwOnError: true` is passed at every call site, not just once via
 * `client.setConfig`. The runtime respects the config-level default either
 * way, but TypeScript narrows a call's return type from its own generic
 * parameter, not from a runtime value it can't see - passing it explicitly is
 * what turns `data: TData | undefined` into a guaranteed `TData`.
 */
import {
  assignOrgMember as apiAssignOrgMember,
  browseMessages,
  createAccount as apiCreateAccount,
  createOrgNode as apiCreateOrgNode,
  createUser as apiCreateUser,
  createUserNote as apiCreateUserNote,
  deleteAccount as apiDeleteAccount,
  deleteNote,
  deleteOrgNode as apiDeleteOrgNode,
  forgetUser as apiForgetUser,
  getActiveRuns as apiGetActiveRuns,
  getIngestionConfig as apiGetIngestionConfig,
  getRunStatus as apiGetRunStatus,
  getUser as apiGetUser,
  getUserSummary as apiGetUserSummary,
  linkAccount as apiLinkAccount,
  listConnectors,
  listIngestionRuns,
  listOrgNodes,
  listUnlinkedAccounts as apiListUnlinkedAccounts,
  listUserAccounts,
  listUserMessages,
  listUserNotes,
  listUsers,
  removeOrgMember as apiRemoveOrgMember,
  runIngestion,
  unlinkAccount as apiUnlinkAccount,
  updateOrgNode as apiUpdateOrgNode,
  updateUser as apiUpdateUser,
} from "@/lib/api/generated/sdk.gen";

import { getRoot } from "../../http";
import type {
  ActiveRuns,
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
  QueuedRun,
  ReadinessResponse,
  RunProgress,
  Summary,
  SummaryRange,
} from "../../types";
import { DEFAULT_PAGE_SIZE } from "../../types";
import type { CreateAccountInput, UnlinkedAccount } from "../accounts";
import type { TriggerRunOptions } from "../ingestion";
import type { CreateOrgNodeInput, UpdateOrgNodePatch } from "../org";
import type { CreatePersonInput, ForgetUserResult } from "../people";
import {
  toAccount,
  toActiveRuns,
  toConnector,
  toForgetResult,
  toIngestionConfig,
  toIngestionRun,
  toMessage,
  toNote,
  toOrgNode,
  toPage,
  toPerson,
  toPersonWithMeta,
  toQueuedRun,
  toRunProgress,
  toSummary,
  toUnlinkedAccount,
} from "./adapters";

// -- people ------------------------------------------------------------

/**
 * Unpaged, deliberately - the org chart, sender-name lookups and the
 * account-linking picker all call this and need the whole roster, not one
 * page of it. `getUsersPage` is the counterpart for the directory screen.
 */
export const getUsers = async (): Promise<PersonWithMeta[]> =>
  (await listUsers({ throwOnError: true })).data.map(toPersonWithMeta);

/**
 * One page of the directory, for a roster too large to browse in one table.
 *
 * `/users` answers this with the same flat array either way - passing
 * `limit`/`offset` just windows it - and reports the total and whether more
 * remains on response headers rather than an envelope, so `getUsers` above
 * didn't have to change shape for callers that don't page. `response` (not
 * just `data`) is where those headers live.
 */
export const getUsersPage = async (page: PageParams): Promise<Page<PersonWithMeta>> => {
  const { data, response } = await listUsers({
    query: { limit: page.limit, offset: page.offset },
    throwOnError: true,
  });
  return {
    items: data.map(toPersonWithMeta),
    total: Number(response.headers.get("X-Total-Count") ?? 0),
    limit: page.limit,
    offset: page.offset,
    hasMore: response.headers.get("X-Has-More") === "true",
  };
};

export const getUser = async (id: string): Promise<Person> =>
  toPerson((await apiGetUser({ path: { user_id: id }, throwOnError: true })).data);

export const getUserAccounts = async (id: string): Promise<ConnectedAccount[]> =>
  (await listUserAccounts({ path: { user_id: id }, throwOnError: true })).data.map(toAccount);

export const getUserMessages = async (id: string): Promise<Message[]> =>
  (await listUserMessages({ path: { user_id: id }, throwOnError: true })).data.map(toMessage);

export const updateUser = async (id: string, changes: Partial<Person>): Promise<Person> =>
  toPerson(
    (await apiUpdateUser({ path: { user_id: id }, body: changes, throwOnError: true })).data,
  );

export const createUser = async (input: CreatePersonInput): Promise<Person> =>
  toPerson((await apiCreateUser({ body: input, throwOnError: true })).data);

export const forgetUser = async (id: string): Promise<ForgetUserResult> =>
  toForgetResult((await apiForgetUser({ path: { user_id: id }, throwOnError: true })).data);

// -- notes ---------------------------------------------------------------

export const getUserNotes = async (id: string): Promise<PersonNote[]> =>
  (await listUserNotes({ path: { user_id: id }, throwOnError: true })).data.map(toNote);

export const createUserNote = async (
  id: string,
  body: string,
  author: string,
): Promise<PersonNote> =>
  toNote(
    (
      await apiCreateUserNote({
        path: { user_id: id },
        body: { body, author },
        throwOnError: true,
      })
    ).data,
  );

export const deleteUserNote = async (noteId: string): Promise<{ id: string }> =>
  (await deleteNote({ path: { note_id: noteId }, throwOnError: true })).data;

// -- accounts --------------------------------------------------------------

export const getUnlinkedAccounts = async (): Promise<UnlinkedAccount[]> =>
  (await apiListUnlinkedAccounts({ throwOnError: true })).data.map(toUnlinkedAccount);

export const linkAccount = async (accountId: string, userId: string): Promise<ConnectedAccount> =>
  toAccount(
    (
      await apiLinkAccount({
        path: { account_id: accountId },
        body: { user_id: userId },
        throwOnError: true,
      })
    ).data,
  );

export const unlinkAccount = async (accountId: string): Promise<ConnectedAccount> =>
  toAccount((await apiUnlinkAccount({ path: { account_id: accountId }, throwOnError: true })).data);

export const deleteAccount = async (accountId: string): Promise<{ deleted_messages: number }> =>
  (await apiDeleteAccount({ path: { account_id: accountId }, throwOnError: true })).data;

export const createAccount = async (input: CreateAccountInput): Promise<ConnectedAccount> =>
  toAccount((await apiCreateAccount({ body: input, throwOnError: true })).data);

// -- messages ----------------------------------------------------------

/**
 * The console's "all" sentinel is dropped rather than sent.
 *
 * The API expresses "do not narrow by this" as an absent parameter; the
 * console expresses it as the string "all". Translating here keeps that
 * vocabulary out of the API, where it would have to be special-cased in
 * every filter.
 */
export const getMessages = async (
  filters: MessageFilters = {},
  page: PageParams = { limit: DEFAULT_PAGE_SIZE, offset: 0 },
): Promise<Page<Message>> => {
  const { data } = await browseMessages({
    query: {
      // `exactOptionalPropertyTypes` + the generated query type (`Platform |
      // null`, never `undefined`) means "narrow by nothing" has to be sent as
      // `null`, not omitted-via-undefined.
      platform: filters.platform === "all" ? null : (filters.platform ?? null),
      category: filters.category === "all" ? null : (filters.category ?? null),
      sent_from: filters.from ?? null,
      sent_to: filters.to ?? null,
      search: filters.search ?? null,
      limit: page.limit,
      offset: page.offset,
    },
    throwOnError: true,
  });
  return toPage(data, toMessage);
};

// -- summaries -----------------------------------------------------------

const summaryQuery = (range?: SummaryRange) => ({
  range_from: range?.from ?? null,
  range_to: range?.to ?? null,
});

export const getUserSummary = async (id: string, range?: SummaryRange): Promise<Summary> =>
  toSummary(
    (
      await apiGetUserSummary({
        path: { user_id: id },
        query: summaryQuery(range),
        throwOnError: true,
      })
    ).data,
  );

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

// -- organization --------------------------------------------------------

export const getOrgNodes = async (): Promise<OrgNode[]> =>
  (await listOrgNodes({ throwOnError: true })).data.map(toOrgNode);

export const createOrgNode = async (input: CreateOrgNodeInput): Promise<OrgNode> =>
  toOrgNode((await apiCreateOrgNode({ body: input, throwOnError: true })).data);

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
    (
      await apiUpdateOrgNode({
        path: { node_id: id },
        body: { ...changes, reparent: "parent_id" in changes },
        throwOnError: true,
      })
    ).data,
  );

export const deleteOrgNode = async (id: string): Promise<{ id: string; promoted: number }> =>
  (await apiDeleteOrgNode({ path: { node_id: id }, throwOnError: true })).data;

export const assignOrgMember = async (nodeId: string, userId: string): Promise<OrgNode> =>
  toOrgNode(
    (
      await apiAssignOrgMember({
        path: { node_id: nodeId },
        body: { user_id: userId },
        throwOnError: true,
      })
    ).data,
  );

export const removeOrgMember = async (nodeId: string, userId: string): Promise<OrgNode> =>
  toOrgNode(
    (
      await apiRemoveOrgMember({
        path: { node_id: nodeId, user_id: userId },
        throwOnError: true,
      })
    ).data,
  );

// -- platform --------------------------------------------------------------

export const getConnectors = async (): Promise<Connector[]> =>
  (await listConnectors({ throwOnError: true })).data.map(toConnector);

export const getIngestionRuns = async (platform?: Platform): Promise<IngestionRun[]> =>
  (await listIngestionRuns({ query: { platform: platform ?? null }, throwOnError: true })).data.map(
    toIngestionRun,
  );

/**
 * Queues a run; it does not wait for one.
 *
 * The API answers 202 with a `run_id`. Against a local model a run takes
 * minutes, so the result is polled via `getRunStatus` rather than awaited on
 * an open connection.
 */
export const triggerIngestionRun = async (
  platform: Platform,
  options: TriggerRunOptions = {},
): Promise<QueuedRun> =>
  toQueuedRun((await runIngestion({ path: { platform }, body: options, throwOnError: true })).data);

export const getRunStatus = async (platform: Platform, runId: string): Promise<RunProgress> =>
  toRunProgress(
    (await apiGetRunStatus({ path: { platform, run_id: runId }, throwOnError: true })).data,
  );

export const getIngestionConfig = async (platform: Platform): Promise<IngestionConfig> =>
  toIngestionConfig((await apiGetIngestionConfig({ path: { platform }, throwOnError: true })).data);

export const getActiveRuns = async (): Promise<ActiveRuns> =>
  toActiveRuns((await apiGetActiveRuns({ throwOnError: true })).data);

// -- unversioned probes ------------------------------------------------
//
// `/health` and `/ready` are mounted outside `API_VERSIONS` on the backend, so
// they never appear in the exported OpenAPI schema and have no generated
// operation to call - see `getRoot`'s docstring in `../../http`.

export const getHealth = (): Promise<HealthResponse> => getRoot<HealthResponse>("/health");

export const getReadiness = (): Promise<ReadinessResponse> => getRoot<ReadinessResponse>("/ready");
