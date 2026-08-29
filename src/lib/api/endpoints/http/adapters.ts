/**
 * Translating generated OpenAPI types into the shapes the console already
 * renders.
 *
 * The generated client (`bun run openapi:sync`) makes these honest schema
 * mappings rather than hand-typed guesses — every field here traces back to
 * `lib/api/generated/types.gen.ts`, which is itself generated from the
 * backend's own committed schema. They still exist, rather than making
 * `types.ts` an alias of the generated types directly, for two reasons worth
 * being explicit about:
 *
 * **Nullability.** The API returns `null` for anything unset, because that is
 * what the column holds. The console's types were written against mock data
 * that always fills every field, so they expect strings. Each adapter picks
 * the empty value the UI already renders correctly.
 *
 * **One honest rename.** `PersonWithMeta.last_summary_at` never held a summary
 * time - it held the timestamp of the person's most recent message. The API
 * calls it `last_message_at`. The adapter maps it rather than propagating the
 * wrong name into the console's own vocabulary.
 *
 * A field on a generated type that the console doesn't render is simply
 * dropped here rather than carried through — `types.ts` is what a component
 * can rely on, not everything the schema happens to expose.
 */
import type {
  ActiveRunsResponse,
  CommitDetail as ApiCommitDetail,
  ConnectorRead,
  FilterDecisionRead,
  ForgetUserResponse as ApiForgetUserResponse,
  IngestionConfigResponse,
  IngestionRunResponse,
  IngestionRunSummary,
  MessageRead,
  NoteRead,
  OrgNodeRead,
  PersonSummaryResponse,
  QueuedRunResponse,
  RunProgressResponse,
  UnlinkedAccountRead,
  UserDetail,
  UserListItem,
  UserRelationRead,
} from "@/lib/api/generated/types.gen";

import type {
  ActiveRuns,
  CommitDetail,
  ConnectedAccount,
  Connector,
  IngestionConfig,
  IngestionRun,
  Message,
  OrgNode,
  Page,
  Person,
  PersonNote,
  PersonWithMeta,
  QueuedRun,
  RunDecision,
  RunProgress,
  Summary,
} from "../../types";
import type { ForgetUserResult } from "../people";

const toCommitDetail = (row: ApiCommitDetail): CommitDetail => ({
  sha: row.sha,
  repository: row.repository,
  branch: row.branch ?? "",
  url: row.url ?? "",
  files: (row.files ?? []).map((f) => ({
    path: f.path,
    status: f.status as CommitDetail["files"][number]["status"],
    additions: f.additions ?? 0,
    deletions: f.deletions ?? 0,
  })),
  additions: row.additions ?? 0,
  deletions: row.deletions ?? 0,
  ai_summary: row.ai_summary ?? "",
  ai_summary_generated_at: row.ai_summary_generated_at ?? "",
});

