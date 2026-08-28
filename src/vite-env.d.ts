/// <reference types="vite/client" />

/**
 * Typed environment variables.
 *
 * Declaring them explicitly matters here: `noPropertyAccessFromIndexSignature`
 * is on, so `import.meta.env.VITE_API_BASE_URL` only compiles because of this
 * interface. Vite exposes `VITE_`-prefixed variables to the client bundle;
 * anything else stays server-side.
 */
interface ImportMetaEnv {
  /** Base URL for the Threadline API. Defaults to the in-browser mock at /v1. */
  readonly VITE_API_BASE_URL?: string;
  /**
   * Set to "false" to call the real API instead of the in-browser mock
   * database. Defaults to the mock, so the console runs standalone and the
   * endpoint test suite is unaffected.
   */
  readonly VITE_USE_MOCKS?: string;
  /**
   * API key for the routes that are still scope-protected — the ingestion
   * ones. Unset means those calls answer 401; everything else works without it.
   */
  readonly VITE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
