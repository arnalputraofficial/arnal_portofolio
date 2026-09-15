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
import { career } from "@/data/portfolio";
import { humanDuration, monthsBetween } from "@/lib/utils";

const totalMonths = career.reduce((acc, role) => acc + monthsBetween(role.start, role.end), 0);
const ledRoles = career.filter((role) => role.level !== "IC");
const peakTeam = Math.max(...career.map((role) => role.headcount));
const sectors = [...new Set(career.map((role) => role.sector))];
const ordered = [...career].reverse();

function levelVariant(level: string) {
  return level === "IC" ? ("muted" as const) : ("accent" as const);
}

export default function Career() {
  return (
    <>
      <PageIntro
        index="02"
        eyebrow="Career File"
        title="Ten years from fixing tickets to owning the budget"
        lead="I did not move around chasing job titles. Each move added one more kind of responsibility: devices, then networks, then people, then budget and technical direction."
      >
        <StatStrip
          items={[
            {
              label: "Total tenure",
              value: <Counter value={Math.round(totalMonths / 12)} suffix=" yrs" />,
              hint: `${totalMonths} months since 2015`,
            },
            {
              label: "Leadership roles",
              value: `${ledRoles.length} of ${career.length}`,
              hint: "SPV, Lead, and senior technical roles",
            },
            {
              label: "Largest team",
              value: <Counter value={peakTeam} suffix=" people" />,
              hint: "Direct reports, not the whole division",
            },
            {
              label: "Sectors covered",
              value: `${sectors.length}`,
              hint: sectors.join(" · "),
            },
          ]}
        />
      </PageIntro>

      {/* ------------------------------------------------------------- charts */}
      <PageSection>
        <SectionHeading
          index="01"
          eyebrow="Shape"
          title="A trajectory, not a list of dates"
          description="Two different angles: one shows when leadership responsibility started to appear, the other compares time in role against the size of the team held."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <ChartFrame
              title="Active roles per year"
              note="Stacked bars separate technical years from leadership years. Watch 2020, the point where I moved into a supervisor role."
              legend={[
                { label: "Individual contributor", color: CHART_COLORS.moss },
                { label: "Leading a team", color: CHART_COLORS.rust },
              ]}
            >
              <CareerTenureChart />
            </ChartFrame>
          </Reveal>

          <Reveal delay={0.1}>
            <ChartFrame
              title="Time in role against team size"
              note="A rust bar means that role led people. A moss bar means it was purely technical."
              legend={[
                { label: "Leading people", color: CHART_COLORS.rust },
                { label: "Purely technical", color: CHART_COLORS.moss },
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
          index="02"
          eyebrow="Timeline"
          title="What actually changed at each stage"
          description="Role summaries, numbers I can stand behind, and the tools I genuinely used."
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
                          {role.end ? role.end.replace("-", "/") : "now"}
                        </span>
                      </div>

                      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                        {humanDuration(months)} · {role.location}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        <Badge variant={levelVariant(role.level)}>{role.level}</Badge>
                        {isCurrent && (
                          <Badge variant="moss" dot>
                            running
                          </Badge>
                        )}
                        {index === 0 && <Badge variant="solid">latest</Badge>}
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
          index="03"
          eyebrow="Table"
          title="Compare it yourself, do not take my summary at face value"
          description="Filter by job level or sector, then sort by time in role. Everything runs in your browser."
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
                continued
              </p>
              <p className="mt-3 max-w-xl font-display text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
                This history is only the frame. The evidence of the work lives on the projects and
                skills pages.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/projects">
                  View projects
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/skills">Check the skills</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </PageSection>
    </>
  );
}
