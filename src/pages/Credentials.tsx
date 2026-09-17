import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, ArrowRight, BadgeCheck, CalendarClock, GraduationCap, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { PageIntro, StatStrip } from "@/components/layout/PageIntro";
import { PageSection, SectionHeading } from "@/components/layout/SectionHeading";
import { ChartFrame, CHART_COLORS, TooltipShell } from "@/components/charts/ChartFrame";
import { CertificationTable } from "@/components/tables/CertificationTable";
import { CertificateSlideshow } from "@/components/CertificateSlideshow";
import { Reveal, RevealGroup, RevealItem } from "@/components/fx/Reveal";
import { Counter } from "@/components/fx/Counter";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useEntries } from "@/entries/EntriesProvider";
import { useSiteText } from "@/content/ContentProvider";
import type { Certification } from "@/data/portfolio";
import { nf } from "@/lib/utils";

const DOMAIN_COLOR: Record<Certification["domain"], string> = {
  Networking: CHART_COLORS.rust,
  Security: "#8b5cf6",
  "Cloud & Infra": CHART_COLORS.moss,
  "Service Management": "#c9a227",
  Data: "#2f9e8f",
  "Project Management": "#a9714b",
};

/** Months until expiry. Negative means it has already passed. */
function monthsTo(iso: string | null) {
  if (!iso) return null;
  const [y, m] = iso.split("-").map(Number);
  const now = new Date();
  return (y - now.getFullYear()) * 12 + (m - (now.getMonth() + 1));
}

function statusVariant(status: Certification["status"]): BadgeProps["variant"] {
  switch (status) {
    case "active":
      return "moss";
    case "renewing":
      return "accent";
    case "expired":
      return "danger";
    default:
      return "default";
  }
}

function StatusBadge({ cert }: { cert: Certification }) {
  return (
    <Badge variant={statusVariant(cert.status)} dot={cert.status === "renewing"}>
      {cert.status}
    </Badge>
  );
}

/** Certificate rows that need attention within the next 12 months. */
function RenewalRow({ cert }: { cert: Certification }) {
  const left = monthsTo(cert.expires) ?? 0;
  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-display text-[14px] font-medium tracking-tight">{cert.name}</p>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{cert.issuer}</p>
        <div className="mt-1.5">
          <StatusBadge cert={cert} />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-[12px] tabular-nums text-primary">{left} months left</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {cert.expires?.replace("-", "/")}
        </p>
      </div>
    </li>
  );
}

