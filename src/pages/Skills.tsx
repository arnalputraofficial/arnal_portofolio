import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Clock,
  Gauge,
  GitFork,
  Layers,
  RefreshCw,
  ShieldCheck,
  Star,
  WifiOff,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageIntro, StatStrip } from "@/components/layout/PageIntro";
import { PageSection, SectionHeading } from "@/components/layout/SectionHeading";
import { ChartFrame, CHART_COLORS } from "@/components/charts/ChartFrame";
import {
  ExperienceSpreadChart,
  SkillBalanceRadar,
  StackUsageChart,
  TopSkillsBar,
} from "@/components/charts/SkillCharts";
import { Reveal, RevealGroup, RevealItem } from "@/components/fx/Reveal";
import { Counter } from "@/components/fx/Counter";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVerifiedSkills } from "@/hooks/useVerifiedSkills";
import { competencyMap, summarize, type VerifiedSkill } from "@/lib/tasteskill";
import { useEntries } from "@/entries/EntriesProvider";
import { useSiteText } from "@/content/ContentProvider";
import type { Skill } from "@/data/portfolio";
import { nf } from "@/lib/utils";

const ALL = "__all__";

/** Host name of the third-party registry, used inside the editable copy. */
const REGISTRY_SITE = "verified-skill.com";

/** Registry read time, formatted by hand so it does not depend on the newest Intl options. */
function stamp(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return `${date}, ${time}`;
}

function tierVariant(tier: string): BadgeProps["variant"] {
  const t = tier.toUpperCase();
  if (t.includes("VERIF")) return "moss";
  if (t.includes("TRUST")) return "accent";
  return "muted";
}

function SkillCard({ skill, labels }: { skill: Skill; labels: Map<string, string> }) {
  const t = useSiteText();
  return (
    <article className="panel flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-[15px] font-medium leading-snug tracking-tight">
          {skill.name}
        </h3>
        <span className="shrink-0 font-mono text-[12px] tabular-nums text-primary">
          {skill.level}
        </span>
      </div>

      <Progress
        value={skill.level}
        className="mt-3 h-1.5"
        indicatorClassName={skill.level >= 85 ? "bg-primary" : "bg-foreground/45"}
        aria-label={t("skills.card.rating.label", {
          name: skill.name,
          value: skill.level,
        })}
      />

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden />
          {t("skills.card.years", { count: skill.years })}
        </span>
        <span>{t("skills.card.lastUsed", { year: skill.lastUsed })}</span>
      </div>

      <div className="mt-auto pt-4">
        <span className="eyebrow">{t("skills.card.evidence")}</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skill.evidence.map((id) => (
            <Badge key={id} variant="outline" size="sm">
              {labels.get(id) ?? id}
            </Badge>
          ))}
        </div>
      </div>
    </article>
  );
}

