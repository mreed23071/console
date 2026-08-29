import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getActiveRuns,
  getIngestionConfig,
  getIngestionRuns,
  getRunStatus,
  triggerIngestionRun,
  type TriggerRunOptions,
} from "@/lib/api/endpoints";
import type { Platform } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";

/** Statuses after which there is nothing left to poll for. */
const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled"]);

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

/**
 * Ambient, console-wide awareness that ingestion is running somewhere - not
 * tied to any one platform or to a run this browser tab triggered. Polled on
 * a longer interval than `useTrackedRun`'s 1.5s: this is a background
 * indicator glanced at from any screen, not a progress bar someone is
 * watching, so it doesn't need to feel instantaneous.
 */
export function useActiveRuns() {
  return useQuery({
    queryKey: queryKeys.ingestion.active(),
    queryFn: getActiveRuns,
    refetchInterval: 5000,
  });
}

/**
 * Live status for a run this browser tab did not start itself - a row picked
 * from the console-wide active-runs list. Same poll cadence as
 * `useTrackedRun`, since this drives the same `RunProgress` display; stops
 * once the run reaches a terminal status.
 */
export function useRunStatus(platform: Platform | null, runId: string | null) {
  return useQuery({
    queryKey: queryKeys.ingestion.status(platform ?? "", runId ?? ""),
    queryFn: () => getRunStatus(platform as Platform, runId as string),
    enabled: platform !== null && runId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && TERMINAL_STATUSES.has(status) ? false : 1500;
    },
  });
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
