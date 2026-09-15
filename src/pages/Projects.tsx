import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Coins,
  MapPin,
  PauseCircle,
  Users,
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
import { projects, type Project } from "@/data/portfolio";
import { nf } from "@/lib/utils";

const totalBudget = projects.reduce((acc, p) => acc + p.budgetM, 0);
const totalMonths = projects.reduce((acc, p) => acc + p.months, 0);
const activeProjects = projects.filter((p) => p.status === "active" || p.status === "live").length;
const heldProjects = projects.filter((p) => p.status === "on-hold");
const avgImpact = Math.round(projects.reduce((acc, p) => acc + p.impact, 0) / projects.length);
const peakImpact = [...projects].sort((a, b) => b.impact - a.impact)[0];
const crossSite = projects.filter((p) => /stores|branches|Sumatra|sites/i.test(p.location)).length;
const featured = projects.filter((p) => p.featured);

const KIND_COUNT = [...new Set(projects.map((p) => p.kind))]
  .map((kind) => ({
    kind,
    count: projects.filter((p) => p.kind === kind).length,
    budget: projects.filter((p) => p.kind === kind).reduce((acc, p) => acc + p.budgetM, 0),
  }))
  .sort((a, b) => b.count - a.count);

const YEAR_COUNT = [...new Set(projects.map((p) => p.year))]
  .sort((a, b) => b - a)
  .map((year) => ({
    year,
    count: projects.filter((p) => p.year === year).length,
    budget: projects.filter((p) => p.year === year).reduce((acc, p) => acc + p.budgetM, 0),
  }));

