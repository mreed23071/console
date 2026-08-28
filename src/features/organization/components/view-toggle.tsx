import { GitBranch, LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export type OrgView = "chart" | "tree";

const OPTIONS = [
  { key: "chart", labelKey: "view.chart", Icon: LayoutGrid },
  { key: "tree", labelKey: "view.tree", Icon: GitBranch },
] as const;

export function ViewToggle({
  value,
  onChange,
}: {
  value: OrgView;
  onChange: (view: OrgView) => void;
}) {
  const { t } = useTranslation("organization");

  return (
    <div
      role="group"
      aria-label={t("view.label")}
      className="inline-flex shrink-0 items-center gap-1 rounded-md bg-muted p-1"
    >
      {OPTIONS.map(({ key, labelKey, Icon }) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            value === key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-3.5" aria-hidden /> {t(labelKey as never)}
        </button>
      ))}
    </div>
  );
}
