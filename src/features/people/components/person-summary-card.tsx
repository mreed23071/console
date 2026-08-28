import { Clock, Loader2, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useRegenerateSummary } from "@/features/people/api/mutations";
import { usePersonSummary } from "@/features/people/api/queries";
import type { SummaryRange } from "@/lib/api/types";

const DAY_MS = 86_400_000;

/** Derives the API range from the preset selector plus the custom inputs. */
function useSummaryRange(preset: string, from: string, to: string): SummaryRange {
  return useMemo(() => {
    if (preset === "custom") return { from: from || undefined, to: to || undefined };
    const days = Number(preset);
    if (!Number.isFinite(days) || days <= 0) return {};
    return { from: new Date(Date.now() - days * DAY_MS).toISOString().slice(0, 10), to: undefined };
  }, [preset, from, to]);
}

export function PersonSummaryCard({ personId }: { personId: string }) {
  const { t } = useTranslation(["people", "common"]);
  const [preset, setPreset] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const range = useSummaryRange(preset, customFrom, customTo);
  const summary = usePersonSummary(personId, range);
  const regenerate = useRegenerateSummary(personId, range);

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base">{t("people:summary.title")}</CardTitle>
          <CardDescription>
            {summary.data?.generated_at
              ? t("people:summary.generatedAt", {
                  date: new Date(summary.data.generated_at).toLocaleString(),
                  range: summary.data.range_label,
                })
              : t("people:summary.fallbackDescription")}
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={preset} onValueChange={setPreset}>
            <SelectTrigger className="h-8 w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("people:summary.range.all")}</SelectItem>
              <SelectItem value="7">{t("people:summary.range.last7")}</SelectItem>
              <SelectItem value="30">{t("people:summary.range.last30")}</SelectItem>
              <SelectItem value="90">{t("people:summary.range.last90")}</SelectItem>
              <SelectItem value="custom">{t("people:summary.range.custom")}</SelectItem>
            </SelectContent>
          </Select>

          {preset === "custom" && (
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                aria-label={t("people:summary.range.start")}
                className="h-8 w-[140px]"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <span className="text-xs text-muted-foreground">{t("people:summary.range.to")}</span>
              <Input
                type="date"
                aria-label={t("people:summary.range.end")}
                className="h-8 w-[140px]"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            disabled={regenerate.isPending}
            onClick={() =>
              regenerate.mutate(undefined, {
                onSuccess: () => toast.success(t("people:summary.regenerateSuccess")),
                onError: () => toast.error(t("people:summary.regenerateError")),
              })
            }
          >
            {regenerate.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {t("common:action.regenerate")}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {summary.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : summary.isError ? (
          <ErrorState onRetry={() => summary.refetch()} />
        ) : summary.data?.summary_error ? (
          <p className="text-sm text-muted-foreground">{summary.data.summary_error}</p>
        ) : (
          <>
            <p className="text-sm leading-relaxed">{summary.data?.summary}</p>
            <Separator className="my-4" />
            <p className="tnum flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              {t("people:summary.basedOn", {
                count: summary.data?.message_count ?? 0,
                range: summary.data?.range_label ?? "",
              })}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
