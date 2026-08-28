import auth from "./locales/en/auth.json";
import common from "./locales/en/common.json";
import dashboard from "./locales/en/dashboard.json";
import ingestion from "./locales/en/ingestion.json";
import integrations from "./locales/en/integrations.json";
import messages from "./locales/en/messages.json";
import nav from "./locales/en/nav.json";
import organization from "./locales/en/organization.json";
import people from "./locales/en/people.json";
import settings from "./locales/en/settings.json";
import system from "./locales/en/system.json";

/**
 * The English catalog doubles as the type source for every translation key —
 * see `i18next.d.ts`. Adding a key here makes it available to `t()` with full
 * autocomplete; misspelling one is a compile error.
 */
export const en = {
  common,
  nav,
  auth,
  dashboard,
  people,
  organization,
  messages,
  ingestion,
  integrations,
  system,
  settings,
} as const;

export const resources = { en } as const;

export type Resources = typeof en;
