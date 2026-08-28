import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useTriggerIngestionRun } from "@/features/ingestion/api/queries";
import { getRunStatus } from "@/lib/api/endpoints";
import type { Platform, RunProgress } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";

const POLL_INTERVAL_MS = 1500;

/** Statuses after which there is nothing left to poll for. */
const TERMINAL = new Set<RunProgress["status"]>(["completed", "failed", "cancelled"]);

/**
 * Queues a run and follows it to completion.
 *
 * Replaces the timer that used to animate invented pipeline steps. The API
 * could not report anything until a whole run finished, so the console faked
 * it; now the workflow answers a `progress` query and every stage shown here
 * is the stage actually executing.
 *
 * Polling rather than streaming is deliberate: a run is minutes long and the
 * query is cheap (it reads live workflow state without replaying history), so
 * a socket would be machinery for no benefit.
 */
export function useTrackedRun(platform: Platform) {
  const { t } = useTranslation("ingestion");
  const queryClient = useQueryClient();
  const trigger = useTriggerIngestionRun();

  const [progress, setProgress] = useState<RunProgress | null>(null);
  // Held in a ref as well so the polling effect can read the current run
  // without re-subscribing on every tick.
  const runRef = useRef<{ platform: Platform; runId: string } | null>(null);

  const start = useCallback(() => {
    trigger.mutate(
      { platform },
      {
        onSuccess: (queued) => {
          runRef.current = { platform, runId: queued.run_id };
          setProgress({
            run_id: queued.run_id,
            status: "queued",
            stage: "queued",
            fetched: 0,
            evaluated: 0,
            filtered: 0,
            embedded: 0,
            persisted: 0,
            result: null,
          });
        },
        onError: () => toast.error(t("trigger.error")),
      },
    );
  }, [platform, t, trigger]);

  useEffect(() => {
    if (!progress || TERMINAL.has(progress.status)) return undefined;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const current = runRef.current;
      if (!current) return;
      try {
        const next = await getRunStatus(current.platform, current.runId);
        if (cancelled) return;
        setProgress(next);

        if (TERMINAL.has(next.status)) {
          // The run touched messages, people and connector health; let every
          // screen that reads those refetch rather than listing them here.
          queryClient.invalidateQueries({ queryKey: queryKeys.ingestion.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.connectors.all });

          if (next.status === "completed") {
            toast.success(
              t("trigger.success", {
                runId: next.run_id,
                count: next.result?.persisted ?? next.persisted,
              }),
            );
          } else {
            toast.error(t("trigger.error"));
          }
        }
      } catch {
        // A poll that fails is not a run that failed - the worker may just be
        // busy. Leave the status alone and try again on the next tick.
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [progress, queryClient, t]);

  const running = progress !== null && !TERMINAL.has(progress.status);

  return { start, progress, running, isQueueing: trigger.isPending };
}
