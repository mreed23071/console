import type { ColumnDef } from "@tanstack/react-table";

/**
 * TanStack's `ColumnDef` is generic over the cell value, which differs from one
 * column to the next, so a single table's definitions cannot share one value
 * type. `any` is the escape hatch TanStack itself documents; each column
 * narrows it at the cell via `getValue<T>()`.
 *
 * Keeping the escape hatch in one alias means the lint suppression lives here
 * rather than being repeated above every column definition in the app.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyColumnDef<TData> = ColumnDef<TData, any>;