function SkillGrid({ rows, labels }: { rows: Skill[]; labels: Map<string, string> }) {
  return (
    <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.04}>
      {rows.map((skill) => (
        <RevealItem key={skill.id} className="h-full">
          <SkillCard skill={skill} labels={labels} />
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

function RegistrySkillRow({ skill }: { skill: VerifiedSkill }) {
  const t = useSiteText();
  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-[15px] font-medium tracking-tight">{skill.slug}</span>
          <Badge variant={tierVariant(skill.certTier)} size="sm">
            {skill.certTier}
          </Badge>
          <Badge variant="outline" size="sm">
            {skill.trustTier}
          </Badge>
          {skill.tainted && (
            <Badge variant="danger" size="sm">
              {t("skills.entry.flagged")}
            </Badge>
          )}
        </div>
        <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
          {skill.author} · v{skill.version} · {skill.category}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-5 font-mono text-[11px] tabular-nums text-muted-foreground">
        <span className="flex items-center gap-1.5" title={t("skills.entry.score.title")}>
          <Gauge className="size-3.5" aria-hidden />
          {skill.certScore}
        </span>
        <span className="flex items-center gap-1.5" title={t("skills.entry.stars.title")}>
          <Star className="size-3.5" aria-hidden />
          {nf(skill.stars)}
        </span>
        <span className="flex items-center gap-1.5" title={t("skills.entry.forks.title")}>
          <GitFork className="size-3.5" aria-hidden />
          {nf(skill.forks)}
        </span>
      </div>
    </li>
  );
}

/**
 * Registry panel. Three states are handled differently, and the failed
 * state is never replaced with made-up numbers.
 */
function RegistryPanel() {
  const t = useSiteText();
  const { state, refresh, refreshing } = useVerifiedSkills();

  if (state.status === "idle" || state.status === "loading") {
    return (
      <div className="panel-flagged p-6 pl-8 sm:p-8">
        <p className="eyebrow flex items-center gap-2">
          <RefreshCw className="size-3.5 animate-spin text-primary" aria-hidden />
          {t("skills.registry.loading.title")}
        </p>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
          {t("skills.registry.loading.body", { site: REGISTRY_SITE })}
        </p>
      </div>
    );
  }

  if (state.status === "offline") {
    return (
      <div className="panel-flagged p-6 pl-8 sm:p-8">
        <p className="eyebrow flex items-center gap-2">
          <WifiOff className="size-3.5 text-primary" aria-hidden />
          {t("skills.registry.offline.title")}
        </p>
        <p className="mt-3 max-w-2xl font-display text-lg font-semibold leading-snug tracking-tight sm:text-xl">
          {t("skills.registry.offline.lead")}
        </p>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
          {t("skills.registry.offline.body", {
            reason: state.reason,
            stamp: stamp(state.fetchedAt),
          })}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={refresh}
          disabled={refreshing}
        >
          <RefreshCw className={refreshing ? "animate-spin" : undefined} aria-hidden />
          {refreshing
            ? t("skills.registry.offline.trying")
            : t("skills.registry.offline.tryAgain")}
        </Button>
      </div>
    );
  }

  const s = summarize(state.skills);

  return (
    <div className="space-y-6">
      <div className="panel-flagged p-6 pl-8 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden />
              {t("skills.registry.ok.title")}
            </p>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
              {t("skills.registry.source", {
                site: REGISTRY_SITE,
                stamp: stamp(state.fetchedAt),
                category: s.topCategory,
              })}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={refreshing}>
            <RefreshCw className={refreshing ? "animate-spin" : undefined} aria-hidden />
            {t("skills.registry.refresh")}
          </Button>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-notch border border-border bg-border lg:grid-cols-4">
          {[
            { label: t("skills.registry.stat.entries"), value: nf(s.total) },
            {
              label: t("skills.registry.stat.ratio"),
              value: `${Math.round(s.verifiedRatio * 100)}%`,
            },
            { label: t("skills.registry.stat.score"), value: nf(s.avgScore, 1) },
            { label: t("skills.registry.stat.trust"), value: nf(s.avgTrust, 1) },
          ].map((item) => (
            <div key={item.label} className="bg-card px-4 py-3.5">
              <dt className="eyebrow">{item.label}</dt>
              <dd className="mt-1.5 font-display text-xl font-semibold tabular-nums tracking-tight">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        {s.tainted > 0 && (
          <p className="mt-4 flex items-start gap-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
            <AlertTriangle className="mt-px size-3.5 shrink-0 text-primary" aria-hidden />
            {t("skills.registry.tainted", { count: s.tainted })}
          </p>
        )}
      </div>

      <div className="panel">
        <div className="flex items-baseline justify-between gap-4 border-b border-border px-6 py-4">
          <h3 className="font-display text-base font-semibold tracking-tight">
            {t("skills.entries.title")}
          </h3>
          <span className="font-mono text-[11px] text-muted-foreground">
            {t("skills.registry.entries.value", { count: nf(state.skills.length) })}
          </span>
        </div>
        <ul className="divide-y divide-border px-6">
          {state.skills.slice(0, 12).map((skill) => (
            <RegistrySkillRow key={skill.fullName || skill.slug} skill={skill} />
          ))}
        </ul>
        {state.skills.length > 12 && (
          <p className="border-t border-border px-6 py-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {t("skills.entries.footnote")}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Skills() {
  const t = useSiteText();
  const [tab, setTab] = useState<string>(ALL);
  const { career, certifications, projects, skills } = useEntries();

  const categories = [...new Set(skills.map((s) => s.category))] as Skill["category"][];
  const totalSkills = skills.length;
  const avgLevel =
    totalSkills > 0 ? Math.round(skills.reduce((acc, s) => acc + s.level, 0) / totalSkills) : 0;
  const totalEvidence = skills.reduce((acc, s) => acc + s.evidence.length, 0);
  const latestYear = skills.length > 0 ? Math.max(...skills.map((s) => s.lastUsed)) : 0;
  const deepest = [...skills].sort((a, b) => b.years - a.years)[0] ?? null;

  /** Skills I have not touched in a while. Shown, not hidden. */
  const staleSkills = skills.filter((s) => s.lastUsed < latestYear);
  /** Oldest year among the stale skills, for the honesty note below. */
  const staleFrom =
    staleSkills.length > 0 ? Math.min(...staleSkills.map((s) => s.lastUsed)) : latestYear;
  /** High claims with thin evidence: one link or fewer. */
  const thinClaims = skills.filter((s) => s.level >= 80 && s.evidence.length <= 1);

  /** Evidence can point to a project, a certification, or a role. */
  const evidenceLabel = new Map<string, string>([
    ...projects.map((p) => [p.id, p.name] as [string, string]),
    ...certifications.map((c) => [c.id, c.name] as [string, string]),
    ...career.map((r) => [r.id, r.title] as [string, string]),
  ]);

  const categoryStats = categories
    .map((category) => {
      const rows = skills.filter((s) => s.category === category);
      return {
        category,
        count: rows.length,
        avg: Math.round(rows.reduce((acc, s) => acc + s.level, 0) / rows.length),
        maxYears: Math.max(...rows.map((s) => s.years)),
        evidence: rows.reduce((acc, s) => acc + s.evidence.length, 0),
      };
    })
    .sort((a, b) => b.avg - a.avg);

  const visible = tab === ALL ? skills : skills.filter((s) => s.category === tab);

  return (
    <>
      <PageIntro
        index={t("skills.intro.index")}
        eyebrow={t("skills.eyebrow")}
        title={t("skills.title")}
        lead={t("skills.lead")}
      >
        <StatStrip
          items={[
            {
              label: t("skills.stat.tracked"),
              value: <Counter value={totalSkills} />,
              hint: t("skills.stat.tracked.hint", { count: categories.length }),
            },
            {
              label: t("skills.stat.rating"),
              value: `${avgLevel}/100`,
              hint: t("skills.stat.hint.rating"),
            },
            {
              label: t("skills.stat.longest"),
              value: <Counter value={deepest?.years ?? 0} suffix=" yrs" />,
              hint: deepest
                ? t("skills.stat.longest.hint", {
                    name: deepest.name,
                    year: deepest.lastUsed,
                  })
                : undefined,
            },
            {
              label: t("skills.stat.evidence"),
              value: <Counter value={totalEvidence} suffix=" links" />,
              hint: t("skills.stat.hint.evidence"),
            },
          ]}
        />
      </PageIntro>

      {/* 01 - spread */}
      <PageSection>
        <SectionHeading
          index={t("skills.section.spread.index")}
          eyebrow={t("skills.spread.eyebrow")}
          title={t("skills.spread.title")}
          description={t("skills.selfrating.note")}
        />

        <div className="mt-10 space-y-6">
          <Reveal>
            <ChartFrame
              title={t("skills.chart.radar.title")}
              note={t("skills.chart.radar.note")}
              legend={[
                { label: t("skills.chart.radar.series.rating"), color: CHART_COLORS.rust },
                { label: t("skills.chart.radar.series.evidence"), color: CHART_COLORS.moss },
              ]}
            >
              <SkillBalanceRadar data={skills} />
            </ChartFrame>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <ChartFrame
                title={t("skills.chart.top.title")}
                note={t("skills.chart.top.note")}
                legend={[
                  { label: t("skills.chart.top.legend.high"), color: CHART_COLORS.rustDeep },
                  { label: t("skills.chart.top.legend.mid"), color: CHART_COLORS.rust },
                  { label: t("skills.chart.top.legend.low"), color: CHART_COLORS.moss },
                ]}
              >
                <TopSkillsBar data={skills} limit={10} />
              </ChartFrame>
            </Reveal>

            <Reveal className="lg:col-span-5" delay={0.1}>
              <ChartFrame
                title={t("skills.chart.spread.title")}
                note={t("skills.chart.spread.note")}
              >
                <ExperienceSpreadChart />
              </ChartFrame>
            </Reveal>
          </div>

          <Reveal>
            <ChartFrame
              title={t("skills.chart.stack.title")}
              note={t("skills.chart.stack.note")}
            >
              <StackUsageChart />
            </ChartFrame>
          </Reveal>
        </div>
      </PageSection>

      {/* 02 - self rating */}
      <PageSection className="border-y border-border bg-card/25">
        <SectionHeading
          index={t("skills.section.selfrating.index")}
          eyebrow={t("skills.selfrating.eyebrow")}
          title={t("skills.selfrating.title", { count: String(totalSkills) })}
          description={t("skills.selfrating.description")}
        />

        <Reveal className="mt-10">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value={ALL}>
                {t("skills.toggle.all", { count: String(totalSkills) })}
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category} ({skills.filter((s) => s.category === category).length})
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={tab}>
              <SkillGrid rows={visible} labels={evidenceLabel} />
            </TabsContent>
          </Tabs>
        </Reveal>

        <Reveal className="mt-8">
          <div className="panel-flagged p-6 pl-8 sm:p-8">
            <p className="eyebrow flex items-center gap-2">
              <AlertTriangle className="size-3.5 text-primary" aria-hidden />
              {t("skills.honesty.eyebrow")}
            </p>
            <p className="mt-3 max-w-3xl font-display text-lg font-semibold leading-snug tracking-tight sm:text-xl">
              {t("skills.honesty.title")}
            </p>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <span className="eyebrow">{t("skills.honesty.stale.title")}</span>
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                  {t("skills.honesty.stale.body", {
                    count: staleSkills.length,
                    year: staleFrom,
                  })}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {staleSkills.map((skill) => (
                    <Badge key={skill.id} variant="muted" size="sm">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <span className="eyebrow">{t("skills.honesty.thin.title")}</span>
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                  {t("skills.honesty.thin.body", { count: thinClaims.length })}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {thinClaims.map((skill) => (
                    <Badge key={skill.id} variant="danger" size="sm">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator dashed className="my-6" />

            <p className="max-w-3xl font-mono text-[11px] leading-relaxed text-muted-foreground">
              {t("skills.honesty.footnote")}
            </p>
          </div>
        </Reveal>
      </PageSection>

      {/* 03 - registry */}
      <PageSection>
        <SectionHeading
          index={t("skills.section.registry.index")}
          eyebrow={t("skills.registry.eyebrow")}
          title={t("skills.registry.title")}
          description={t("skills.registry.description")}
        />

        <Reveal className="mt-10">
          <div className="panel mb-6 flex items-start gap-3 p-5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
              {t("skills.clarify.body")}
            </p>
          </div>
        </Reveal>

        <Reveal>
          <RegistryPanel />
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-8">
            <div className="panel-flagged p-6 pl-8 sm:p-8">
              <p className="eyebrow flex items-center gap-2">
                <BadgeCheck className="size-3.5 text-primary" aria-hidden />
                {t("skills.map.eyebrow")}
              </p>
              <p className="mt-3 max-w-2xl font-display text-lg font-semibold leading-snug tracking-tight sm:text-xl">
                {t("skills.map.title")}
              </p>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
                {t("skills.map.body")}
              </p>

              <ul className="mt-6 space-y-5">
                {competencyMap.map((item) => (
                  <li key={item.area} className="border-l border-border pl-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-display text-[15px] font-semibold tracking-tight">
                        {item.area}
                      </h4>
                      <Badge
                        variant={item.relevance === "direct" ? "moss" : "muted"}
                        size="sm"
                      >
                        {item.relevance}
                      </Badge>
                    </div>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                      {item.note}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {item.supportedBy.map((slug) => (
                        <Badge key={slug} variant="outline" size="sm">
                          {slug}
                        </Badge>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-4" delay={0.1}>
            <div className="panel h-full p-5 sm:p-6">
              <h3 className="font-display text-base font-semibold tracking-tight">
                {t("skills.summary.title")}
              </h3>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {t("skills.summary.note")}
              </p>
              <ul className="mt-5 space-y-4">
                {categoryStats.map((row) => (
                  <li key={row.category}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-display text-[14px] font-medium tracking-tight">
                        {row.category}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                        {row.avg}/100
                      </span>
                    </div>
                    <Progress
                      value={row.avg}
                      className="mt-2 h-1.5"
                      indicatorClassName="bg-foreground/70"
                      aria-label={t("skills.summary.row.aria", {
                        category: row.category,
                        value: row.avg,
                      })}
                    />
                    <p className="mt-1.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                      {t("skills.summary.row", {
                        count: row.count,
                        evidence: row.evidence,
                        years: row.maxYears,
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </PageSection>

      {/* CTA */}
      <PageSection className="border-t border-border">
        <Reveal>
          <div className="panel-flagged relative overflow-hidden p-8 sm:p-10">
            <div aria-hidden className="pointer-events-none absolute inset-0 grid-lines opacity-35" />
            <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-8">
                <p className="eyebrow flex items-center gap-2">
                  <Layers className="size-3.5 text-primary" aria-hidden />
                  {t("skills.cta.eyebrow")}
                </p>
                <p className="mt-3 max-w-2xl font-display text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
                  {t("skills.cta.body")}
                </p>
                <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="size-3.5 text-moss-400" aria-hidden />
                    {t("skills.cta.point.apart")}
                  </li>
                  <li className="flex items-center gap-2">
                    <WifiOff className="size-3.5 text-primary" aria-hidden />
                    {t("skills.cta.point.offline")}
                  </li>
                </ul>
              </div>
              <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
                <Button asChild>
                  <Link to="/about">
                    {t("skills.cta.button.about")}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/contact">{t("skills.cta.button")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </PageSection>
    </>
  );
}
