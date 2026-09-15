import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  MapPin,
  Radio,
  Users,
  Clock3,
  Layers,
  Activity,
} from "lucide-react";
import { PageSection, SectionHeading } from "@/components/layout/SectionHeading";
import { StatStrip } from "@/components/layout/PageIntro";
import { HeroScene } from "@/components/three/HeroScene";
import { Counter } from "@/components/fx/Counter";
import { Reveal, RevealGroup, RevealItem, SplitHeading } from "@/components/fx/Reveal";
import { SpotlightCard } from "@/components/fx/SpotlightCard";
import { Marquee } from "@/components/fx/Marquee";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CareerTenureChart } from "@/components/charts/CareerCharts";
import { ProjectMap } from "@/components/charts/ProjectCharts";
import { ChartFrame, CHART_COLORS } from "@/components/charts/ChartFrame";
import { ProjectTable } from "@/components/tables/ProjectTable";
import { career, certifications, principles, profile, projects, skills } from "@/data/portfolio";
import { humanDuration, monthsBetween, nf } from "@/lib/utils";

const rollingStack = [...new Set(career.flatMap((role) => role.stack))].slice(0, 22);

/** Current role: still running, used as the "now" anchor. */
const currentRole = career.find((role) => role.end === null) ?? career[career.length - 1];

const activeCertifications = certifications.filter((c) => c.status === "active").length;
const leadSkills = skills.filter((s) => s.category === "Leadership").length;
const featuredProjects = projects.filter((p) => p.featured);

