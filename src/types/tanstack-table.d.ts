import type { RowData } from "@tanstack/react-table";

/**
 * Adds column classes to the TanStack Table column definition,
 * so width and alignment can be set from the column file.
 */
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    headClassName?: string;
    cellClassName?: string;
  }
}
