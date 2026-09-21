import * as React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coins,
  MapPin,
  PauseCircle,
  Users,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageIntro, StatStrip } from "@/components/layout/PageIntro";
import { PageSection, SectionHeading } from "@/components/layout/SectionHeading";
import { ChartFrame, CHART_COLORS } from "@/components/charts/ChartFrame";
import { BudgetImpactChart, BudgetImpactScatter, KIND_COLOR, ProjectMap } from "@/components/charts/ProjectCharts";
import { ProjectTable } from "@/components/tables/ProjectTable";
import { Reveal, RevealGroup, RevealItem } from "@/components/fx/Reveal";
import { SpotlightCard } from "@/components/fx/SpotlightCard";
import { Counter } from "@/components/fx/Counter";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEntries } from "@/entries/EntriesProvider";
import { chartValue } from "@/entries/chartSeries";
import { useSiteText } from "@/content/ContentProvider";
import type { Project } from "@/data/portfolio";
import { nf } from "@/lib/utils";

/**
 * The mix is set by hand on the Charts tab, so a kind can be any label the
 * owner typed. An unknown label falls back to a neutral colour rather than
 * throwing on the map lookup.
 */
function kindColor(kind: string): string {
  return (KIND_COLOR as Record<string, string | undefined>)[kind] ?? CHART_COLORS.dim;
}

function statusVariant(status: Project["status"]): BadgeProps["variant"] {
  switch (status) {
    case "live":
    case "active":
      return "moss";
    case "completed":
      return "muted";
    case "on-hold":
      return "danger";
    default:
      return "default";
  }
}

function StatusBadge({ project }: { project: Project }) {
  return (
    <Badge variant={statusVariant(project.status)} dot={project.status === "active"}>
      {project.status}
    </Badge>
  );
}

