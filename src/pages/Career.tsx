import { ArrowRight, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { PageSection, SectionHeading } from "@/components/layout/SectionHeading";
import { PageIntro, StatStrip } from "@/components/layout/PageIntro";
import { CareerTenureChart, RoleScopeScatter } from "@/components/charts/CareerCharts";
import { ChartFrame, CHART_COLORS } from "@/components/charts/ChartFrame";
import { CareerTable } from "@/components/tables/CareerTable";
import { Reveal, RevealGroup, RevealItem } from "@/components/fx/Reveal";
import { Counter } from "@/components/fx/Counter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEntries } from "@/entries/EntriesProvider";
import { useSiteText } from "@/content/ContentProvider";
import { humanDuration, monthsBetween } from "@/lib/utils";

function levelVariant(level: string) {
  return level === "IC" ? ("muted" as const) : ("accent" as const);
}

export default function Career() {
  const t = useSiteText();
  const { career } = useEntries();

  const totalMonths = career.reduce((acc, role) => acc + monthsBetween(role.start, role.end), 0);
  const ledRoles = career.filter((role) => role.level !== "IC");
  const peakTeam = Math.max(0, ...career.map((role) => role.headcount));
  const sectors = [...new Set(career.map((role) => role.sector))];
  const ordered = [...career].reverse();
  const firstYear = career.reduce(
    (earliest, role) => Math.min(earliest, Number(role.start.slice(0, 4))),
    new Date().getFullYear(),
  );

  return (
    <>
      <PageIntro
        index={t("career.intro.index")}
        eyebrow={t("career.eyebrow")}
        title={
          career.length > 0
            ? t("career.title.withData", { years: Math.round(totalMonths / 12) })
            : t("career.title")
        }
        lead={t("career.lead")}
      >
        <StatStrip
          items={[
            {
              label: t("career.stat.tenure"),
              value: (
                <Counter
                  value={Math.round(totalMonths / 12)}
                  suffix={t("career.stat.tenure.suffix")}
                />
              ),
              hint: t("career.stat.tenure.hint", { months: totalMonths, year: firstYear }),
            },
            {
              label: t("career.stat.leadership"),
              value: t("career.stat.leadership.value", {
                led: ledRoles.length,
                total: career.length,
              }),
              hint: t("career.stat.leadership.hint"),
            },
            {
              label: t("career.stat.peakTeam"),
              value: <Counter value={peakTeam} suffix={t("career.stat.peakTeam.suffix")} />,
              hint: t("career.stat.peakTeam.hint"),
            },
            {
              label: t("career.stat.sectors"),
              value: `${sectors.length}`,
              hint: sectors.join(" · "),
            },
          ]}
        />
      </PageIntro>

      {/* ------------------------------------------------------------- charts */}
      <PageSection>
        <SectionHeading
          index={t("career.section.shape.index")}
          eyebrow={t("career.shape.eyebrow")}
          title={t("career.shape.title")}
          description={t("career.shape.description")}
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <ChartFrame
              title={t("career.chart.tenure.title")}
              note={t("career.chart.tenure.note")}
              legend={[
                { label: t("career.chart.tenure.legend.ic"), color: CHART_COLORS.moss },
                { label: t("career.chart.tenure.legend.lead"), color: CHART_COLORS.rust },
              ]}
            >
              <CareerTenureChart />
            </ChartFrame>
          </Reveal>

          <Reveal delay={0.1}>
            <ChartFrame
              title={t("career.chart.scope.title")}
              note={t("career.chart.scope.note")}
              legend={[
                { label: t("career.chart.scope.legend.people"), color: CHART_COLORS.rust },
                { label: t("career.chart.scope.legend.technical"), color: CHART_COLORS.moss },
              ]}
            >
              <RoleScopeScatter />
            </ChartFrame>
          </Reveal>
        </div>
      </PageSection>

      {/* ------------------------------------------------------------ timeline */}
      <PageSection className="pt-0">
        <SectionHeading
          index={t("career.section.timeline.index")}
          eyebrow={t("career.timeline.eyebrow")}
          title={t("career.timeline.title")}
          description={t("career.timeline.description")}
        />

        <RevealGroup className="mt-10 space-y-4">
          {ordered.map((role, index) => {
            const months = monthsBetween(role.start, role.end);
            const isCurrent = role.end === null;

            return (
              <RevealItem key={role.id}>
                <article className="panel-flagged">
                  <div className="grid gap-6 p-6 pl-8 lg:grid-cols-12 lg:gap-8 lg:p-8 lg:pl-10">
                    {/* time column */}
                    <div className="lg:col-span-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] tabular-nums text-primary">
                          {role.start.replace("-", "/")}
                        </span>
                        <span aria-hidden className="hairline flex-1" />
                        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                          {role.end ? role.end.replace("-", "/") : t("career.timeline.period.now")}
                        </span>
                      </div>

                      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                        {humanDuration(months)} · {role.location}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        <Badge variant={levelVariant(role.level)}>{role.level}</Badge>
                        {isCurrent && (
                          <Badge variant="moss" dot>
                            {t("career.timeline.badge.current")}
                          </Badge>
                        )}
                        {index === 0 && (
                          <Badge variant="solid">{t("career.timeline.badge.latest")}</Badge>
                        )}
                      </div>
                    </div>

                    {/* content column */}
                    <div className="lg:col-span-9">
                      <h3 className="font-display text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
                        {role.title}
                      </h3>
                      <p className="mt-1 font-mono text-[12px] text-muted-foreground">
                        {role.company} · {role.sector}
                      </p>

                      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground text-pretty">
                        {role.summary}
                      </p>

                      <Separator className="my-6" />

                      <ul className="space-y-3">
                        {role.highlights.map((item) => (
                          <li key={item} className="flex gap-3">
                            <CheckCircle2
                              className="mt-0.5 size-4 shrink-0 text-accent"
                              aria-hidden
                            />
                            <span className="text-sm leading-relaxed text-foreground/90">{item}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-6 flex flex-wrap items-center gap-2">
                        <span className="eyebrow mr-1">stack</span>
                        {role.stack.map((tech) => (
                          <Badge key={tech} variant="default" size="sm">
                            {tech}
                          </Badge>
                        ))}
                      </div>

                      {role.headcount > 0 && (
                        <p className="mt-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                          <Users className="size-3.5 text-primary" />
                          leading {role.headcount} people directly
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </PageSection>

      {/* --------------------------------------------------------------- table */}
      <PageSection className="pt-0">
        <SectionHeading
          index={t("career.table.index")}
          eyebrow={t("career.table.eyebrow")}
          title={t("career.table.title")}
          description={t("career.table.description")}
        />
        <div className="mt-10">
          <CareerTable />
        </div>
      </PageSection>

      {/* ------------------------------------------------------------ links */}
      <PageSection className="pt-0">
        <Reveal>
          <div className="panel flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <p className="eyebrow flex items-center gap-2">
                <TrendingUp className="size-3.5 text-primary" />
                {t("career.cta.eyebrow")}
              </p>
              <p className="mt-3 max-w-xl font-display text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
                {t("career.cta.body")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/projects">
                  {t("career.cta.button.projects")}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/skills">{t("career.cta.button.skills")}</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </PageSection>
    </>
  );
}
