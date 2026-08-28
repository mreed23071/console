import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  loading,
  children,
}: {
  label: string;
  value?: string;
  icon: LucideIcon;
  hint?: string;
  loading?: boolean;
  /** Replaces the numeric value, for tiles that render a badge instead. */
  children?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>{label}</CardDescription>
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent className={children ? "space-y-2" : undefined}>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          (children ?? <p className="tnum text-3xl font-semibold tracking-tight">{value}</p>)
        )}
        {!children && hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
