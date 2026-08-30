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
 *
 * Each call to this endpoint costs the server one `list_workflows` plus a
 * `progress` query per running run, against a worker configured to run one
 * activity at a time. A flat 5s poll from every open tab, forever, is a lot of
 * that for a status dot. Three things bring it down, and the server-side TTL
 * cache in `gateway.list_active_runs` bounds the damage regardless of what any
 * client does:
 *
 *   - hidden tabs stop polling entirely (`refetchIntervalInBackground` is left
 *     off, React Query's default, and stated here so nobody turns it on
 *     without meaning to);
 *   - an idle console backs off to 15s and only tightens to 5s once something
 *     is actually running;
 *   - every consumer shares this one hook, so React Query dedups them into a
 *     single request. Keep it that way: a component that builds its own
 *     variant of `queryKeys.ingestion.active()` would poll separately.
 */
export function useActiveRuns() {
  return useQuery({
    queryKey: queryKeys.ingestion.active(),
    queryFn: getActiveRuns,
    refetchInterval: (query) => (query.state.data?.count ? 5000 : 15000),
    refetchIntervalInBackground: false,
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
