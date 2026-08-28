import { RefreshCw, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
      <TriangleAlert className="size-6 text-status-critical" aria-hidden />
      <div>
        <p className="text-sm font-semibold text-foreground">{title ?? t("error.title")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {description ?? t("error.description")}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" /> {t("action.retry")}
        </Button>
      )}
    </div>
  );
}