export const toPerson = (row: UserDetail): Person => ({
  id: row.id,
  email: row.email,
  full_name: row.full_name,
  display_name: row.display_name ?? "",
  job_title: row.job_title ?? "",
  address: row.address ?? "",
  employment_start: row.employment_start ?? null,
  employment_end: row.employment_end ?? null,
  timezone: row.timezone ?? "UTC",
  is_active: row.is_active,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const toPersonWithMeta = (row: UserListItem): PersonWithMeta => ({
  ...toPerson(row),
  platforms: row.platforms ?? [],
  message_count: row.message_count ?? 0,
  last_summary_at: row.last_message_at ?? null,
});

export const toAccount = (row: UserRelationRead): ConnectedAccount => ({
  id: row.id,
  user_id: row.user_id ?? null,
  platform: row.platform,
  external_id: row.external_id,
  external_handle: row.external_handle ?? "",
  external_email: row.external_email ?? "",
  is_primary: row.is_primary ?? false,
  created_at: row.created_at,
});

export const toUnlinkedAccount = (
  row: UnlinkedAccountRead,
): ConnectedAccount & { message_count: number; last_seen_at: string | null } => ({
  ...toAccount(row),
  message_count: row.message_count ?? 0,
  last_seen_at: row.last_seen_at ?? null,
});

export const toMessage = (row: MessageRead): Message => ({
  kind: row.kind === "commit" ? "commit" : "message",
  ...(row.commit ? { commit: toCommitDetail(row.commit) } : {}),
  id: row.id,
  sender_user_id: row.sender_user_id ?? null,
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

export const toOrgNode = (row: OrgNodeRead): OrgNode => ({
  id: row.id,
  name: row.name,
  subtitle: row.subtitle ?? "",
  parent_id: row.parent_id ?? null,
  position: row.position,
  member_ids: row.member_ids ?? [],
  created_at: row.created_at,
});

export const toNote = (row: NoteRead): PersonNote => ({
  id: row.id,
  user_id: row.user_id,
  author: row.author,
  body: row.body,
  created_at: row.created_at,
});

export const toForgetResult = (row: ApiForgetUserResponse): ForgetUserResult => ({
  deleted_messages: row.deleted_messages,
  deleted_accounts: row.deleted_accounts,
});

export const toActiveRuns = (row: ActiveRunsResponse): ActiveRuns => ({
  count: row.count,
  runs: (row.runs ?? []).map((run) => ({
    run_id: run.run_id,
    platform: run.platform ?? null,
    stage: run.stage,
    started_at: run.started_at,
  })),
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

export const toSummary = (row: PersonSummaryResponse): Summary => ({
  summary: row.summary ?? "",
  summary_error: row.summary_error ?? null,
  generated_at: row.generated_at ?? new Date().toISOString(),
  message_count: row.message_count ?? 0,
  recent_messages: (row.recent_messages ?? []).map(
    (m) =>
      ({
        kind: "message",
        id: m.id,
        sender_user_id: null,
        sender_relation_id: "",
        platform: m.platform,
        external_message_id: "",
        conversation_id: "",
        content: m.content,
        embedding_model: "",
        filter_category: "unclear",
        filter_reason: "",
        sent_at: m.sent_at,
      }) satisfies Message,
  ),
  range_from: row.range_from ?? null,
  range_to: row.range_to ?? null,
  range_label: describeRange(row.range_from ?? null, row.range_to ?? null),
});

const toDecision = (row: FilterDecisionRead): RunDecision => ({
  id: row.id,
  keep: row.keep,
  category: row.category as RunDecision["category"],
  reason: row.reason ?? "",
});

/**
 * `IngestionRunSummary` (the history list) and `IngestionRunResponse` (one
 * run's own completion report) describe the same "a run finished" fact as two
 * different generated types, close enough to share a mapping for every field
 * except one: `IngestionRunResponse` carries no `status`. The history list's
 * row is built from stored data and includes the derived success/partial/
 * failed verdict; the raw completion report the pipeline itself returns does
 * not compute one. That's a real gap in the schema, not a frontend choice —
 * worth closing on the backend (adding `status` to `IngestionRunResponse`)
 * rather than papering over here indefinitely.
 *
 * Until then, a request-detail view (`RunProgress.result`) derives a
 * conservative verdict from the same counters a human would glance at:
 * nothing persisted despite work being done reads as failed, any filter
 * failures read as partial, otherwise success.
 */
const deriveStatus = (row: IngestionRunResponse): IngestionRun["status"] => {
  if (row.persisted === 0 && (row.fetched > 0 || row.evaluated > 0)) return "failed";
  if (row.filter_errors > 0) return "partial";
  return "success";
};

export const toIngestionRun = (row: IngestionRunSummary | IngestionRunResponse): IngestionRun => ({
  run_id: row.run_id,
  started_at: row.started_at,
  finished_at: row.finished_at ?? "",
  duration_ms: row.duration_ms,
  dry_run: row.dry_run,
  platform: row.platform ?? null,
  fetched: row.fetched,
  already_ingested: row.already_ingested,
  evaluated: row.evaluated,
  retained: row.retained,
  discarded: row.discarded,
  embedded: row.embedded,
  persisted: row.persisted,
  users_provisioned: row.users_provisioned,
  filter_provider: row.filter_provider ?? "",
  embedding_model: row.embedding_model ?? "",
  filter_errors: row.filter_errors,
  status: "status" in row ? (row.status as IngestionRun["status"]) : deriveStatus(row),
  decisions: (row.decisions ?? []).map(toDecision),
});

export const toQueuedRun = (row: QueuedRunResponse): QueuedRun => ({
  run_id: row.run_id,
  platform: row.platform,
  status: row.status ?? "queued",
  workflow_id: row.workflow_id,
  dry_run: row.dry_run ?? false,
});

export const toRunProgress = (row: RunProgressResponse): RunProgress => ({
  run_id: row.run_id,
  status: row.status as RunProgress["status"],
  stage: row.stage ?? "",
  fetched: row.fetched ?? 0,
  evaluated: row.evaluated ?? 0,
  filtered: row.filtered ?? 0,
  embedded: row.embedded ?? 0,
  persisted: row.persisted ?? 0,
  result: row.result ? toIngestionRun(row.result) : null,
});

export const toIngestionConfig = (row: IngestionConfigResponse): IngestionConfig => ({
  platform: row.platform,
  filter_system_prompt: row.filter_system_prompt,
  llm_provider: row.llm_provider,
  embedding_model: row.embedding_model,
  embedding_dim: row.embedding_dim,
  embedding_executor: row.embedding_executor,
  embedding_workers: row.embedding_workers,
});

export const toConnector = (row: ConnectorRead): Connector => ({
  platform: row.platform,
  status: row.status,
  last_sync_at: row.last_sync_at ?? null,
  messages_contributed: row.messages_contributed ?? 0,
  account_count: row.account_count ?? 0,
});

/** The v1 pagination envelope every offset-paged list route returns. */
interface ApiPage<T> {
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
