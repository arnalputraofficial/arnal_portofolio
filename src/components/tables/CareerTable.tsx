import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/DataTable";
import { useSiteText } from "@/content/ContentProvider";
import { humanDuration, monthsBetween } from "@/lib/utils";
import { useEntries } from "@/entries/EntriesProvider";
import type { Role } from "@/data/portfolio";

const LEVEL_OPTIONS = ["IC", "Lead", "SPV", "Manager"];

function makeColumns(t: ReturnType<typeof useSiteText>): ColumnDef<Role, unknown>[] {
  return [
    {
      accessorKey: "title",
      header: t("career.table.col.title"),
      meta: { cellClassName: "min-w-[220px]" },
      cell: ({ row }) => (
        <div>
          <p className="font-display text-[15px] font-semibold leading-snug tracking-tight">
            {row.original.title}
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">{row.original.company}</p>
        </div>
      ),
    },
    {
      accessorKey: "sector",
      header: t("career.table.col.sector"),
      filterFn: "equalsString",
      meta: { cellClassName: "whitespace-nowrap font-mono text-[12px] text-muted-foreground" },
    },
    {
      accessorKey: "level",
      header: t("career.table.col.level"),
      filterFn: "equalsString",
      meta: { cellClassName: "whitespace-nowrap" },
      cell: ({ getValue }) => {
        const value = getValue() as Role["level"];
        return <Badge variant={value === "IC" ? "muted" : "accent"}>{value}</Badge>;
      },
    },
    {
      id: "period",
      header: t("career.table.col.period"),
      enableSorting: false,
      accessorFn: (row) => row.start,
      meta: { cellClassName: "whitespace-nowrap font-mono text-[12px] tabular-nums" },
      cell: ({ row }) => (
        <span>
          {row.original.start.replace("-", "/")}
          <span className="text-muted-foreground">{t("career.table.period.to")}</span>
          {row.original.end ? row.original.end.replace("-", "/") : t("career.table.period.now")}
        </span>
      ),
    },
    {
      id: "duration",
      header: t("career.table.col.duration"),
      sortingFn: (a, b) =>
        monthsBetween(a.original.start, a.original.end) -
        monthsBetween(b.original.start, b.original.end),
      meta: { cellClassName: "whitespace-nowrap font-mono text-[12px] tabular-nums" },
      cell: ({ row }) => (
        <span
          title={t("career.table.duration.title", {
            count: monthsBetween(row.original.start, row.original.end),
          })}
        >
          {humanDuration(monthsBetween(row.original.start, row.original.end))}
        </span>
      ),
    },
    {
      accessorKey: "headcount",
      header: t("career.table.col.team"),
      meta: {
        headClassName: "text-right",
        cellClassName: "text-right font-mono text-[12px] tabular-nums",
      },
      cell: ({ getValue }) => {
        const value = getValue() as number;
        return value > 0 ? (
          t("career.table.team.value", { count: value })
        ) : (
          <span className="text-muted-foreground">{t("career.table.team.none")}</span>
        );
      },
    },
    {
      accessorKey: "location",
      header: t("career.table.col.location"),
      meta: { cellClassName: "whitespace-nowrap font-mono text-[12px] text-muted-foreground" },
    },
    {
      id: "stack",
      header: t("career.table.col.stack"),
      enableSorting: false,
      accessorFn: (row) => row.stack.join(" "),
      cell: ({ row }) => (
        <div className="flex max-w-[240px] flex-wrap gap-1">
          {row.original.stack.map((tech) => (
            <Badge key={tech} variant="default" size="sm">
              {tech}
            </Badge>
          ))}
        </div>
      ),
    },
  ];
}

/** Job history as a sortable, filterable table. */
export function CareerTable() {
  const t = useSiteText();
  const { career } = useEntries();
  const columns = React.useMemo(() => makeColumns(t), [t]);

  // Sectors are free text, so the filter list follows whatever is on screen.
  const sectors = [...new Set(career.map((role) => role.sector))].sort();

  return (
    <DataTable
      data={career}
      columns={columns}
      searchHint={t("career.table.searchHint")}
      pageSize={6}
      emptyMessage={t("career.table.empty")}
      facets={[
        { columnId: "level", label: t("career.table.facet.level"), options: LEVEL_OPTIONS },
        { columnId: "sector", label: t("career.table.facet.sector"), options: sectors },
      ]}
    />
  );
}
