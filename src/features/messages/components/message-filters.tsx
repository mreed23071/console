import { useTranslation } from "react-i18next";

import { CATEGORY_ORDER, useCategoryLabels } from "@/components/common/category";
import { PLATFORMS, usePlatformLabels } from "@/components/common/platform";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterCategory, Platform } from "@/lib/api/types";

export interface MessageFilterState {
  platform: Platform | "all";
  category: FilterCategory | "all";
  from: string;
  to: string;
  search: string;
}

export function MessageFilters({
  value,
  onChange,
}: {
  value: MessageFilterState;
  onChange: (patch: Partial<MessageFilterState>) => void;
}) {
  const { t } = useTranslation(["messages", "common"]);
  const platformLabels = usePlatformLabels();
  const categoryLabels = useCategoryLabels();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1">
        <Input
          value={value.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder={t("messages:searchPlaceholder")}
          aria-label={t("messages:filter.searchLabel")}
        />
      </div>

      <Select
        value={value.platform}
        onValueChange={(v) => onChange({ platform: v as Platform | "all" })}
      >
        <SelectTrigger className="w-[140px]" aria-label={t("messages:filter.platformLabel")}>
          <SelectValue placeholder={t("common:label.platform")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("messages:filter.allPlatforms")}</SelectItem>
          {PLATFORMS.map((p) => (
            <SelectItem key={p} value={p}>
              {platformLabels[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.category}
        onValueChange={(v) => onChange({ category: v as FilterCategory | "all" })}
      >
        <SelectTrigger className="w-[150px]" aria-label={t("messages:filter.categoryLabel")}>
          <SelectValue placeholder={t("common:label.category")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("messages:filter.allCategories")}</SelectItem>
          {CATEGORY_ORDER.map((c) => (
            <SelectItem key={c} value={c}>
              {categoryLabels[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={value.from}
        onChange={(e) => onChange({ from: e.target.value })}
        className="w-[150px]"
        aria-label={t("messages:filter.fromDate")}
      />
      <Input
        type="date"
        value={value.to}
        onChange={(e) => onChange({ to: e.target.value })}
        className="w-[150px]"
        aria-label={t("messages:filter.toDate")}
      />
    </div>
  );
}
