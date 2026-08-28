import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { PlatformBadge } from "@/components/common/platform-icon";
import type { AnyColumnDef } from "@/components/common/table-types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { PersonWithMeta } from "@/lib/api/types";
import { initialsOf } from "@/lib/utils";

export interface PeopleColumnOptions {
  /**
   * Department name per person id. Resolved by the caller rather than fetched
   * here, so the people feature stays independent of the organization one —
   * the route is the only place that knows about both.
   */
  departmentByPersonId?: Map<string, string>;
}

/**
 * Column definitions for the people table. Kept as a hook so headers are
 * localized and re-render when the language changes.
 */
export function usePeopleColumns({
  departmentByPersonId,
}: PeopleColumnOptions = {}): AnyColumnDef<PersonWithMeta>[] {
  const { t } = useTranslation("people");

  return useMemo(
    () => [
      {
        accessorKey: "full_name",
        header: t("column.name"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              <AvatarFallback className="bg-accent text-[11px] text-accent-foreground">
                {initialsOf(row.original.full_name)}
              </AvatarFallback>
            </Avatar>
            <Link
              to="/people/$id"
              params={{ id: row.original.id }}
              className="font-medium text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {row.original.full_name}
            </Link>
          </div>
        ),
      },
      { accessorKey: "email", header: t("column.email") },
      { accessorKey: "job_title", header: t("column.jobTitle") },
      {
        id: "department",
        header: t("column.department"),
        // accessorFn so the column sorts and takes part in the global filter.
        accessorFn: (person) => departmentByPersonId?.get(person.id) ?? "",
        cell: ({ row }) => {
          const department = departmentByPersonId?.get(row.original.id);
          return department ? (
            <span className="text-sm">{department}</span>
          ) : (
            <span className="text-sm text-muted-foreground">{t("column.noDepartment")}</span>
          );
        },
      },
      {
        id: "platforms",
        header: t("column.platforms"),
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.platforms.map((p) => (
              <PlatformBadge key={p} platform={p} />
            ))}
          </div>
        ),
      },
      {
        accessorKey: "message_count",
        header: t("column.messages"),
        cell: ({ getValue }) => <span className="tnum">{getValue<number>()}</span>,
      },
      {
        accessorKey: "last_summary_at",
        header: t("column.lastSummary"),
        cell: ({ getValue }) => {
          const v = getValue<string | null>();
          return <span className="tnum text-muted-foreground">{v ? v.slice(0, 10) : "—"}</span>;
        },
      },
    ],
    [t, departmentByPersonId],
  );
}

export function usePeopleColumnLabels(): Record<string, string> {
  const { t } = useTranslation("people");
  return {
    full_name: t("column.name"),
    email: t("column.email"),
    job_title: t("column.jobTitle"),
    department: t("column.department"),
    platforms: t("column.platforms"),
    message_count: t("column.messages"),
    last_summary_at: t("column.lastSummary"),
  };
}
