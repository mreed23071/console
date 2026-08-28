import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { ErrorState } from "@/components/common/error-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CategoryDatum, VolumeDatum } from "@/features/dashboard/lib/chart-data";

/** Line colour for the volume chart. */
const VOLUME_COLOR = "#2A78D6";

export function CategoryChartCard({
  data,
  isLoading,
  isError,
  onRetry,
}: {
  data: CategoryDatum[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const { t } = useTranslation("dashboard");
  const config: ChartConfig = {
    count: { label: t("chart.messages") },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("chart.categoryTitle")}</CardTitle>
        <CardDescription>{t("chart.categoryDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState onRetry={onRetry} />
        ) : isLoading ? (
          <Skeleton className="h-[240px] w-full" />
        ) : (
          <ChartContainer config={config} className="h-[240px] w-full">
            <BarChart data={data}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="count" name={t("chart.messages")} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function VolumeChartCard({
  data,
  isLoading,
  isError,
  onRetry,
}: {
  data: VolumeDatum[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const { t } = useTranslation("dashboard");
  const config: ChartConfig = {
    messages: { label: t("chart.messages"), color: VOLUME_COLOR },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("chart.volumeTitle")}</CardTitle>
        <CardDescription>{t("chart.volumeDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState onRetry={onRetry} />
        ) : isLoading ? (
          <Skeleton className="h-[240px] w-full" />
        ) : (
          <ChartContainer config={config} className="h-[240px] w-full">
            <LineChart data={data}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                dataKey="messages"
                stroke={VOLUME_COLOR}
                strokeWidth={2}
                dot={false}
                name={t("chart.messages")}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Accessible text equivalent of the two charts above — the same numbers, but
 * readable by a screen reader and copyable.
 */
export function ChartDataTables({
  categories,
  volume,
}: {
  categories: CategoryDatum[];
  volume: VolumeDatum[];
}) {
  const { t } = useTranslation("dashboard");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("chart.categoryTableTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("chart.columnCategory")}</TableHead>
                <TableHead className="text-right">{t("chart.columnMessages")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((r) => (
                <TableRow key={r.category}>
                  <TableCell>{r.label}</TableCell>
                  <TableCell className="tnum text-right">{r.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("chart.volumeTableTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="max-h-72 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("chart.columnDate")}</TableHead>
                <TableHead className="text-right">{t("chart.columnMessages")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {volume.map((r) => (
                <TableRow key={r.date}>
                  <TableCell className="tnum">{r.date}</TableCell>
                  <TableCell className="tnum text-right">{r.messages}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
