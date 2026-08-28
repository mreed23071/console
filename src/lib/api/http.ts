/**
 * The transport the endpoint layer uses to reach the FastAPI service.
 *
 * Deliberately small, and deliberately temporary. The API publishes an OpenAPI
 * schema and the repository is configured to generate a typed client from it
 * (`bun run openapi:sync`); once that client exists this file is replaced by it
 * and the endpoint modules change one import. Until the schema has been
 * exported from a running app, this keeps the console able to talk to the API
 * without a second hand-maintained copy of every request shape - each function
 * here names a path and a verb and nothing else.
 *
 * What it does own, and what the generated client will inherit:
 *
 * * one base URL, read from the environment,
 * * the API's error envelope turned into a typed `ApiError`,
 * * query strings that omit undefined values rather than sending "undefined".
 */

/** The error envelope every failing route returns. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    request_id?: string | null;
  };
}

/**
 * A failed request, carrying the parts of the response worth acting on.
 *
 * `code` is the stable identifier to branch on; `message` is for people.
 * `requestId` is what a user should quote when something goes wrong, because it
 * is the only way to find the matching server log.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;
  readonly requestId: string | null;

  constructor(status: number, body: ApiErrorBody | null, fallback: string) {
    super(body?.error?.message ?? fallback);
    this.name = "ApiError";
    this.status = status;
    this.code = body?.error?.code ?? "unknown";
    this.details = body?.error?.details ?? {};
    this.requestId = body?.error?.request_id ?? null;
  }

  /** True when the record was not there, which callers often handle specially. */
  get isNotFound(): boolean {
    return this.status === 404;
  }
}

/** Where the API lives. Trailing slashes are trimmed so joins stay predictable. */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api/v1").replace(/\/+$/, "");

/**
 * Credential for the routes that are still scope-protected.
 *
 * Most of the API is deliberately open while the platforms are wired together,
 * but the ingestion routes are not — they were protected before this work
 * started and opening them to get a button working would be the wrong trade.
 * Set `VITE_API_KEY` to a key with `ingest:run` and `ingest:read` (the
 * backend's `.env.example` ships one) and those routes work; leave it unset and
 * they answer 401, which is the honest result.
 */
const API_KEY = import.meta.env.VITE_API_KEY;

/** The origin, for the probes that live outside the versioned prefix. */
export const API_ROOT_URL = API_BASE_URL.replace(/\/api\/v\d+$/, "");

export type QueryValue = string | number | boolean | undefined | null;

/**
 * Builds a query string, dropping anything unset.
 *
 * Without this, an optional filter left empty would be sent as the literal
 * string "undefined" and the API would try to parse it — a class of bug that
 * only shows up when a user clears a filter.
 */
function queryString(params: Record<string, QueryValue> | undefined): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, String(value));
    }
  }
  const rendered = search.toString();
  return rendered ? `?${rendered}` : "";
}

interface RequestOptions {
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
  /** Treat `path` as complete, for the probes outside the versioned prefix. */
  absolute?: boolean;
}

/**
 * Issue one request and return the raw response, or throw `ApiError` for any
 * non-2xx status. `request` and `getPage` both build on this; the former
 * discards the response after parsing its body, the latter also needs its
 * headers.
 */
async function fetchResponse(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (API_KEY) headers["X-API-Key"] = API_KEY;

  const base = options.absolute ? "" : API_BASE_URL;

  // Built up rather than declared inline: `exactOptionalPropertyTypes` draws a
  // distinction between "absent" and "present but undefined", and `fetch`
  // accepts the first but not the second.
  const init: RequestInit = { method, headers };
  if (options.body !== undefined) init.body = JSON.stringify(options.body);
  if (options.signal) init.signal = options.signal;

  const response = await fetch(`${base}${path}${queryString(options.query)}`, init);

  if (!response.ok) {
    // A gateway or a proxy can fail before FastAPI is reached, in which case
    // the body is HTML rather than the envelope. Parsing defensively keeps the
    // thrown error useful instead of replacing it with a JSON syntax error.
    let body: ApiErrorBody | null = null;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = null;
    }
    throw new ApiError(response.status, body, `${method} ${path} failed`);
  }

  return response;
}

/**
 * Issue one request and return its parsed body.
 *
 * Throws `ApiError` for any non-2xx response, so callers can use plain
 * `await` and let React Query surface the failure rather than checking a
 * status code at thirty call sites.
 */
export async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetchResponse(method, path, options);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const get = <T>(path: string, query?: Record<string, QueryValue>): Promise<T> =>
  request<T>("GET", path, query === undefined ? {} : { query });

/**
 * A route whose body stays a flat array either way, but whose pagination
 * metadata (when `query` asks for a page) rides on `X-Total-Count` /
 * `X-Has-More` response headers instead of an envelope - see `GET /users`.
 * Absent headers (the unpaged response) read back as `total: 0, hasMore:
 * false`; callers that asked for a page always get real values back, since
 * the API sets both headers whenever a page was requested.
 */
export async function getPage<T>(
  path: string,
  query?: Record<string, QueryValue>,
): Promise<{ items: T; total: number; hasMore: boolean }> {
  const response = await fetchResponse("GET", path, query === undefined ? {} : { query });
  const items = (await response.json()) as T;
  return {
    items,
    total: Number(response.headers.get("X-Total-Count") ?? 0),
    hasMore: response.headers.get("X-Has-More") === "true",
  };
}

export const post = <T>(path: string, body?: unknown): Promise<T> =>
  request<T>("POST", path, { body: body ?? {} });

export const patch = <T>(path: string, body: unknown): Promise<T> =>
  request<T>("PATCH", path, { body });

export const del = <T>(path: string): Promise<T> => request<T>("DELETE", path);

/** GET against the origin rather than the versioned prefix. */
export const getRoot = <T>(path: string): Promise<T> =>
  request<T>("GET", `${API_ROOT_URL}${path}`, { absolute: true });
