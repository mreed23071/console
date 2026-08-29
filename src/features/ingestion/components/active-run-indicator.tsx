import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { useActiveRuns } from "@/features/ingestion/api/queries";

/**
 * Console-wide "something is happening" signal, in the app shell header so
 * it's visible from any screen - not just the runs page.
 *
 * Deliberately says only that ingestion is running, not what or how much:
 * `useActiveRuns` intentionally carries no per-platform detail (see the
 * backend's `list_active_runs` docstring for why), and this is meant to be
 * glanced at, not read closely. Renders nothing at all when nothing is
 * running, rather than an idle "0 active" state nobody needs to see.
 */
export function ActiveRunIndicator() {
  const { t } = useTranslation("ingestion");
  const { data } = useActiveRuns();

  if (!data || data.count === 0) return null;

  return (
    <Link to="/runs">
      <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75 motion-reduce:hidden" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        {t("activeIndicator.running", { count: data.count })}
      </Badge>
    </Link>
  );
}