const maxYearCount = Math.max(...YEAR_COUNT.map((y) => y.count));

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
            featured
          </Badge>
        )}
      </div>

      <DialogTitle className="mt-4">{project.name}</DialogTitle>
      <DialogDescription>{project.summary}</DialogDescription>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-notch border border-border bg-border sm:grid-cols-4">
        {[
          { label: "Role", value: project.role },
          { label: "Duration", value: `${project.months} months` },
          { label: "Team size", value: `${project.teamSize} people` },
          {
            label: "Budget",
            value: project.budgetM ? `Rp ${nf(project.budgetM)}m` : "internal",
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
          <span className="eyebrow">Impact score</span>
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
          This number comes from my own internal scoring rubric, not a third-party audit.
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
          {project.teamSize} people involved
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {project.stack.map((tech) => (
          <Badge key={tech} variant="outline" size="sm">
            {tech}
          </Badge>
        ))}
      </div>
    </>
  );
}

/** Featured project card: brief on the outside, detailed inside the dialog. */
function FeaturedCard({ project }: { project: Project }) {
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
            impact {project.impact}
          </span>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="mt-5 w-full">
              Open details
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
  return (
    <>
      <PageIntro
        index="03"
        eyebrow="Project File"
        title="Twelve traceable pieces of work, not just a list of tools"
        lead="Every project below has a budget, a duration, a team size, and an impact score. I kept the small numbers in too, because they show the pattern: valuable work usually runs long."
      >
        <StatStrip
          items={[
            {
              label: "Budget managed",
              value: <Counter value={Math.round(totalBudget / 1000)} prefix="Rp " suffix="B" />,
              hint: `${totalMonths} months of project work since 2018`,
            },
            {
              label: "Projects running",
              value: `${activeProjects} of ${projects.length}`,
              hint: `${heldProjects.length} on hold waiting on business priorities`,
            },
            {
              label: "Reaching many sites",
              value: `${crossSite}`,
              hint: "Projects across stores, warehouses, or cities",
            },
            {
              label: "Average impact",
              value: `${avgImpact}/100`,
              hint: `Highest: ${peakImpact.impact} (${peakImpact.name})`,
            },
          ]}
        />
      </PageIntro>

      {/* 01 - quick read */}
      <PageSection>
        <SectionHeading
          index="01"
          eyebrow="Quick read"
          title="How projects spread across kind, time, and budget size"
          description="The bubble map shows when the work happened and how much impact it had. Bubble size is the impact score, colour is the kind of work."
        />

        <div className="mt-10 space-y-6">
          <Reveal>
            <ChartFrame
              title="Project map 2018 to 2025"
              note="The horizontal axis is time, the vertical axis is the kind of work."
              legend={[...new Set(projects.map((p) => p.kind))].map((kind) => ({
                label: kind,
                color: KIND_COLOR[kind],
              }))}
            >
              <ProjectMap />
            </ChartFrame>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <ChartFrame
                title="Budget and impact per year"
                note="Bars are total budget in millions of rupiah, the dashed line is the average impact score for that same year."
                legend={[
                  { label: "Budget", color: CHART_COLORS.dim },
                  { label: "Average impact", color: CHART_COLORS.rust },
                ]}
              >
                <BudgetImpactChart />
              </ChartFrame>
            </Reveal>

            <Reveal className="lg:col-span-5" delay={0.1}>
              <ChartFrame
                title="Spread across years"
                note="A compact bar: number of projects per year along with their budgets."
              >
                <ul className="space-y-3.5">
                  {YEAR_COUNT.map((row) => (
                    <li key={row.year}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-mono text-[12px] tabular-nums text-foreground">
                          {row.year}
                        </span>
                        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                          {row.count} projects · Rp {nf(row.budget)}m
                        </span>
                      </div>
                      <Progress
                        value={(row.count / maxYearCount) * 100}
                        className="mt-2 h-1.5"
                        indicatorClassName="bg-foreground/70"
                        aria-label={`${row.count} projects in ${row.year}`}
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
          index="02"
          eyebrow="Featured"
          title="Four projects that explain how I work"
          description="Chosen not because they had the biggest budgets, but because they represent the thinking I repeat across many other pieces of work."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/skills">
                The skills behind them
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
          index="03"
          eyebrow="Composition"
          title="Where the budget and the attention actually went"
          description="The two charts below use the same data from different angles, so the claims about where I focus can be checked."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <ChartFrame
              title="Budget against impact, per project"
              note="Bubble size is the number of people involved. Projects with no direct budget (zero) are not drawn here, so no point is misleading."
            >
              <BudgetImpactScatter />
            </ChartFrame>
          </Reveal>

          <Reveal className="lg:col-span-5" delay={0.1}>
            <div className="panel-flagged p-5 sm:p-6">
              <h3 className="pl-2 font-display text-base font-semibold tracking-tight">
                Spread across kinds of work
              </h3>
              <p className="mt-1 pl-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                Number of projects and total budget per kind
              </p>
              <ul className="mt-5 space-y-4 pl-2">
                {KIND_COUNT.map((row) => (
                  <li key={row.kind} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="mt-[6px] size-2.5 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: KIND_COLOR[row.kind] }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate font-display text-[14px] font-medium tracking-tight">
                          {row.kind}
                        </span>
                        <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                          {row.count} projects
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[11px] tabular-nums text-muted-foreground">
                        Rp {nf(row.budget)}m
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
              honesty note
            </p>
            <p className="mt-3 max-w-3xl font-display text-lg font-semibold leading-snug tracking-tight sm:text-xl">
              One project on this page is on hold, and I show that as it is.
            </p>
            <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-muted-foreground">
              {heldProjects.map((p) => p.name).join(", ")} stopped not because it failed technically,
              but because business priorities shifted. A portfolio that only shows wins actually hides
              the ability a lead uses most often: deciding what not to build.
            </p>
          </div>
        </Reveal>
      </PageSection>

      {/* 04 - table */}
      <PageSection className="border-t border-border bg-card/25">
        <SectionHeading
          index="04"
          eyebrow="Full file"
          title="Every project in one filterable table"
          description="Search, sort by column, or filter by kind, status, and year. Everything runs in your browser."
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
                  continued
                </p>
                <p className="mt-3 max-w-2xl font-display text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
                  A budget only makes sense when the evidence follows. The next section shows the
                  certifications and skills that support the decisions above.
                </p>
                <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-moss-400" />
                    All project numbers come from sample data
                  </li>
                  <li className="flex items-center gap-2">
                    <PauseCircle className="size-3.5 text-primary" />
                    No project is hidden
                  </li>
                </ul>
              </div>
              <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
                <Button asChild>
                  <Link to="/credentials">
                    View credentials
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/contact">Ask a question</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </PageSection>
    </>
  );
}
