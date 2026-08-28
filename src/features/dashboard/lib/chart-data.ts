import { useMemo } from "react";

import { CATEGORY_COLORS, CATEGORY_ORDER, useCategoryLabels } from "@/components/common/category";
import type { Message } from "@/lib/api/types";

const DAY_MS = 86_400_000;
const VOLUME_DAYS = 14;

export interface CategoryDatum {
  category: string;
  label: string;
  count: number;
  fill: string;
}

export interface VolumeDatum {
  date: string;
  label: string;
  messages: number;
}

/** Message counts per filter category, in the catalog's display order. */
export function useCategoryData(messages: Message[] | undefined): CategoryDatum[] {
  const labels = useCategoryLabels();
  return useMemo(
    () =>
      CATEGORY_ORDER.map((c) => ({
        category: c,
        label: labels[c],
        count: (messages ?? []).filter((m) => m.filter_category === c).length,
        fill: CATEGORY_COLORS[c],
      })),
    [messages, labels],
  );
}

/**
 * Daily message counts for the last fortnight. Buckets are seeded first so
 * days with no messages still appear on the axis instead of being skipped.
 */
export function useVolumeData(messages: Message[] | undefined): VolumeDatum[] {
  return useMemo(() => {
    const buckets = new Map<string, number>();
    for (let i = VOLUME_DAYS - 1; i >= 0; i--) {
      buckets.set(new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10), 0);
    }
    (messages ?? []).forEach((m) => {
      const d = m.sent_at.slice(0, 10);
      if (buckets.has(d)) buckets.set(d, buckets.get(d)! + 1);
    });
    return Array.from(buckets, ([date, count]) => ({
      date,
      label: date.slice(5),
      messages: count,
    }));
  }, [messages]);
}
