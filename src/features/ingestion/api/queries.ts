import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getIngestionConfig,
  getIngestionRuns,
  triggerIngestionRun,
  type TriggerRunOptions,
} from "@/lib/api/endpoints";
import type { Platform } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";

export const ingestionRunsQueryOptions = (platform?: Platform) =>
  queryOptions({
    queryKey: queryKeys.ingestion.runs(platform),
    queryFn: () => getIngestionRuns(platform),
  });

export const ingestionConfigQueryOptions = (platform: Platform) =>
  queryOptions({
    queryKey: queryKeys.ingestion.config(platform),
    queryFn: () => getIngestionConfig(platform),
  });

/** Unfiltered by default - every pipeline's history, newest first. */
export function useIngestionRuns(platform?: Platform) {
  return useQuery(ingestionRunsQueryOptions(platform));
}

export function useIngestionConfig(platform: Platform) {
  return useQuery(ingestionConfigQueryOptions(platform));
}

export function useTriggerIngestionRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ platform, options }: { platform: Platform; options?: TriggerRunOptions }) =>
      triggerIngestionRun(platform, options),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.ingestion.all });
      qc.invalidateQueries({ queryKey: queryKeys.connectors.all });
    },
  });
}
