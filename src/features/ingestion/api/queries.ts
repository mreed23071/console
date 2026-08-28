import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getIngestionConfig,
  getIngestionRuns,
  triggerIngestionRun,
  type TriggerRunOptions,
} from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query-keys";

export const ingestionRunsQueryOptions = () =>
  queryOptions({ queryKey: queryKeys.ingestion.runs(), queryFn: () => getIngestionRuns() });

export const ingestionConfigQueryOptions = () =>
  queryOptions({ queryKey: queryKeys.ingestion.config(), queryFn: () => getIngestionConfig() });

export function useIngestionRuns() {
  return useQuery(ingestionRunsQueryOptions());
}

export function useIngestionConfig() {
  return useQuery(ingestionConfigQueryOptions());
}

export function useTriggerIngestionRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (options: TriggerRunOptions = {}) => triggerIngestionRun(options),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.ingestion.all });
      qc.invalidateQueries({ queryKey: queryKeys.connectors.all });
    },
  });
}
