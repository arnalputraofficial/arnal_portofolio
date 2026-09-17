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
import { useSiteText } from "@/content/ContentProvider";
import { useEntries } from "@/entries/EntriesProvider";
import { principles, profile } from "@/data/portfolio";
import { humanDuration, monthsBetween, nf } from "@/lib/utils";
import { publicImageUrl } from "@/entries/types";

function HealthCard() {
  const t = useSiteText();
  return (
    <div className="panel-flagged p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 pl-2">
        <div>
          <h3 className="font-display text-base font-semibold tracking-tight">
            {t("home.health.title")}
          </h3>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {t("home.health.meta", { sites: profile.sitesManaged })}
          </p>
        </div>
        <Badge variant="moss" dot>
          {t("home.health.badge")}
        </Badge>
      </div>

      <dl className="mt-6 space-y-4 pl-2">
        {[
          { label: t("home.health.row.availability"), value: 99.98, suffix: "%", decimals: 2 },
          { label: t("home.health.row.incidents"), value: 3, suffix: t("home.health.row.incidents.unit") ? ` ${t("home.health.row.incidents.unit")}` : "", decimals: 0 },
          { label: t("home.health.row.budget"), value: 98, suffix: "%", decimals: 0 },
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
            <Progress value={row.value} indicatorClassName="bg-accent" />
          </div>
        ))}
      </dl>

      <p className="mt-6 pl-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
        {t("home.health.note")}
      </p>
    </div>
  );
}

