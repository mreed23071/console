import { useEffect } from "react";

import { i18n } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui";

/**
 * Applies the persisted theme and language to the document and the i18n
 * instance. Called by every top-level layout (including the unauthenticated
 * login screen) so preferences survive a sign-out.
 *
 * Both run in an effect rather than during render so the server-rendered
 * markup always matches the default, avoiding a hydration mismatch.
 */
export function useAppPreferences(): void {
  const theme = useUIStore((s) => s.theme);
  const language = useUIStore((s) => s.language);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    if (i18n.language !== language) void i18n.changeLanguage(language);
  }, [language]);
}
