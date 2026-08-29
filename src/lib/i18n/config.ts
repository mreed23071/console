/**
 * Localization configuration.
 *
 * Adding a language means: add its code to SUPPORTED_LANGUAGES, create
 * `locales/<code>/` with one JSON file per namespace, and register it in
 * `resources.ts`. Nothing else in the app needs to change.
 */
export const SUPPORTED_LANGUAGES = ["en"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "en";

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
};

/**
 * One namespace per feature area, mirroring `src/features/*`. Keeping them
 * separate means a translator can work on one screen without touching others,
 * and lets us lazy-load catalogs later without restructuring keys.
 */
export const NAMESPACES = [
  "common",
  "nav",
  "auth",
  "dashboard",
  "people",
  "organization",
  "messages",
  "ingestion",
  "integrations",
  "system",
  "settings",
] as const;

export type Namespace = (typeof NAMESPACES)[number];

export const DEFAULT_NAMESPACE: Namespace = "common";

/** Persisted language preference key, shared with the UI store. */
export const LANGUAGE_STORAGE_KEY = "mabinsoft-language";
