import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/DataTable";
import { useSiteText } from "@/content/ContentProvider";
import { nf } from "@/lib/utils";
import { useEntries } from "@/entries/EntriesProvider";
import type { Certification } from "@/data/portfolio";

function formatMonth(iso: string | null, noExpiry: string) {
  if (!iso) return noExpiry;
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

function makeColumns(t: ReturnType<typeof useSiteText>): ColumnDef<Certification, unknown>[] {
  const noExpiry = t("credentials.table.value.noExpiry");

  return [
    {
      accessorKey: "name",
      header: t("credentials.table.col.name"),
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
      header: t("credentials.table.col.domain"),
      filterFn: "equalsString",
      meta: { cellClassName: "whitespace-nowrap" },
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] text-muted-foreground">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "issuer",
      header: t("credentials.table.col.issuer"),
      meta: { cellClassName: "whitespace-nowrap font-mono text-[12px] text-muted-foreground" },
    },
    {
      accessorKey: "issued",
      header: t("credentials.table.col.issued"),
      meta: { cellClassName: "whitespace-nowrap font-mono text-[12px] tabular-nums" },
      cell: ({ getValue }) => formatMonth(getValue() as string, noExpiry),
    },
    {
      accessorKey: "expires",
      header: t("credentials.table.col.expires"),
      meta: { cellClassName: "whitespace-nowrap" },
      cell: ({ row }) => {
        const soon = monthsToExpiry(row.original.expires);
        return (
          <span className="flex items-center gap-2 font-mono text-[12px] tabular-nums">
            {formatMonth(row.original.expires, noExpiry)}
            {soon !== null && soon <= 12 && (
              <span
                className="inline-flex items-center gap-1 text-primary"
                title={t("credentials.table.expiry.title", { count: soon })}
              >
                <AlertTriangle className="size-3.5" />
                {t("credentials.table.expiry.short", { count: soon })}
              </span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: t("credentials.table.col.status"),
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
      header: t("credentials.table.col.credentialId"),
      meta: { cellClassName: "whitespace-nowrap font-mono text-[12px] text-muted-foreground" },
      cell: ({ getValue }) => (
        <span className="select-all">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "cost",
      header: t("credentials.table.col.cost"),
      meta: {
        headClassName: "text-right",
        cellClassName: "text-right font-mono text-[12px] tabular-nums text-muted-foreground",
      },
      cell: ({ getValue }) =>
        t("credentials.table.value.cost", { amount: nf(getValue() as number, 1) }),
    },
  ];
}

/**
 * Certification table. The "cost" column is shown plainly on purpose,
 * as context for the learning investment, not to show off numbers.
 */
export function CertificationTable() {
  const t = useSiteText();
  const { certifications } = useEntries();
  const columns = React.useMemo(() => makeColumns(t), [t]);

  // Domains and issuers are free text, so the filters follow the stored rows.
  const domains = [...new Set(certifications.map((c) => c.domain))];
  const statuses = [...new Set(certifications.map((c) => c.status))];
  const issuers = [...new Set(certifications.map((c) => c.issuer))].sort();

  return (
    <DataTable
      data={certifications}
      columns={columns}
      searchHint={t("credentials.table.searchHint")}
      pageSize={8}
      footnote={t("credentials.table.footnote")}
      facets={[
        { columnId: "domain", label: t("credentials.table.facet.domain"), options: domains },
        { columnId: "status", label: t("credentials.table.facet.status"), options: statuses },
        { columnId: "issuer", label: t("credentials.table.facet.issuer"), options: issuers },
      ]}
    />
  );
}
