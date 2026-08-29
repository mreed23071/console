export type Platform = "slack" | "github" | "teams" | "email" | "linear" | "other";
export type FilterCategory = "business" | "personal" | "automated" | "unclear";
export type RunStatus = "success" | "partial" | "failed";

export interface Person {
  id: string;
  email: string;
  full_name: string;
  display_name: string;
  job_title: string;
  address: string;
  employment_start: string | null;
  employment_end: string | null;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonNote {
  id: string;
  user_id: string;
  author: string;
  body: string;
  created_at: string;
}

export interface ConnectedAccount {
  id: string;
  user_id: string | null;
  platform: Platform;
  external_id: string;
  external_handle: string;
  external_email: string;
  is_primary: boolean;
  created_at: string;
}

export type CommitFileStatus = "added" | "modified" | "removed";

export interface CommitFile {
  path: string;
  status: CommitFileStatus;
  additions: number;
  deletions: number;
}

export interface CommitDetail {
  sha: string;
  repository: string;
  branch: string;
  url: string;
  files: CommitFile[];
  additions: number;
  deletions: number;
  ai_summary: string;
  ai_summary_generated_at: string;
}

export interface Message {
  kind: "message" | "commit";
  commit?: CommitDetail;
  id: string;
  sender_user_id: string | null;
  sender_relation_id: string;
  platform: Platform;
  external_message_id: string;
  conversation_id: string;
  content: string;
  embedding_model: string;
  filter_category: FilterCategory;
  filter_reason: string;
  sent_at: string;
}

export interface SummaryRange {
  from?: string | undefined;
  to?: string | undefined;
}

export interface Summary {
  summary: string;
  summary_error: string | null;
  generated_at: string;
  message_count: number;
  recent_messages: Message[];
  range_from: string | null;
  range_to: string | null;
  range_label: string;
}

export interface RunDecision {
  id: string;
  keep: boolean;
  category: FilterCategory;
  reason: string;
}

export interface IngestionRun {
  run_id: string;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  dry_run: boolean;
  /** Null only for runs recorded before ingestion was split per platform. */
  platform: Platform | null;
  fetched: number;
  already_ingested: number;
  evaluated: number;
  retained: number;
  discarded: number;
  embedded: number;
  persisted: number;
  users_provisioned: number;
  filter_provider: string;
  embedding_model: string;
  filter_errors: number;
  status: RunStatus;
  decisions: RunDecision[];
}

/** What a trigger returns now that runs are queued rather than awaited. */
export interface QueuedRun {
  run_id: string;
  platform: Platform;
  status: string;
  workflow_id: string;
  dry_run: boolean;
}

/** A run in flight, or its final counters. Polled until `status` is terminal. */
export interface RunProgress {
  run_id: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  stage: string;
  fetched: number;
  evaluated: number;
  filtered: number;
  embedded: number;
  persisted: number;
  result: IngestionRun | null;
}

export interface IngestionConfig {
  platform: Platform;
  filter_system_prompt: string;
  llm_provider: string;
  embedding_model: string;
  embedding_dim: number;
  embedding_executor: string;
  embedding_workers: number;
}

export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
}

export interface ReadinessResponse {
  status: string;
  database: boolean;
  embeddings: boolean;
}

export interface Connector {
  platform: Platform;
  status: "connected" | "degraded" | "needs_attention" | "disconnected";
  last_sync_at: string | null;
  messages_contributed: number;
  account_count: number;
}

export interface PersonWithMeta extends Person {
  platforms: Platform[];
  message_count: number;
  last_summary_at: string | null;
}

export interface MessageFilters {
  platform?: Platform | "all" | undefined;
  category?: FilterCategory | "all" | undefined;
  from?: string | undefined;
  to?: string | undefined;
  search?: string | undefined;
}

/** Offset pagination request. Mirrors the API's `limit`/`offset` query params. */
export interface PageParams {
  limit: number;
  offset: number;
}

export const DEFAULT_PAGE_SIZE = 20;

/** The largest page the API will hand back in one request. */
export const MAX_PAGE_SIZE = 100;

/**
 * One page of results, plus enough to render "1-20 of 159" and a next button
 * without the caller re-deriving it from `total`/`limit`/`offset` itself.
 */
export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * A node in the organization hierarchy: a division, department or unit.
 *
 * The tree is stored as an adjacency list — `parent_id` plus a flat array —
 * so re-parenting is a single-field update and the client can rebuild the
 * tree in one pass. A `parent_id` of null means the node is a root.
 */
export interface OrgNode {
  id: string;
  name: string;
  subtitle: string;
  parent_id: string | null;
  /** 0-indexed order among this node's siblings. */
  position: number;
  /** Ids of the people assigned here. A person belongs to one node at a time. */
  member_ids: string[];
  created_at: string;
}
