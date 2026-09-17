import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSiteText } from "@/content/ContentProvider";

/** Sentinel value for the "all" option in a filter. */
const ALL = "__all__";

export interface FacetConfig {
  columnId: string;
  label: string;
  options: string[];
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  /** placeholder keywords for the search box, e.g. "project name, kind, or technology" */
  searchHint?: string;
  facets?: FacetConfig[];
  pageSize?: number;
  emptyMessage?: string;
  /** small note at the bottom right of the table */
  footnote?: string;
}

/**
 * Data table with global search, per-column filters, sorting, and
 * pagination. Everything runs client side because the dataset is small,
 * so no network request fires while typing.
 */
export function DataTable<TData>({
  columns,
  data,
  searchHint,
  facets = [],
  pageSize = 8,
  emptyMessage,
  footnote,
}: DataTableProps<TData>) {
  const t = useSiteText();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize });

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
  });

  // any filter change sends the reader back to the first page,
  // so they never get stuck on an empty page
  React.useEffect(() => {
    setPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }));
  }, [globalFilter, columnFilters]);

  const rows = table.getRowModel().rows;
  const total = table.getFilteredRowModel().rows.length;
  const activeFilters = columnFilters.length + (globalFilter ? 1 : 0);
  /** Falls back to the shared copy so a table only overrides it when needed. */
  const resolvedSearchHint = searchHint ?? t("global.table.search");
  const resolvedEmptyMessage = emptyMessage ?? t("global.table.empty");

  const resetAll = () => {
    setGlobalFilter("");
    setColumnFilters([]);
    setSorting([]);
  };

  return (
    <div className="panel-flagged">
      {/* ---- toolbar ---- */}
      <div className="flex flex-col gap-4 border-b border-border p-5 pl-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={resolvedSearchHint}
            aria-label={resolvedSearchHint}
            className="pl-10 pr-10"
          />
          {globalFilter && (
            <button
              type="button"
              onClick={() => setGlobalFilter("")}
              aria-label={t("global.table.clearSearch")}
              className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {facets.map((facet) => {
            const column = table.getColumn(facet.columnId);
            const value = (column?.getFilterValue() as string | undefined) ?? ALL;
            return (
              <div key={facet.columnId} className="flex items-center gap-2">
                <span className="eyebrow hidden sm:inline">{facet.label}</span>
                <Select
                  value={value}
                  onValueChange={(v) => column?.setFilterValue(v === ALL ? undefined : v)}
                >
                  <SelectTrigger
                    className="h-10 w-[168px]"
                    aria-label={t("global.table.filterBy", { label: facet.label })}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>
                      {t("global.table.all", { label: facet.label.toLowerCase() })}
                    </SelectItem>
                    {facet.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={resetAll}
            disabled={activeFilters === 0 && sorting.length === 0}
            className="gap-2"
          >
            <RotateCcw className="size-3.5" />
            {t("global.table.reset")}
          </Button>
        </div>
      </div>

      {/* ---- table ---- */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    aria-sort={
                      sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined
                    }
                    className={cn(header.column.columnDef.meta?.headClassName)}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          "group inline-flex items-center gap-1.5 transition-colors",
                          "hover:text-foreground",
                          sorted && "text-primary",
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span aria-hidden className="text-muted-foreground">
                          {sorted === "asc" ? (
                            <ArrowUp className="size-3.5 text-primary" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="size-3.5 text-primary" />
                          ) : (
                            <ArrowUpDown className="size-3.5 opacity-45 transition-opacity group-hover:opacity-100" />
                          )}
                        </span>
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
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="py-14 text-center">
                <p className="font-display text-base font-medium">{resolvedEmptyMessage}</p>
                <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  {t("global.table.emptyHint")}
                </p>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cn(cell.column.columnDef.meta?.cellClassName)}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* ---- footer: count, page, navigation ---- */}
      <div className="flex flex-col gap-3 border-t border-border p-4 pl-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
          {t("global.table.showing", { shown: rows.length, total })}
          {activeFilters > 0 && t("global.table.activeFilters", { count: activeFilters })}
        </p>

        <div className="flex items-center gap-3">
          {footnote && (
            <span className="hidden font-mono text-[11px] text-muted-foreground lg:inline">
              {footnote}
            </span>
          )}
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {t("global.table.page", {
              page: pagination.pageIndex + 1,
              pages: Math.max(1, table.getPageCount()),
            })}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-9"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label={t("global.table.previous")}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-9"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label={t("global.table.next")}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
