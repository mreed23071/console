import i18next, { type i18n as I18nInstance, type InitOptions } from "i18next";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LANGUAGE, DEFAULT_NAMESPACE, type Language, NAMESPACES } from "./config";
import { resources } from "./resources";

/**
 * Catalogs are bundled rather than fetched, so the instance initialises
 * synchronously. That matters for SSR: the server renders with the same
 * strings the client hydrates with, so there is no flash of untranslated
 * content and no hydration mismatch.
 */
function createInstance(language: Language = DEFAULT_LANGUAGE): I18nInstance {
  const instance = i18next.createInstance();

  // Surface missing keys loudly in development instead of silently rendering
  // the key name. Spread conditionally: `exactOptionalPropertyTypes` rejects
  // an explicit `undefined` on an optional property.
  const devOptions: Partial<InitOptions> = import.meta.env.DEV
    ? {
        saveMissing: true,
        missingKeyHandler: (_lngs, ns, key) => {
          console.warn(`[i18n] Missing translation: ${ns}:${key}`);
        },
      }
    : {};

  void instance.use(initReactI18next).init({
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    ns: [...NAMESPACES],
    defaultNS: DEFAULT_NAMESPACE,
    resources,
    interpolation: {
      // React already escapes rendered values.
      escapeValue: false,
    },
    ...devOptions,
  });

  return instance;
}

export const i18n = createInstance();

export async function changeLanguage(language: Language): Promise<void> {
  await i18n.changeLanguage(language);
}

export { createInstance };
export * from "./config";
