import {
  ExternalLink,
  FileDiff,
  GitCommitHorizontal,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { CategoryBadge } from "@/components/common/category-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { CommitFileStatus, Message } from "@/lib/api/types";

const STATUS_STYLES: Record<CommitFileStatus, string> = {
  added: "border-status-good/40 text-status-good",
  modified: "border-status-warning/40 text-status-warning",
  removed: "border-status-critical/40 text-status-critical",
};

export function CommitDialog({
  message,
  open,
  onOpenChange,
}: {
  message: Message | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation(["messages", "common"]);
  const [regenerating, setRegenerating] = useState(false);

  const commit = message?.commit;
  if (!message || !commit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-2 text-left text-base">
            <GitCommitHorizontal className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            {message.content}
          </DialogTitle>
          <DialogDescription className="tnum">
            {commit.repository} · {commit.branch} · <span className="font-mono">{commit.sha}</span>{" "}
            · {new Date(message.sent_at).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={message.filter_category} />
          <Badge variant="outline" className="tnum">
            {t("messages:commit.filesChanged", { count: commit.files.length })}
          </Badge>
          <Badge variant="outline" className="tnum text-status-good">
            +{commit.additions}
          </Badge>
          <Badge variant="outline" className="tnum text-status-critical">
            −{commit.deletions}
          </Badge>
          <Button variant="ghost" size="sm" asChild className="ml-auto">
            <a href={commit.url} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" /> {t("messages:commit.viewOnGitHub")}
            </a>
          </Button>
        </div>

        <Separator />

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="size-4 text-muted-foreground" /> {t("messages:commit.aiSummary")}
            </h3>
            <Button
              variant="outline"
              size="sm"
              disabled={regenerating}
              onClick={() => {
                setRegenerating(true);
                setTimeout(() => setRegenerating(false), 1100);
              }}
            >
              {regenerating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              {t("common:action.regenerate")}
            </Button>
          </div>
          <p className="text-sm leading-relaxed">{commit.ai_summary}</p>
          <p className="tnum text-xs text-muted-foreground">
            {t("messages:commit.generatedAt", {
              date: new Date(commit.ai_summary_generated_at).toLocaleString(),
            })}
          </p>
        </section>

        <Separator />

        <section className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-sm font-medium">
            <FileDiff className="size-4 text-muted-foreground" /> {t("messages:commit.filesTitle")}
          </h3>
          <ul className="divide-y rounded-lg border">
            {commit.files.map((f) => (
              <li key={f.path} className="flex flex-wrap items-center gap-2 px-3 py-2">
                <Badge variant="outline" className={STATUS_STYLES[f.status]}>
                  {t(`messages:commit.status.${f.status}` as never)}
                </Badge>
                <span className="truncate font-mono text-xs">{f.path}</span>
                <span className="tnum ml-auto text-xs">
                  <span className="text-status-good">+{f.additions}</span>{" "}
                  <span className="text-status-critical">−{f.deletions}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </DialogContent>
    </Dialog>
  );
}
