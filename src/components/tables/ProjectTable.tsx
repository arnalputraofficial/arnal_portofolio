import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DataTable } from "@/components/tables/DataTable";
import { KIND_COLOR } from "@/components/charts/ProjectCharts";
import { useSiteText } from "@/content/ContentProvider";
import { nf } from "@/lib/utils";
import { useEntries } from "@/entries/EntriesProvider";
import type { Project } from "@/data/portfolio";

/** Badge colour per status, distinct from the kind colours so they never get confused. */
function statusVariant(status: Project["status"]) {
  switch (status) {
    case "live":
    case "active":
      return "moss" as const;
    case "completed":
      return "muted" as const;
    case "on-hold":
      return "danger" as const;
    default:
      return "default" as const;
  }
}

function makeColumns(t: ReturnType<typeof useSiteText>): ColumnDef<Project, unknown>[] {
  return [
  {
    accessorKey: "name",
    header: t("projects.table.col.name"),
    meta: { cellClassName: "min-w-[240px]" },
    cell: ({ row }) => (
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden
          className="mt-[7px] size-2 shrink-0 rounded-[2px]"
          style={{ backgroundColor: KIND_COLOR[row.original.kind] }}
        />
        <div>
          <p className="font-display text-[15px] font-semibold leading-snug tracking-tight">
            {row.original.name}
          </p>
          {row.original.featured && (
            <span className="mt-1 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
              {t("projects.table.featured")}
            </span>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "kind",
    header: t("projects.table.col.kind"),
    meta: { cellClassName: "whitespace-nowrap" },
    cell: ({ getValue }) => (
      <span className="font-mono text-[12px] text-muted-foreground">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "status",
    header: t("projects.table.col.status"),
    filterFn: "equalsString",
    meta: { cellClassName: "whitespace-nowrap" },
    cell: ({ getValue }) => {
      const value = getValue() as Project["status"];
      return (
        <Badge variant={statusVariant(value)} dot={value === "live" || value === "active"}>
          {value}
        </Badge>
      );
    },
  },
  {
    accessorKey: "year",
    header: "Year",
    filterFn: (row, id, value) => String(row.getValue(id)) === value,
    meta: { cellClassName: "whitespace-nowrap font-mono text-[12px] tabular-nums" },
  },
  {
    accessorKey: "role",
    header: t("projects.table.col.role"),
    meta: { cellClassName: "whitespace-nowrap font-mono text-[12px] text-muted-foreground" },
  },
  {
    accessorKey: "budgetM",
    header: t("projects.table.col.budget"),
    sortingFn: "basic",
    meta: { headClassName: "text-right", cellClassName: "text-right font-mono text-[12px] tabular-nums" },
    cell: ({ row }) => (
      <span
        title={t("projects.table.budgetTitle", { amount: nf(row.original.budgetM) })}
      >
        {t("projects.table.budgetValue", { amount: nf(row.original.budgetM) })}
      </span>
    ),
  },
  {
    accessorKey: "impact",
    header: t("projects.table.col.impact"),
    meta: { cellClassName: "w-[132px]" },
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <Progress
          value={row.original.impact}
          className="h-1.5 w-16"
          indicatorClassName={row.original.impact >= 85 ? "bg-primary" : "bg-moss-500"}
        />
        <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
          {row.original.impact}
        </span>
      </div>
    ),
  },
  {
    id: "stack",
    header: t("projects.table.col.stack"),
    enableSorting: false,
    accessorFn: (row) => row.stack.join(" "),
    cell: ({ row }) => (
      <div className="flex max-w-[230px] flex-wrap gap-1">
        {row.original.stack.slice(0, 3).map((tech) => (
          <Badge key={tech} variant="default" size="sm">
            {tech}
          </Badge>
        ))}
        {row.original.stack.length > 3 && (
          <Badge variant="muted" size="sm" title={row.original.stack.slice(3).join(", ")}>
            +{row.original.stack.length - 3}
          </Badge>
        )}
      </div>
    ),
  },
  ];
}

/** Carbon emissions are not measured here, so there is no invented column. */
export function ProjectTable() {
  const t = useSiteText();
  const { projects } = useEntries();
  const columns = React.useMemo(() => makeColumns(t), [t]);

  // Kind, status, and year are stored per row, so the filters follow the data.
  const kinds = [...new Set(projects.map((p) => p.kind))];
  const statuses = [...new Set(projects.map((p) => p.status))];
  const years = [...new Set(projects.map((p) => String(p.year)))].sort(
    (a, b) => Number(b) - Number(a),
  );

  return (
    <DataTable
      data={projects}
      columns={columns}
      searchHint={t("projects.table.searchHint")}
      pageSize={7}
      footnote={t("projects.table.footnote")}
      facets={[
        { columnId: "kind", label: t("projects.table.facet.kind"), options: kinds },
        { columnId: "status", label: t("projects.table.facet.status"), options: statuses },
        { columnId: "year", label: t("projects.table.facet.year"), options: years },
      ]}
    />
  );
}
