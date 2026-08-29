/**
 * Configures the generated OpenAPI client, and the app's error type.
 *
 * The generated client (`bun run openapi:sync`, output in `lib/api/generated/`)
 * owns the actual transport now — this file no longer hand-rolls `fetch`. What
 * it still owns:
 *
 * * pointing the generated client at the right base URL and credential,
 * * turning the API's error envelope into a typed `ApiError` once, via the
 *   client's error interceptor, so every endpoint function gets that behavior
 *   for free instead of repeating a try/catch,
 * * `getRoot`, a small hand-rolled `fetch` for the two probes
 *   (`/health`, `/ready`) that live outside the versioned API and therefore
 *   have no operation in the generated client to call.
 */
import { client } from "@/lib/api/generated/client.gen";

/** Where the API lives. Trailing slashes are trimmed so joins stay predictable. */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api/v1").replace(/\/+$/, "");

/** The origin, for the probes that live outside the versioned prefix. */
export const API_ROOT_URL = API_BASE_URL.replace(/\/api\/v\d+$/, "");

/**
 * Credential for the routes that are still scope-protected.
 *
 * Most of the API is deliberately open while the platforms are wired together,
 * but the ingestion routes are not — they were protected before this work
 * started and opening them to get a button working would be the wrong trade.
 * Set `VITE_API_KEY` to a key with `ingest:run` and `ingest:read` (the
 * backend's `.env.example` ships one) and those routes work; leave it unset and
 * they answer 401, which is the honest result.
 *
 * Sent as a default header rather than through the generated client's `auth`
 * option: the schema declares two alternative security schemes per operation
 * (`X-API-Key`, `X-Dev-User`), and resolving "which one, from where" through
 * that machinery buys nothing here — a static header applied to every request
 * is the same behavior the hand-rolled transport had before this file existed.
 */
const API_KEY: string | undefined = import.meta.env.VITE_API_KEY;

/**
 * `API_ROOT_URL`, not `API_BASE_URL`, is what the generated client's `baseUrl`
 * needs: every operation URL in `lib/api/generated/sdk.gen.ts` is already the
 * full path from the OpenAPI schema, version prefix included (e.g.
 * `"/api/v1/users"`). Configuring `baseUrl: API_BASE_URL` (which already ends
 * in `/api/v1`) would double it up into `/api/v1/api/v1/users` and 404 on
 * every single request — this bit a live smoke test against the real backend
 * during the migration to the generated client, which is exactly the kind of
 * mistake this comment exists to keep from happening twice.
 */
client.setConfig({
  baseUrl: API_ROOT_URL,
  throwOnError: true,
  ...(API_KEY ? { headers: { "X-API-Key": API_KEY } } : {}),
});

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

/**
 * Runs once for every non-2xx response, on every generated SDK call.
 *
 * With `throwOnError: true`, the client throws whatever this returns — so
 * this is the one place a raw parsed error body becomes an `ApiError`
 * instance, instead of every endpoint function doing it themselves.
 */
client.interceptors.error.use((error, response) => {
  const body = (error ?? null) as ApiErrorBody | null;
  return new ApiError(response.status, body, `${response.status} request failed`);
});

/**
 * GET against the origin rather than the versioned prefix — for `/health` and
 * `/ready`, which are mounted outside `API_VERSIONS` on the backend and so
 * never appear in the exported OpenAPI schema. Everything schema-backed goes
 * through the generated client instead; this is the one place a request is
 * still built by hand, because there is nothing to generate it from.
 */
export async function getRoot<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (API_KEY) headers["X-API-Key"] = API_KEY;

  const response = await fetch(`${API_ROOT_URL}${path}`, { headers });
  if (!response.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = null;
    }
    throw new ApiError(response.status, body, `GET ${path} failed`);
  }
  return (await response.json()) as T;
}