export default function Home() {
  const t = useSiteText();
  const { career, certifications, projects, skills } = useEntries();

  /** Strip copy: the editable list wins, otherwise it follows the job history. */
  const stripLines = t("home.stack.marquee")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const rollingStack =
    stripLines.length > 0
      ? stripLines
      : [...new Set(career.flatMap((role) => role.stack))].slice(0, 22);

  /** Current role: still running, used as the "now" anchor. */
  const currentRole = career.find((role) => role.end === null) ?? career[career.length - 1];
  const activeCertifications = certifications.filter((c) => c.status === "active").length;
  const leadSkills = skills.filter((s) => s.category === "Leadership").length;
  const featuredProjects = projects.filter((p) => p.featured);

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
                {t("home.hero.badge")}
              </Badge>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {t("home.hero.meta", { location: profile.location, timezone: profile.timezone })}
              </span>
            </div>

            <h1 className="mt-7 font-display text-[38px] font-semibold leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-[68px]">
              <SplitHeading text={t("home.hero.title.line1")} />
              <span className="block text-primary">
                <SplitHeading text={t("home.hero.title.line2")} delay={0.12} />
              </span>
              <span className="block">
                <SplitHeading text={t("home.hero.title.line3")} delay={0.24} />
              </span>
            </h1>

            <Reveal delay={0.4}>
              <div className="mt-7 flex flex-col gap-5 xl:flex-row xl:items-start xl:gap-6">
                {t("global.profile.avatar") ? (
                  <div className="relative size-72 shrink-0 overflow-hidden rounded-notch border-2 border-primary/50 bg-card p-1 shadow-lift sm:size-[352px] xl:size-[416px]">
                    <img
                      src={
                        t("global.profile.avatar").startsWith("http")
                          ? t("global.profile.avatar")
                          : publicImageUrl(t("global.profile.avatar")) ?? undefined
                      }
                      alt={t("global.profile.fullName", { name: profile.fullName })}
                      className="size-full rounded-sm object-cover grayscale contrast-125 sepia-[0.2]"
                      onError={(e) => {
                        (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : null}
                <p className="max-w-xl text-[16px] leading-relaxed text-muted-foreground text-pretty">
                  {t("home.hero.lead", { name: t("global.profile.fullName", { name: profile.fullName }) })}
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.5}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link to="/career">
                    {t("home.hero.cta.primary")}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href={profile.socials[2].href}>
                    {t("home.hero.cta.secondary")}
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
                  {t("home.hero.scene.caption")}
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.35} className="mt-8">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    icon: Users,
                    label: t("home.hero.stat.team"),
                    value: t("home.hero.stat.team.value", { count: currentRole?.headcount ?? 0 }),
                  },
                  {
                    icon: Building2,
                    label: t("home.hero.stat.sites"),
                    value: `${profile.sitesManaged}`,
                  },
                  {
                    icon: Clock3,
                    label: t("home.hero.stat.experience"),
                    value: t("home.hero.stat.experience.value", { count: profile.yearsExperience }),
                  },
                  {
                    icon: Layers,
                    label: t("home.hero.stat.projects"),
                    value: `${projects.length}`,
                  },
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

      {rollingStack.length > 0 ? <Marquee items={rollingStack} /> : null}

      {/* ------------------------------------------------------------ summary */}
      <PageSection className="pt-14 sm:pt-16">
        <Reveal>
          <StatStrip
            items={[
              {
                label: t("home.summary.currentRole"),
                value: currentRole?.title ?? t("home.summary.currentRole.none"),
                hint: currentRole
                  ? t("home.summary.currentRole.hint", {
                      company: currentRole.company,
                      tenure: humanDuration(monthsBetween(currentRole.start, null)),
                    })
                  : undefined,
              },
              {
                label: t("home.summary.certifications"),
                value: `${activeCertifications}/${certifications.length}`,
                hint: t("home.summary.certifications.hint"),
              },
              {
                label: t("home.summary.leadership"),
                value: `${leadSkills} areas`,
                hint: t("home.summary.leadership.hint"),
              },
              {
                label: t("home.summary.budget"),
                value: `Rp ${nf(projects.reduce((a, p) => a + p.budgetM, 0))}m`,
                hint: t("home.summary.budget.hint"),
              },
            ]}
          />
        </Reveal>
      </PageSection>

      {/* --------------------------------------------------------------- trail */}
      <PageSection className="pt-0">
        <SectionHeading
          index="01"
          eyebrow={t("home.trail.eyebrow")}
          title={t("home.trail.title")}
          description={t("home.trail.description")}
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/career">
                {t("home.trail.action")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <ChartFrame
              title={t("home.trail.chart.title")}
              note={t("home.trail.chart.note")}
              legend={[
                { label: t("home.trail.chart.legend.ic"), color: CHART_COLORS.moss },
                { label: t("home.trail.chart.legend.lead"), color: CHART_COLORS.rust },
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
          index={t("home.projects.index")}
          eyebrow={t("home.projects.eyebrow")}
          title={t("home.projects.title")}
          description={t("home.projects.description")}
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/projects">
                {t("home.projects.action")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
        />

        <Reveal className="mt-10">
          <ChartFrame
            title={t("home.projects.chart.title")}
            note={t("home.projects.chart.note")}
            legend={[
              { label: t("home.projects.chart.legend.low"), color: CHART_COLORS.moss },
              { label: t("home.projects.chart.legend.high"), color: CHART_COLORS.rust },
            ]}
          >
            <ProjectMap projects={projects} />
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
                      {
                        label: t("home.projects.card.budget"),
                        value: t("home.projects.card.budget.value", { amount: nf(project.budgetM) }),
                      },
                      { label: t("home.projects.card.team"), value: `${project.teamSize}` },
                      { label: t("home.projects.card.impact"), value: `${project.impact}` },
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
          index={t("home.records.index")}
          eyebrow={t("home.records.eyebrow")}
          title={t("home.records.title")}
          description={t("home.records.description")}
        />
        <div className="mt-10">
          <ProjectTable />
        </div>
      </PageSection>

      {/* ---------------------------------------------------------- principles */}
      <PageSection className="pt-0">
        <SectionHeading
          index={t("home.section.principles.index")}
          eyebrow={t("home.principles.eyebrow")}
          title={t("home.principles.title")}
        />

        <RevealGroup className="mt-10 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
          {principles.map((principle, i) => (
            <RevealItem key={principle.title} className="bg-card">
              <div className="group h-full p-7 transition-colors duration-300 hover:bg-muted/40">
                <span className="font-mono text-[11px] text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold leading-snug tracking-tight">
                  {t(`home.principles.${i + 1}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t(`home.principles.${i + 1}.body`)}
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
                  {t("home.call.eyebrow")}
                </p>
                <p className="mt-4 max-w-2xl font-display text-2xl font-semibold leading-snug tracking-tight text-balance sm:text-3xl lg:text-4xl">
                  {t("home.call.statement")}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <MapPin className="size-3.5" />
                    {t("global.profile.location")}
                  </span>
                  <span className="flex items-center gap-2">
                    <Activity className="size-3.5" />
                    {t("global.profile.availability")}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
                <Button asChild size="lg">
                  <Link to="/contact">
                    {t("home.call.cta.primary")}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/about">{t("home.call.cta.secondary")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </PageSection>
    </>
  );
}
