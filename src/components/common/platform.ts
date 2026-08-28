import { useTranslation } from "react-i18next";

import type { Platform } from "@/lib/api/types";

/** Every platform the console knows about, in display order. */
export const PLATFORMS: Platform[] = ["slack", "github", "teams", "email", "linear"];

/**
 * Platform names are proper nouns and stay untranslated in English, but they
 * still live in the catalog so a locale can transliterate them if it needs to.
 */
export function usePlatformLabels(): Record<Platform, string> {
  const { t } = useTranslation("common");
  return {
    slack: t("platform.slack"),
    github: t("platform.github"),
    teams: t("platform.teams"),
    email: t("platform.email"),
    linear: t("platform.linear"),
  };
}