export default function Credentials() {
  const t = useSiteText();
  const { certifications } = useEntries();

  const activeCerts = certifications.filter((c) => c.status === "active");
  const expiredCerts = certifications.filter((c) => c.status === "expired");
  const renewingCerts = certifications.filter((c) => c.status === "renewing");
  const totalCost = certifications.reduce((acc, c) => acc + c.cost, 0);
  const permanentCerts = certifications.filter((c) => c.expires === null);
  const domains = [...new Set(certifications.map((c) => c.domain))];

  const timeline = [...certifications]
    .map((cert) => {
      const left = monthsTo(cert.expires);
      return {
        ...cert,
        left,
        // certificates without an expiry are drawn as a full bar
        bar: left === null ? 120 : Math.max(left, -12),
        color: DOMAIN_COLOR[cert.domain],
      };
    })
    .sort((a, b) => (b.bar ?? 0) - (a.bar ?? 0));

  const expiringSoon = certifications
    .filter((c) => {
      const left = monthsTo(c.expires);
      return left !== null && left > 0 && left <= 12;
    })
    .sort((a, b) => (monthsTo(a.expires) ?? 0) - (monthsTo(b.expires) ?? 0));

  const domainStats = domains
    .map((domain) => {
      const items = certifications.filter((c) => c.domain === domain);
      return {
        domain,
        count: items.length,
        cost: items.reduce((acc, c) => acc + c.cost, 0),
        color: DOMAIN_COLOR[domain],
      };
    })
    .sort((a, b) => b.count - a.count || b.cost - a.cost);

  const maxDomainCount = Math.max(1, ...domainStats.map((d) => d.count));

  const issuance = [...new Set(certifications.map((c) => c.issued.slice(0, 4)))]
    .sort()
    .map((year) => ({
      year,
      count: certifications.filter((c) => c.issued.startsWith(year)).length,
    }));

  return (
    <>
      <PageIntro
        index={t("credentials.intro.index")}
        eyebrow={t("credentials.eyebrow")}
        title={t("credentials.title")}
        lead={t("credentials.lead")}
      >
        <StatStrip
          items={[
            {
              label: t("credentials.stat.active"),
              value: (
                <span>
                  {activeCerts.length}
                  <span className="text-muted-foreground/60">/{certifications.length}</span>
                </span>
              ),
              hint: t("credentials.stat.active.hint", { count: permanentCerts.length }),
            },
            {
              label: t("credentials.stat.renewal"),
              value: (
                <Counter
                  value={renewingCerts.length + expiringSoon.length}
                  suffix={t("credentials.stat.renewal.suffix")}
                />
              ),
              hint: t("credentials.stat.renewal.hint", { count: expiredCerts.length }),
            },
            {
              label: t("credentials.stat.domains"),
              value: `${domains.length}`,
              hint: domains.join(" · "),
            },
            {
              label: t("credentials.stat.investment"),
              value: (
                <Counter
                  value={totalCost}
                  decimals={1}
                  prefix={t("credentials.stat.investment.prefix")}
                  suffix={t("credentials.stat.investment.suffix")}
                />
              ),
              hint: t("credentials.stat.investment.hint"),
            },
          ]}
        />
      </PageIntro>

      {/* 01 - validity window */}
      <PageSection>
        <SectionHeading
          index={t("credentials.validity.index")}
          eyebrow={t("credentials.validity.eyebrow")}
          title={t("credentials.validity.title")}
          description={t("credentials.validity.description")}
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-8">
            <ChartFrame
              title={t("credentials.validity.chart.title")}
              note={t("credentials.validity.chart.note")}
              legend={domains.map((domain) => ({ label: domain, color: DOMAIN_COLOR[domain] }))}
            >
              <ResponsiveContainer width="100%" height={430}>
                <BarChart
                  layout="vertical"
                  data={timeline}
                  margin={{ top: 4, right: 24, left: 4, bottom: 0 }}
                  barSize={13}
                >
                  <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="2 4" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[-12, 130]}
                    tickLine={false}
                    axisLine={{ stroke: CHART_COLORS.grid }}
                    tickFormatter={(v: number) => (v === 120 ? "permanent" : `${v}`)}
                    tick={{ fill: CHART_COLORS.axis, fontSize: 10.5, fontFamily: "JetBrains Mono" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="issuer"
                    width={130}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: CHART_COLORS.axis, fontSize: 10.5, fontFamily: "JetBrains Mono" }}
                  />
                  <ReferenceLine x={0} stroke={CHART_COLORS.rust} strokeDasharray="3 3" />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0].payload as (typeof timeline)[number];
                      return (
                        <TooltipShell
                          title={row.name}
                          rows={[
                            { label: t("credentials.validity.tip.issuer"), value: row.issuer },
                            {
                              label: t("credentials.validity.tip.domain"),
                              value: row.domain,
                              color: row.color,
                            },
                            {
                              label: t("credentials.validity.tip.validUntil"),
                              value: row.expires
                                ? row.expires.replace("-", "/")
                                : t("credentials.validity.tip.noExpiry"),
                            },
                            {
                              label: t("credentials.validity.tip.status"),
                              value:
                                row.left === null
                                  ? t("credentials.validity.tip.permanent")
                                  : row.left > 0
                                    ? t("credentials.validity.tip.monthsLeft", { count: row.left })
                                    : t("credentials.validity.tip.monthsOverdue", {
                                        count: Math.abs(row.left),
                                      }),
                              color: row.left !== null && row.left <= 0 ? CHART_COLORS.rustDeep : undefined,
                            },
                          ]}
                        />
                      );
                    }}
                  />
                  <Bar dataKey="bar" radius={[0, 3, 3, 0]}>
                    {timeline.map((d) => (
                      <Cell
                        key={d.id}
                        fill={d.color}
                        fillOpacity={d.status === "expired" ? 0.3 : 0.75}
                        stroke={d.color}
                        strokeWidth={d.status === "active" ? 0 : 1}
                        strokeDasharray={d.status === "renewing" ? "3 2" : undefined}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          </Reveal>

          <div className="space-y-6 lg:col-span-4">
            <Reveal delay={0.1}>
              <div className="panel-flagged p-5 pl-7 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-base font-semibold tracking-tight">
                      {t("credentials.validity.agenda.title")}
                    </h3>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {t("credentials.validity.agenda.note")}
                    </p>
                  </div>
                  <CalendarClock className="size-4 shrink-0 text-primary" />
                </div>

                {expiringSoon.length > 0 ? (
                  <ul className="mt-3 divide-y divide-border">
                    {expiringSoon.map((cert) => (
                      <RenewalRow key={cert.id} cert={cert} />
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
                    {t("credentials.validity.agenda.empty")}
                  </p>
                )}

                <Separator dashed className="mt-4" />
                <p className="mt-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {t("credentials.validity.agenda.midRenewal", {
                    count: renewingCerts.length,
                    names: renewingCerts.map((c) => c.name).join(", "),
                  })}
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="panel p-5 sm:p-6">
                <h3 className="font-display text-base font-semibold tracking-tight">
                  {t("credentials.validity.rhythm.title")}
                </h3>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {t("credentials.validity.rhythm.note")}
                </p>
                <ul className="mt-5 space-y-3">
                  {issuance.map((row) => (
                    <li key={row.year} className="flex items-center gap-3">
                      <span className="w-10 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                        {row.year}
                      </span>
                      <div className="flex flex-1 gap-1" aria-hidden>
                        {Array.from({ length: 4 }).map((_, i) => (
                          <span
                            key={i}
                            className={
                              i < row.count
                                ? "h-2 flex-1 rounded-[2px] bg-primary"
                                : "h-2 flex-1 rounded-[2px] bg-muted"
                            }
                          />
                        ))}
                      </div>
                      <span className="w-6 shrink-0 text-right font-mono text-[11px] tabular-nums text-foreground">
                        {row.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </PageSection>

      {/* 02 - domain composition */}
      <PageSection className="border-y border-border bg-card/25">
        <SectionHeading
          index={t("credentials.composition.index")}
          eyebrow={t("credentials.composition.eyebrow")}
          title={t("credentials.composition.title")}
          description={t("credentials.composition.description")}
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <RevealGroup className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:col-span-8">
            {domainStats.map((row) => (
              <RevealItem key={row.domain} className="bg-card">
                <div className="group h-full p-6 transition-colors duration-300 hover:bg-muted/40">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden
                        className="size-2.5 rounded-[2px]"
                        style={{ backgroundColor: row.color }}
                      />
                      <h3 className="font-display text-[15px] font-semibold tracking-tight">
                        {row.domain}
                      </h3>
                    </div>
                    <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
                      {t("credentials.composition.share", {
                        count: row.count,
                        total: certifications.length,
                      })}
                    </span>
                  </div>

                  <Progress
                    value={(row.count / maxDomainCount) * 100}
                    className="mt-4 h-1.5"
                    indicatorClassName="bg-foreground/70"
                    aria-label={t("credentials.composition.share.aria", {
                      count: row.count,
                      domain: row.domain,
                    })}
                  />

                  <p className="mt-3 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {t("credentials.composition.cost", { amount: nf(row.cost, 1) })}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal delay={0.1} className="lg:col-span-4">
            <div className="panel-flagged h-full p-5 pl-7 sm:p-6">
              <p className="eyebrow flex items-center gap-2">
                <AlertTriangle className="size-3.5 text-primary" />
                {t("credentials.composition.gap.eyebrow")}
              </p>
              <h3 className="mt-3 font-display text-lg font-semibold leading-snug tracking-tight">
                {t("credentials.composition.gap.title")}
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                {t("credentials.composition.gap.body")}
              </p>
              <Separator dashed className="my-5" />
              <ul className="space-y-2.5">
                {[
                  t("credentials.composition.gap.item.1", { count: activeCerts.length }),
                  t("credentials.composition.gap.item.2", { count: expiredCerts.length }),
                  t("credentials.composition.gap.item.3"),
                ].map((line) => (
                  <li key={line} className="flex gap-2.5">
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-moss-400" aria-hidden />
                    <span className="text-[13.5px] leading-relaxed text-foreground/90">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </PageSection>

      {/* 03 - table */}
      <PageSection>
        <SectionHeading
          index={t("credentials.table.index")}
          eyebrow={t("credentials.table.eyebrow")}
          title={t("credentials.table.title")}
          description={t("credentials.table.description")}
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/skills">
                {t("credentials.related.button")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
        />
        <Reveal className="mt-10">
          <CertificationTable />
        </Reveal>
      </PageSection>

      {/* 04 - the scans themselves, absent until the owner uploads one */}
      <CertificateSlideshow />

      {/* CTA */}
      <PageSection className="pt-0">
        <Reveal>
          <div className="panel flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <p className="eyebrow flex items-center gap-2">
                <GraduationCap className="size-3.5 text-primary" />
                {t("credentials.cta.eyebrow")}
              </p>
              <p className="mt-3 max-w-xl font-display text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
                {t("credentials.cta.body")}
              </p>
              <p className="mt-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <Wallet className="size-3.5" />
                {t("credentials.cta.invested", {
                  amount: nf(totalCost, 1),
                  count: certifications.length,
                  noun:
                    certifications.length === 1
                      ? t("credentials.cta.noun.one")
                      : t("credentials.cta.noun.many"),
                })}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/skills">
                  {t("credentials.cta.button.skills")}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contact">{t("credentials.cta.button.contact")}</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </PageSection>
    </>
  );
}
