/**
 * Translating API responses into the shapes the console already renders.
 *
 * These exist because the two sides disagree in exactly two ways, and both are
 * worth being explicit about rather than papering over:
 *
 * **Nullability.** The API returns `null` for anything unset, because that is
 * what the column holds. The console's types were written against mock data
 * that always filled every field, so they expect strings. Each adapter picks
 * the empty value the UI already renders correctly.
 *
 * **One honest rename.** `PersonWithMeta.last_summary_at` never held a summary
 * time - it held the timestamp of the person's most recent message. The API
 * calls it `last_message_at`. The adapter maps it rather than propagating the
 * wrong name, and when the generated client replaces `types.ts` the console's
 * field will be renamed with it.
 *
 * Every adapter here disappears when the OpenAPI client is generated: its types
 * become the console's types, and the mapping becomes an identity.
 */
import type {
  ConnectedAccount,
  Connector,
  IngestionRun,
  Message,
  OrgNode,
  Page,
  Person,
  PersonNote,
  PersonWithMeta,
  Platform,
  Summary,
} from "../../types";
import type { UnlinkedAccount } from "../accounts";

/** Shape of one person as the API returns it. */
export interface ApiUser {
  id: string;
  email: string;
  full_name: string;
  display_name: string | null;
  job_title: string | null;
  address: string | null;
  employment_start: string | null;
  employment_end: string | null;
  timezone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiUserListItem extends ApiUser {
  platforms: Platform[];
  message_count: number;
  last_message_at: string | null;
  department_id: string | null;
}

export interface ApiAccount {
  id: string;
  user_id: string | null;
  platform: Platform;
  external_id: string;
  external_handle: string | null;
  external_email: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface ApiUnlinkedAccount extends ApiAccount {
  message_count: number;
  last_seen_at: string | null;
}

/** The v1 pagination envelope every offset-paged list route returns. */
export interface ApiPage<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export const toPage = <TApi, T>(page: ApiPage<TApi>, mapper: (row: TApi) => T): Page<T> => ({
  items: page.items.map(mapper),
  total: page.total,
  limit: page.limit,
  offset: page.offset,
  hasMore: page.has_more,
});

export interface ApiMessage {
  id: string;
  kind: string;
  sender_user_id: string | null;
  sender_relation_id: string | null;
  platform: Platform;
  external_message_id: string;
  conversation_id: string | null;
  content: string;
  embedding_model: string | null;
  filter_category: string | null;
  filter_reason: string | null;
  sent_at: string;
  commit?: Message["commit"];
}

export interface ApiOrgNode {
  id: string;
  name: string;
  subtitle: string | null;
  parent_id: string | null;
  member_ids: string[];
  created_at: string;
}

export interface ApiNote {
  id: string;
  user_id: string;
  author: string;
  body: string;
  created_at: string;
}

export interface ApiSummary {
  user_id: string;
  summary: string | null;
  summary_error: string | null;
  generated_at: string | null;
  message_count: number;
  recent_messages: Array<{ id: string; platform: Platform; content: string; sent_at: string }>;
  range_from: string | null;
  range_to: string | null;
}

export const toPerson = (row: ApiUser): Person => ({
  id: row.id,
  email: row.email,
  full_name: row.full_name,
  display_name: row.display_name ?? "",
  job_title: row.job_title ?? "",
  address: row.address ?? "",
  employment_start: row.employment_start,
  employment_end: row.employment_end,
  timezone: row.timezone ?? "UTC",
  is_active: row.is_active,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const toPersonWithMeta = (row: ApiUserListItem): PersonWithMeta => ({
  ...toPerson(row),
  platforms: row.platforms,
  message_count: row.message_count,
  last_summary_at: row.last_message_at,
});

export const toAccount = (row: ApiAccount): ConnectedAccount => ({
  id: row.id,
  user_id: row.user_id,
  platform: row.platform,
  external_id: row.external_id,
  external_handle: row.external_handle ?? "",
  external_email: row.external_email ?? "",
  is_primary: row.is_primary,
  created_at: row.created_at,
});

export const toUnlinkedAccount = (row: ApiUnlinkedAccount): UnlinkedAccount => ({
  ...toAccount(row),
  message_count: row.message_count,
  last_seen_at: row.last_seen_at,
});

export const toMessage = (row: ApiMessage): Message => ({
  kind: row.kind === "commit" ? "commit" : "message",
  ...(row.commit ? { commit: row.commit } : {}),
  id: row.id,
  sender_user_id: row.sender_user_id,
  sender_relation_id: row.sender_relation_id ?? "",
  platform: row.platform,
  external_message_id: row.external_message_id,
  conversation_id: row.conversation_id ?? "",
  content: row.content,
  embedding_model: row.embedding_model ?? "",
  filter_category: (row.filter_category ?? "unclear") as Message["filter_category"],
  filter_reason: row.filter_reason ?? "",
  sent_at: row.sent_at,
});

export const toOrgNode = (row: ApiOrgNode): OrgNode => ({
  id: row.id,
  name: row.name,
  subtitle: row.subtitle ?? "",
  parent_id: row.parent_id,
  member_ids: row.member_ids,
  created_at: row.created_at,
});

export const toNote = (row: ApiNote): PersonNote => ({
  id: row.id,
  user_id: row.user_id,
  author: row.author,
  body: row.body,
  created_at: row.created_at,
});

/**
 * Describes a date window in words.
 *
 * A stopgap, and marked as one. The API deliberately does not send this string:
 * it is English prose and this console is localised, so composing it on the
 * server would make it untranslatable. Building it here is only marginally
 * better - the right home is a translation token with the dates interpolated,
 * which is a change to the component that renders it rather than to this layer.
 */
export function describeRange(from: string | null, to: string | null): string {
  const day = (value: string) => value.slice(0, 10);
  if (from && to) return `${day(from)} – ${day(to)}`;
  if (from) return `since ${day(from)}`;
  if (to) return `up to ${day(to)}`;
  return "all retained history";
}

export const toSummary = (row: ApiSummary): Summary => ({
  summary: row.summary ?? "",
  summary_error: row.summary_error,
  generated_at: row.generated_at ?? new Date().toISOString(),
  message_count: row.message_count,
  recent_messages: row.recent_messages as unknown as Message[],
  range_from: row.range_from,
  range_to: row.range_to,
  range_label: describeRange(row.range_from, row.range_to),
});

export const toConnector = (row: Connector): Connector => row;
export const toIngestionRun = (row: IngestionRun): IngestionRun => row;
