import type { DEFAULT_NAMESPACE } from "./config";
import type { Resources } from "./resources";

/**
 * Binds i18next's `t()` to the English catalog, so every namespace and key is
 * checked at compile time. `t("people:list.titel")` fails to typecheck.
 */
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: typeof DEFAULT_NAMESPACE;
    resources: Resources;
  }
}

export {};
