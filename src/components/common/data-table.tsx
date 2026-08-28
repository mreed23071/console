import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Columns3, Search } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/common/empty-state";
import type { AnyColumnDef } from "@/components/common/table-types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface DataTableProps<TData> {
  columns: AnyColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  /** Localized placeholder for the global filter input. */
  searchPlaceholder?: string;
  toolbar?: ReactNode;
  onRowClick?: (row: Row<TData>) => void;
  /** Localized heading shown when the table has no rows. */
  emptyTitle?: string;
  emptyDescription?: string;
  /**
   * Maps a column id to its localized header, used by the column-visibility
   * menu. Without it the raw column id is shown.
   */
  columnLabels?: Record<string, string>;
  pageSize?: number;
  /**
   * Hides the built-in global-filter box. Set this when `data` is already one
   * page of a server-paginated list - filtering it client-side would silently
   * search only the rows on screen instead of the whole table, which is worse
   * than no search box at all. Pair with a toolbar control that sends the
   * search term to the server instead.
   */
  showSearch?: boolean;
  /**
   * Turns on server-side (manual) pagination: `data` is already one page, so
   * the table stops slicing it and instead reports `pageIndex` through
   * `onPageChange` for the caller to fetch. `rowCount` is the total across
   * every page, for the "X of Y" label and the page count.
   */
  manualPagination?: {
    pageIndex: number;
    rowCount: number;
    onPageChange: (pageIndex: number) => void;
  };
}

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  searchPlaceholder,
  toolbar,
  onRowClick,
  emptyTitle,
  emptyDescription,
  columnLabels,
  pageSize = 10,
  showSearch = true,
  manualPagination,
}: DataTableProps<TData>) {
  const { t } = useTranslation("common");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      ...(manualPagination
        ? { pagination: { pageIndex: manualPagination.pageIndex, pageSize } }
        : {}),
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(manualPagination
      ? {
          manualPagination: true,
          pageCount: Math.max(1, Math.ceil(manualPagination.rowCount / pageSize)),
          onPaginationChange: (updater) => {
            const next =
              typeof updater === "function"
                ? updater({ pageIndex: manualPagination.pageIndex, pageSize })
                : updater;
            manualPagination.onPageChange(next.pageIndex);
          },
        }
      : {
          getPaginationRowModel: getPaginationRowModel(),
          initialState: { pagination: { pageSize } },
        }),
  });

  const rowCount = manualPagination
    ? manualPagination.rowCount
    : table.getFilteredRowModel().rows.length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {showSearch && (
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={searchPlaceholder ?? t("table.searchPlaceholder")}
              className="pl-8"
              aria-label={t("table.searchLabel")}
            />
          </div>
        )}
        {toolbar}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns3 className="size-4" /> {t("table.columns")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllLeafColumns()
              .filter((c) => c.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(v) => column.toggleVisibility(!!v)}
                >
                  {columnLabels?.[column.id] ?? column.id.replace(/_/g, " ")}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead key={header.id} className="text-xs font-semibold">
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 hover:text-foreground"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="size-3.5" />
                          ) : (
                            <ChevronsUpDown className="size-3.5 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {table.getVisibleLeafColumns().map((c) => (
                    <TableCell key={c.id}>
                      <Skeleton className="h-4 w-full max-w-[160px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={table.getVisibleLeafColumns().length} className="p-0">
                  <EmptyState
                    title={emptyTitle ?? t("empty.title")}
                    description={emptyDescription ?? t("empty.description")}
                  />
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? "cursor-pointer" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p className="tnum">
          {t("table.rowCount", { count: rowCount })} ·{" "}
          {t("table.pageOf", {
            page: table.getState().pagination.pageIndex + 1,
            total: Math.max(1, table.getPageCount()),
          })}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t("action.previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t("action.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