/** Detail for a single project. Rendered in a dialog so the list stays compact. */
function ProjectDetail({ project }: { project: Project }) {
  const t = useSiteText();
  const { photosFor } = useEntries();
  const photos = photosFor(project.id);
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent" size="sm">
          {project.year}
        </Badge>
        <Badge variant="default" size="sm">
          {project.kind}
        </Badge>
        <StatusBadge project={project} />
        {project.featured && (
          <Badge variant="solid" size="sm">
            {t("projects.card.featured")}
          </Badge>
        )}
      </div>

      <DialogTitle className="mt-4">{project.name}</DialogTitle>
      <DialogDescription>{project.summary}</DialogDescription>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-notch border border-border bg-border sm:grid-cols-4">
        {[
          { label: t("projects.detail.role"), value: project.role },
          {
            label: t("projects.detail.duration"),
            value: t("projects.detail.value.months", { count: project.months }),
          },
          {
            label: t("projects.detail.teamSize"),
            value: t("projects.detail.value.people", { count: project.teamSize }),
          },
          {
            label: t("projects.detail.budget"),
            value: project.budgetM
              ? t("projects.detail.value.budget", { amount: nf(project.budgetM) })
              : t("projects.detail.value.internal"),
          },
        ].map((item) => (
          <div key={item.label} className="bg-card px-3.5 py-3">
            <dt className="eyebrow">{item.label}</dt>
            <dd className="mt-1.5 font-display text-[15px] font-semibold tracking-tight">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-4">
          <span className="eyebrow">{t("projects.detail.impact")}</span>
          <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
            {project.impact} / 100
          </span>
        </div>
        <Progress
          value={project.impact}
          className="mt-2"
          indicatorClassName={project.status === "on-hold" ? "bg-muted-foreground" : undefined}
        />
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
          {t("projects.detail.impact.note")}
        </p>
      </div>

      <Separator dashed className="my-6" />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
        <span className="flex items-center gap-2">
          <MapPin className="size-3.5" />
          {project.location}
        </span>
        <span className="flex items-center gap-2">
          <Users className="size-3.5" />
          {t("projects.detail.team", { count: project.teamSize })}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {project.stack.map((tech) => (
          <Badge key={tech} variant="outline" size="sm">
            {tech}
          </Badge>
        ))}
      </div>

      {photos.length > 0 ? (
        <>
          <Separator dashed className="my-6" />
          <div className="flex items-baseline justify-between gap-4">
            <span className="eyebrow">{t("projects.detail.gallery")}</span>
            <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
              {t("projects.detail.value.photos", { count: photos.length })}
            </span>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {photos.map((photo, index) => (
              <li key={photo.id}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  className="group block w-full text-left"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || t("projects.detail.gallery.alt", { name: project.name })}
                    loading="lazy"
                    className="aspect-[4/3] w-full rounded-notch border border-border object-cover transition-opacity group-hover:opacity-90"
                  />
                  {photo.caption ? (
                    <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                      {photo.caption}
                    </p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          {openIndex !== null && photos[openIndex] ? (
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t("projects.detail.gallery")}
              className="fixed inset-0 z-[60] flex flex-col bg-ink-950/95 p-4"
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpenIndex(null);
              }}
            >
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setOpenIndex(null)}
                  className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                  <span className="sr-only">{t("projects.detail.gallery.close")}</span>
                </button>
              </div>
              <div className="flex min-h-0 flex-1 items-center justify-center">
                <img
                  src={photos[openIndex].url}
                  alt={
                    photos[openIndex].caption ||
                    t("projects.detail.gallery.alt", { name: project.name })
                  }
                  className="max-h-full max-w-full rounded-notch object-contain"
                />
              </div>
              <div className="flex items-center justify-between gap-4 pt-3">
                <button
                  type="button"
                  onClick={() =>
                    setOpenIndex((index) =>
                      index === null ? index : (index - 1 + photos.length) % photos.length,
                    )
                  }
                  className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ChevronLeft className="size-4" />
                  <span className="sr-only">{t("projects.detail.gallery.prev")}</span>
                </button>
                <p className="text-center font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {photos[openIndex].caption ||
                    t("projects.detail.gallery.counter", {
                      position: openIndex + 1,
                      total: photos.length,
                      name: project.name,
                    })}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setOpenIndex((index) =>
                      index === null ? index : (index + 1) % photos.length,
                    )
                  }
                  className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ChevronRight className="size-4" />
                  <span className="sr-only">{t("projects.detail.gallery.next")}</span>
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}

/** Featured project card: brief on the outside, detailed inside the dialog. */
function FeaturedCard({ project }: { project: Project }) {
  const t = useSiteText();
  return (
    <SpotlightCard className="flex h-full flex-col p-0">
      <div
        aria-hidden
        className="h-1 w-full"
        style={{ backgroundColor: KIND_COLOR[project.kind] }}
      />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">{project.role}</p>
            <h3 className="mt-2 font-display text-lg font-semibold leading-snug tracking-tight">
              {project.name}
            </h3>
          </div>
          <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
            {project.year}
          </span>
        </div>

        <p className="mt-3 flex-1 text-[14px] leading-relaxed text-muted-foreground">
          {project.summary}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <StatusBadge project={project} />
          <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            <Activity className="size-3.5 text-primary" />
            {t("projects.card.impact", { value: project.impact })}
          </span>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="mt-5 w-full">
              {t("projects.card.open")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <ProjectDetail project={project} />
          </DialogContent>
        </Dialog>
      </div>
    </SpotlightCard>
  );
}

export default function Projects() {
  const t = useSiteText();
  const { projects, chartRows } = useEntries();

  const totalBudget = projects.reduce((acc, p) => acc + p.budgetM, 0);
  const totalMonths = projects.reduce((acc, p) => acc + p.months, 0);
  const activeProjects = projects.filter((p) => p.status === "active" || p.status === "live").length;
  const heldProjects = projects.filter((p) => p.status === "on-hold");
  const avgImpact =
    projects.length > 0
      ? Math.round(projects.reduce((acc, p) => acc + p.impact, 0) / projects.length)
      : 0;
  const peakImpact = [...projects].sort((a, b) => b.impact - a.impact)[0] ?? null;
  const crossSite = projects.filter((p) => /stores|branches|Sumatra|sites/i.test(p.location)).length;
  const featured = projects.filter((p) => p.featured);

  // The count and the budget are set from the chart editor, so the mix can be
  // stated by hand. The colour still comes from the kind's own entry colour.
  const kindCount = chartRows("projects-kinds")
    .map((row) => ({
      kind: row.name,
      count: chartValue(row, "count"),
      budget: chartValue(row, "budget"),
    }))
    .sort((a, b) => b.count - a.count);

  const yearCount = [...new Set(projects.map((p) => p.year))]
    .sort((a, b) => b - a)
    .map((year) => ({
      year,
      count: projects.filter((p) => p.year === year).length,
      budget: projects.filter((p) => p.year === year).reduce((acc, p) => acc + p.budgetM, 0),
    }));

  const maxYearCount = Math.max(1, ...yearCount.map((y) => y.count));

  return (
    <>
      <PageIntro
        eyebrow={t("projects.eyebrow")}
        title={t("projects.title")}
        lead={t("projects.lead")}
      >
        <StatStrip
          items={[
            {
              label: t("projects.stat.budget"),
              value: <Counter value={Math.round(totalBudget / 1000)} prefix="Rp " suffix="B" />,
              hint: t("projects.stat.hint.months", { count: totalMonths }),
            },
            {
              label: t("projects.stat.running"),
              value: `${activeProjects} of ${projects.length}`,
              hint: t("projects.stat.hint.onHold", { count: heldProjects.length }),
            },
            {
              label: t("projects.stat.sites"),
              value: `${crossSite}`,
              hint: t("projects.stat.hint.sites"),
            },
            {
              label: t("projects.stat.impact"),
              value: `${avgImpact}/100`,
              hint: peakImpact
                ? t("projects.stat.hint.peakImpact", {
                    value: peakImpact.impact,
                    name: peakImpact.name,
                  })
                : t("projects.stat.hint.noImpact"),
            },
          ]}
        />
      </PageIntro>

      {/* 01 - quick read */}
      <PageSection>
        <SectionHeading
          eyebrow={t("projects.quickread.eyebrow")}
          title={t("projects.quickread.title")}
          description={t("projects.quickread.description")}
        />

        <div className="mt-10 space-y-6">
          <Reveal>
            <ChartFrame
              title={t("projects.chart.map.title")}
              note={t("projects.chart.map.note")}
              legend={[...new Set(projects.map((p) => p.kind))].map((kind) => ({
                label: kind,
                color: KIND_COLOR[kind],
              }))}
            >
              <ProjectMap projects={projects} />
            </ChartFrame>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <ChartFrame
                title={t("projects.chart.budget.title")}
                note={t("projects.chart.budget.note")}
                legend={[
                  { label: t("projects.chart.budget.legend.budget"), color: CHART_COLORS.dim },
                  { label: t("projects.chart.budget.legend.impact"), color: CHART_COLORS.rust },
                ]}
              >
                <BudgetImpactChart />
              </ChartFrame>
            </Reveal>

            <Reveal className="lg:col-span-5" delay={0.1}>
              <ChartFrame
                title={t("projects.chart.spread.title")}
                note={t("projects.chart.spread.note")}
              >
                <ul className="space-y-3.5">
                  {yearCount.map((row) => (
                    <li key={row.year}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-mono text-[12px] tabular-nums text-foreground">
                          {row.year}
                        </span>
                        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                          {t("projects.chart.spread.value", {
                            count: row.count,
                            amount: nf(row.budget),
                          })}
                        </span>
                      </div>
                      <Progress
                        value={(row.count / maxYearCount) * 100}
                        className="mt-2 h-1.5"
                        indicatorClassName="bg-foreground/70"
                        aria-label={t("projects.chart.spread.aria", {
                          count: row.count,
                          year: row.year,
                        })}
                      />
                    </li>
                  ))}
                </ul>
              </ChartFrame>
            </Reveal>
          </div>
        </div>
      </PageSection>

      {/* 02 - featured */}
      <PageSection className="border-y border-border bg-card/25">
        <SectionHeading
          eyebrow={t("projects.featured.eyebrow")}
          title={t("projects.featured.title")}
          description={t("projects.featured.description")}
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/skills">
                {t("projects.featured.skills.title")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
        />

        <RevealGroup className="mt-10 grid gap-6 md:grid-cols-2">
          {featured.map((project) => (
            <RevealItem key={project.id} className="h-full">
              <FeaturedCard project={project} />
            </RevealItem>
          ))}
        </RevealGroup>
      </PageSection>

      {/* 03 - composition */}
      <PageSection>
        <SectionHeading
          eyebrow={t("projects.composition.eyebrow")}
          title={t("projects.composition.title")}
          description={t("projects.composition.note")}
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <ChartFrame
              title={t("projects.chart.scatter.title")}
              note={t("projects.chart.scatter.note")}
            >
              <BudgetImpactScatter />
            </ChartFrame>
          </Reveal>

          <Reveal className="lg:col-span-5" delay={0.1}>
            <div className="panel-flagged p-5 sm:p-6">
              <h3 className="pl-2 font-display text-base font-semibold tracking-tight">
                {t("projects.composition.kinds.title")}
              </h3>
              <p className="mt-1 pl-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {t("projects.composition.kinds.subtitle")}
              </p>
              <ul className="mt-5 space-y-4 pl-2">
                {kindCount.map((row) => (
                  <li key={row.kind} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="mt-[6px] size-2.5 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: kindColor(row.kind) }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate font-display text-[14px] font-medium tracking-tight">
                          {row.kind}
                        </span>
                        <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                          {t("projects.composition.kinds.count", { count: row.count })}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[11px] tabular-nums text-muted-foreground">
                        {t("projects.composition.kinds.budget", { amount: nf(row.budget) })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-6">
          <div className="panel-flagged p-6 pl-8 sm:p-8">
            <p className="eyebrow flex items-center gap-2">
              <AlertTriangle className="size-3.5 text-primary" />
              {t("projects.hold.eyebrow")}
            </p>
            <p className="mt-3 max-w-3xl font-display text-lg font-semibold leading-snug tracking-tight sm:text-xl">
              {t("projects.hold.title")}
            </p>
            <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-muted-foreground">
              {t("projects.hold.body", {
                names: heldProjects.map((p) => p.name).join(", "),
              })}
            </p>
          </div>
        </Reveal>
      </PageSection>

      {/* 04 - table */}
      <PageSection className="border-t border-border bg-card/25">
        <SectionHeading
          eyebrow={t("projects.table.eyebrow")}
          title={t("projects.table.title")}
          description={t("projects.table.description")}
        />
        <Reveal className="mt-10">
          <ProjectTable />
        </Reveal>
      </PageSection>

      {/* CTA */}
      <PageSection>
        <Reveal>
          <div className="panel-flagged relative overflow-hidden p-8 sm:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 grid-lines opacity-35"
            />
            <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-8">
                <p className="eyebrow flex items-center gap-2">
                  <Coins className="size-3.5 text-primary" />
                  {t("projects.cta.eyebrow")}
                </p>
                <p className="mt-3 max-w-2xl font-display text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
                  {t("projects.cta.title")}
                </p>
                <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-moss-400" />
                    {t("projects.cta.point.data")}
                  </li>
                  <li className="flex items-center gap-2">
                    <PauseCircle className="size-3.5 text-primary" />
                    {t("projects.cta.point.noHidden")}
                  </li>
                </ul>
              </div>
              <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
                <Button asChild>
                  <Link to="/credentials">
                    {t("projects.cta.button.credentials")}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/contact">{t("projects.cta.button.contact")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </PageSection>
    </>
  );
}
