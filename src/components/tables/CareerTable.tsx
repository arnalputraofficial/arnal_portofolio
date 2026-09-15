import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/DataTable";
import { humanDuration, monthsBetween } from "@/lib/utils";
import { career, type Role } from "@/data/portfolio";

const LEVEL_OPTIONS = [...new Set(career.map((r) => r.level))];
const SECTOR_OPTIONS = [...new Set(career.map((r) => r.sector))];

const columns: ColumnDef<Role, unknown>[] = [
  {
    accessorKey: "title",
    header: "Position",
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
    header: "Sector",
    filterFn: "equalsString",
    meta: { cellClassName: "whitespace-nowrap font-mono text-[12px] text-muted-foreground" },
  },
  {
    accessorKey: "level",
    header: "Level",
    filterFn: "equalsString",
    meta: { cellClassName: "whitespace-nowrap" },
    cell: ({ getValue }) => {
      const value = getValue() as Role["level"];
      return <Badge variant={value === "IC" ? "muted" : "accent"}>{value}</Badge>;
    },
  },
  {
    id: "period",
    header: "Period",
    enableSorting: false,
    accessorFn: (row) => row.start,
    meta: { cellClassName: "whitespace-nowrap font-mono text-[12px] tabular-nums" },
    cell: ({ row }) => (
      <span>
        {row.original.start.replace("-", "/")}
        <span className="text-muted-foreground"> to </span>
        {row.original.end ? row.original.end.replace("-", "/") : "now"}
      </span>
    ),
  },
  {
    id: "duration",
    header: "Duration",
    sortingFn: (a, b) =>
      monthsBetween(a.original.start, a.original.end) -
      monthsBetween(b.original.start, b.original.end),
    meta: { cellClassName: "whitespace-nowrap font-mono text-[12px] tabular-nums" },
    cell: ({ row }) => (
      <span title={`${monthsBetween(row.original.start, row.original.end)} months`}>
        {humanDuration(monthsBetween(row.original.start, row.original.end))}
      </span>
    ),
  },
  {
    accessorKey: "headcount",
    header: "Team",
    meta: {
      headClassName: "text-right",
      cellClassName: "text-right font-mono text-[12px] tabular-nums",
    },
    cell: ({ getValue }) => {
      const value = getValue() as number;
      return value > 0 ? `${value} people` : <span className="text-muted-foreground">no reports</span>;
    },
  },
  {
    accessorKey: "location",
    header: "Location",
    meta: { cellClassName: "whitespace-nowrap font-mono text-[12px] text-muted-foreground" },
  },
  {
    id: "stack",
    header: "Working stack",
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

/** Job history as a sortable, filterable table. */
export function CareerTable() {
  return (
    <DataTable
      data={career}
      columns={columns}
      searchHint="Search position, company, or working stack"
      pageSize={6}
      emptyMessage="No role history matches this filter."
      facets={[
        { columnId: "level", label: "Level", options: LEVEL_OPTIONS },
        { columnId: "sector", label: "Sector", options: SECTOR_OPTIONS },
      ]}
    />
  );
}
