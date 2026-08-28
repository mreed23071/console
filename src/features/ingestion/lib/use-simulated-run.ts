import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useTriggerIngestionRun } from "@/features/ingestion/api/queries";
import { RUN_STEP_COUNT } from "@/features/ingestion/lib/run-level";

const STEP_INTERVAL_MS = 900;
const RESET_DELAY_MS = 1200;

/**
 * Drives the simulated step-by-step progress of a triggered run, firing the
 * real mutation when the last step is reached.
 *
 * The backend returns a finished run in one call, so the intermediate steps are
 * presentation only — they give the operator a sense of the pipeline's stages
 * rather than a blank spinner.
 */
export function useSimulatedRun(step: number | null, setStep: (s: number | null) => void): void {
  const { t } = useTranslation("ingestion");
  const trigger = useTriggerIngestionRun();

  // Advance through the intermediate steps.
  useEffect(() => {
    if (step === null || step >= RUN_STEP_COUNT - 1) return undefined;
    const timer = setTimeout(() => setStep(step + 1), STEP_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [step, setStep]);

  // On the final step, actually run the mutation and then reset.
  useEffect(() => {
    if (step !== RUN_STEP_COUNT - 1) return undefined;

    trigger.mutate(
      {},
      {
        onSuccess: (run) =>
          toast.success(t("trigger.success", { runId: run.run_id, count: run.persisted })),
        onError: () => toast.error(t("trigger.error")),
      },
    );

    const timer = setTimeout(() => setStep(null), RESET_DELAY_MS);
    return () => clearTimeout(timer);
    // `trigger` is a new object each render; depending on it would re-fire the run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, setStep]);
}
