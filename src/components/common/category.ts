import { useTranslation } from "react-i18next";

import type { FilterCategory } from "@/lib/api/types";

export const CATEGORY_COLORS: Record<FilterCategory, string> = {
  business: "#2A78D6",
  personal: "#EB6834",
  automated: "#1BAF7A",
  unclear: "#EDA100",
};

/** Display order for charts, filters and legends. */
export const CATEGORY_ORDER: FilterCategory[] = ["business", "personal", "automated", "unclear"];

export function useCategoryLabels(): Record<FilterCategory, string> {
  const { t } = useTranslation("common");
  return {
    business: t("category.business"),
    personal: t("category.personal"),
    automated: t("category.automated"),
    unclear: t("category.unclear"),
  };
}