function HealthCard() {
  return (
    <div className="panel-flagged p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 pl-2">
        <div>
          <h3 className="font-display text-base font-semibold tracking-tight">Operational status</h3>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {profile.sitesManaged} stores &amp; warehouses, 1 head office
          </p>
        </div>
        <Badge variant="moss" dot>
          running
        </Badge>
      </div>

      <dl className="mt-6 space-y-4 pl-2">
        {[
          { label: "POS availability", value: 99.98, suffix: "%", decimals: 2 },
          { label: "Open incidents", value: 3, suffix: " tickets", decimals: 0 },
          { label: "Budget absorbed", value: 98, suffix: "%", decimals: 0 },
        ].map((row) => (
          <div key={row.label} className="space-y-2">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {row.label}
              </dt>
              <dd className="font-display text-sm font-semibold tabular-nums">
                <Counter value={row.value} decimals={row.decimals} suffix={row.suffix} />
              </dd>
            </div>
            <Progress value={row.decimals === 0 ? row.value : row.value} indicatorClassName="bg-accent" />
          </div>
        ))}
      </dl>

      <p className="mt-6 pl-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
        The figures above are my own internal rubric, not a third-party audit.
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-8 size-[380px] rounded-full bg-accent/10 blur-3xl"
        />

        <div className="container relative grid gap-12 py-16 lg:grid-cols-12 lg:gap-8 lg:py-24">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="accent" dot>
                open to lead roles
              </Badge>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {profile.location} · {profile.timezone}
              </span>
            </div>

            <h1 className="mt-7 font-display text-[38px] font-semibold leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-[68px]">
              <SplitHeading text="An IT Lead who picks" />
              <span className="block text-primary">
                <SplitHeading text="the boring systems" delay={0.12} />
              </span>
              <span className="block">
                <SplitHeading text="because reliability rarely makes headlines." delay={0.24} />
              </span>
            </h1>

            <Reveal delay={0.4}>
              <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-muted-foreground text-pretty">
                {profile.fullName}. Ten years running infrastructure, security, and IT teams across
                distribution, financial services, and multi-site retail. I work with real budgets,
                real deadlines, and people who still need to get their work done.
              </p>
            </Reveal>

            <Reveal delay={0.5}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link to="/career">
                    See the career trail
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href={profile.socials[2].href}>
                    Start a conversation
                    <ArrowUpRight className="size-4" />
                  </a>
                </Button>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-5">
            <Reveal delay={0.2}>
              <div className="relative">
                <HeroScene className="h-[340px] rounded-blob border border-border bg-card/60 sm:h-[420px]" />
                <p className="mt-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
                  The cluster topology I look after: nodes, paths, and the fragile points. Drag to
                  rotate.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.35} className="mt-8">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    icon: Users,
                    label: "Team led",
                    value: `${currentRole.headcount} people`,
                  },
                  { icon: Building2, label: "Operating sites", value: `${profile.sitesManaged}` },
                  { icon: Clock3, label: "Experience", value: `${profile.yearsExperience} years` },
                  { icon: Layers, label: "Logged projects", value: `${projects.length}` },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="group border border-border bg-card/70 p-4 transition-colors duration-300 hover:border-primary/40"
                  >
                    <item.icon className="size-4 text-primary" />
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-0.5 font-display text-lg font-semibold tabular-nums">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Marquee items={rollingStack} />

      {/* ------------------------------------------------------------ summary */}
      <PageSection className="pt-14 sm:pt-16">
        <Reveal>
          <StatStrip
            items={[
              {
                label: "Current role",
                value: currentRole.title,
                hint: `${currentRole.company} · ${humanDuration(monthsBetween(currentRole.start, null))}`,
              },
              {
                label: "Active certifications",
                value: `${activeCertifications}/${certifications.length}`,
                hint: "The rest are renewing or already expired",
              },
              {
                label: "Leadership skills",
                value: `${leadSkills} areas`,
                hint: "Self-assessed, flagged honestly on the Skills page",
              },
              {
                label: "Budget managed",
                value: `Rp ${nf(projects.reduce((a, p) => a + p.budgetM, 0))}m`,
                hint: "Accumulated project budget I have owned",
              },
            ]}
          />
        </Reveal>
      </PageSection>

      {/* --------------------------------------------------------------- trail */}
      <PageSection className="pt-0">
        <SectionHeading
          index="01"
          eyebrow="Trail"
          title="From daily tickets to the decision table"
          description="Every stage added a new kind of responsibility. The chart alongside separates time as an individual contributor from time leading a team, so the direction is visible at a glance."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/career">
                Career detail
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <ChartFrame
              title="Role composition per year"
              note="Number of active positions each year, split between individual contributors and team leads."
              legend={[
                { label: "Individual contributor", color: CHART_COLORS.moss },
                { label: "Leading a team", color: CHART_COLORS.rust },
              ]}
            >
              <CareerTenureChart />
            </ChartFrame>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-5">
            <HealthCard />
          </Reveal>
        </div>
      </PageSection>

      {/* ------------------------------------------------------------ projects */}
      <PageSection className="pt-0">
        <SectionHeading
          index="02"
          eyebrow="Projects"
          title="Small budgets, hard constraints, measurable results"
          description="This map places every project by year and kind of work. Bubble size follows the impact score from my internal rubric, not a marketing claim."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/projects">
                All projects
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
        />

        <Reveal className="mt-10">
          <ChartFrame
            title="Project map 2017 to now"
            note="Horizontal axis = start time. Vertical axis = kind of work. Bubble size = impact score."
            legend={[
              { label: "Low impact", color: CHART_COLORS.moss },
              { label: "High impact", color: CHART_COLORS.rust },
            ]}
          >
            <ProjectMap />
          </ChartFrame>
        </Reveal>

        <RevealGroup className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredProjects.map((project) => (
            <RevealItem key={project.id}>
              <SpotlightCard className="h-full rounded-lg">
                <div className="flex h-full flex-col p-6">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="default" size="sm">
                      {project.kind}
                    </Badge>
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {project.year}
                    </span>
                  </div>

                  <h3 className="mt-5 font-display text-lg font-semibold leading-snug tracking-tight">
                    {project.name}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {project.summary}
                  </p>

                  <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-4">
                    {[
                      { label: "Budget", value: `Rp ${nf(project.budgetM)}m` },
                      { label: "Team", value: `${project.teamSize}` },
                      { label: "Impact", value: `${project.impact}` },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                          {stat.label}
                        </dt>
                        <dd className="font-display text-base font-semibold tabular-nums">
                          {stat.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </SpotlightCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </PageSection>

      {/* -------------------------------------------------------- full table */}
      <PageSection className="pt-0">
        <SectionHeading
          index="03"
          eyebrow="Records"
          title="Every project, filterable on your own terms"
          description="Not a display card: search by technology, filter by kind or year, then sort by budget or by impact."
        />
        <div className="mt-10">
          <ProjectTable />
        </div>
      </PageSection>

      {/* ---------------------------------------------------------- principles */}
      <PageSection className="pt-0">
        <SectionHeading
          index="04"
          eyebrow="Principles"
          title="How I make technical decisions"
        />

        <RevealGroup className="mt-10 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
          {principles.map((principle, i) => (
            <RevealItem key={principle.title} className="bg-card">
              <div className="group h-full p-7 transition-colors duration-300 hover:bg-muted/40">
                <span className="font-mono text-[11px] text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold leading-snug tracking-tight">
                  {principle.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {principle.body}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </PageSection>

      {/* --------------------------------------------------------------- call */}
      <PageSection className="pt-0">
        <Reveal>
          <div className="panel relative overflow-hidden p-8 sm:p-12">
            <div aria-hidden className="pointer-events-none absolute inset-0 grid-lines opacity-30" />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-primary/12 blur-3xl"
            />
            <div className="relative grid gap-8 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <p className="eyebrow flex items-center gap-2">
                  <Radio className="size-3.5 text-primary" />
                  availability
                </p>
                <p className="mt-4 max-w-2xl font-display text-2xl font-semibold leading-snug tracking-tight text-balance sm:text-3xl lg:text-4xl">
                  I am not selling a list of technologies. I am offering the habit of keeping systems
                  alive while letting a team grow.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <MapPin className="size-3.5" />
                    {profile.location}
                  </span>
                  <span className="flex items-center gap-2">
                    <Activity className="size-3.5" />
                    {profile.availability}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
                <Button asChild size="lg">
                  <Link to="/contact">
                    Start a discussion
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/about">Read the working approach</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </PageSection>
    </>
  );
}
