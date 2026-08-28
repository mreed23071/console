import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
