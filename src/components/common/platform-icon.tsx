import { Github, Hash, Mail, MessageSquare, Plug, SquareKanban } from "lucide-react";

import { usePlatformLabels } from "@/components/common/platform";
import type { Platform } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const ICONS = {
  slack: Hash,
  github: Github,
  teams: MessageSquare,
  email: Mail,
  linear: SquareKanban,
  other: Plug,
} as const;

export function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  const Icon = ICONS[platform];
  return <Icon className={cn("size-4", className)} aria-hidden />;
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  const labels = usePlatformLabels();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
      <PlatformIcon platform={platform} className="size-3.5" />
      {labels[platform]}
    </span>
  );
}
