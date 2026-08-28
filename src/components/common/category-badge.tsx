import { CATEGORY_COLORS, useCategoryLabels } from "@/components/common/category";
import type { FilterCategory } from "@/lib/api/types";

export function CategoryBadge({ category }: { category: FilterCategory }) {
  const labels = useCategoryLabels();
  const color = CATEGORY_COLORS[category];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}1F`, borderColor: `${color}59`, color }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {labels[category]}
    </span>
  );
}
