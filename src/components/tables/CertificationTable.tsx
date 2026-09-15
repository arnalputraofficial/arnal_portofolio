import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/DataTable";
import { nf } from "@/lib/utils";
import { certifications, type Certification } from "@/data/portfolio";

const DOMAIN_OPTIONS = [...new Set(certifications.map((c) => c.domain))];
const STATUS_OPTIONS = [...new Set(certifications.map((c) => c.status))];
const ISSUER_OPTIONS = [...new Set(certifications.map((c) => c.issuer))].sort();

function formatMonth(iso: string | null) {
  if (!iso) return "no expiry";
  return new Date(`${iso}-01`).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/** Months until expiry; null when there is no date or it has already passed. */
function monthsToExpiry(iso: string | null) {
  if (!iso) return null;
  const [y, m] = iso.split("-").map(Number);
  const now = new Date();
  const diff = (y - now.getFullYear()) * 12 + (m - (now.getMonth() + 1));
  return diff > 0 ? diff : null;
}

function statusVariant(status: Certification["status"]) {
  switch (status) {
    case "active":
      return "moss" as const;
    case "renewing":
      return "accent" as const;
    case "expired":
      return "danger" as const;
    default:
      return "default" as const;
  }
}

const columns: ColumnDef<Certification, unknown>[] = [
  {
    accessorKey: "name",
    header: "Certification",
    meta: { cellClassName: "min-w-[260px]" },
    cell: ({ row }) => (
      <div>
        <p className="font-display text-[15px] font-semibold leading-snug tracking-tight">
          {row.original.name}
        </p>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">{row.original.issuer}</p>
      </div>
    ),
  },
  {
    accessorKey: "domain",
    header: "Domain",
    filterFn: "equalsString",
    meta: { cellClassName: "whitespace-nowrap" },
    cell: ({ getValue }) => (
      <span className="font-mono text-[12px] text-muted-foreground">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "issuer",
    header: "Issuer",
    meta: { cellClassName: "whitespace-nowrap font-mono text-[12px] text-muted-foreground" },
  },
  {
    accessorKey: "issued",
    header: "Issued",
    meta: { cellClassName: "whitespace-nowrap font-mono text-[12px] tabular-nums" },
    cell: ({ getValue }) => formatMonth(getValue() as string),
  },
  {
    accessorKey: "expires",
    header: "Valid until",
    meta: { cellClassName: "whitespace-nowrap" },
    cell: ({ row }) => {
      const soon = monthsToExpiry(row.original.expires);
      return (
        <span className="flex items-center gap-2 font-mono text-[12px] tabular-nums">
          {formatMonth(row.original.expires)}
          {soon !== null && soon <= 12 && (
            <span
              className="inline-flex items-center gap-1 text-primary"
              title={`Less than ${soon} months left`}
            >
              <AlertTriangle className="size-3.5" />
              {soon} mo
            </span>
          )}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    meta: { cellClassName: "whitespace-nowrap" },
    cell: ({ getValue }) => {
      const value = getValue() as Certification["status"];
      return (
        <Badge variant={statusVariant(value)} dot={value === "active"}>
          {value}
        </Badge>
      );
    },
  },
  {
    accessorKey: "credentialId",
    header: "Credential ID",
    meta: { cellClassName: "whitespace-nowrap font-mono text-[12px] text-muted-foreground" },
    cell: ({ getValue }) => (
      <span className="select-all">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "cost",
    header: "Cost",
    meta: {
      headClassName: "text-right",
      cellClassName: "text-right font-mono text-[12px] tabular-nums text-muted-foreground",
    },
    cell: ({ getValue }) => `Rp ${nf(getValue() as number, 1)}m`,
  },
];

/**
 * Certification table. The "cost" column is shown plainly on purpose,
 * as context for the learning investment, not to show off numbers.
 */
export function CertificationTable() {
  return (
    <DataTable
      data={certifications}
      columns={columns}
      searchHint="Search certification, issuer, or credential ID"
      pageSize={8}
      footnote="Credential IDs can be copied for verification"
      facets={[
        { columnId: "domain", label: "Domain", options: DOMAIN_OPTIONS },
        { columnId: "status", label: "Status", options: STATUS_OPTIONS },
        { columnId: "issuer", label: "Issuer", options: ISSUER_OPTIONS },
      ]}
    />
  );
}
