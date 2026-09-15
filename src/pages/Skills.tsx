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
import { career, certifications, projects, skills, type Skill } from "@/data/portfolio";
import { nf } from "@/lib/utils";

const ALL = "__all__";

const CATEGORIES = [...new Set(skills.map((s) => s.category))] as Skill["category"][];
const totalSkills = skills.length;
const avgLevel = Math.round(skills.reduce((acc, s) => acc + s.level, 0) / skills.length);
const totalEvidence = skills.reduce((acc, s) => acc + s.evidence.length, 0);
const latestYear = Math.max(...skills.map((s) => s.lastUsed));
const deepest = [...skills].sort((a, b) => b.years - a.years)[0];

/** Skills I have not touched in a while. Shown, not hidden. */
const staleSkills = skills.filter((s) => s.lastUsed < latestYear);
/** High claims with thin evidence: one link or fewer. */
const thinClaims = skills.filter((s) => s.level >= 80 && s.evidence.length <= 1);

/** Evidence can point to a project, a certification, or a role. */
const EVIDENCE_LABEL = new Map<string, string>([
  ...projects.map((p) => [p.id, p.name] as [string, string]),
  ...certifications.map((c) => [c.id, c.name] as [string, string]),
  ...career.map((r) => [r.id, r.title] as [string, string]),
]);

const CATEGORY_STATS = CATEGORIES.map((category) => {
  const rows = skills.filter((s) => s.category === category);
  return {
    category,
    count: rows.length,
    avg: Math.round(rows.reduce((acc, s) => acc + s.level, 0) / rows.length),
    maxYears: Math.max(...rows.map((s) => s.years)),
    evidence: rows.reduce((acc, s) => acc + s.evidence.length, 0),
  };
}).sort((a, b) => b.avg - a.avg);

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

function SkillCard({ skill }: { skill: Skill }) {
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
        aria-label={`Self rating for ${skill.name}: ${skill.level} out of 100`}
      />

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden />
          {skill.years} yrs
        </span>
        <span>last used {skill.lastUsed}</span>
      </div>

      <div className="mt-auto pt-4">
        <span className="eyebrow">evidence</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skill.evidence.map((id) => (
            <Badge key={id} variant="outline" size="sm">
              {EVIDENCE_LABEL.get(id) ?? id}
            </Badge>
          ))}
        </div>
      </div>
    </article>
  );
}

function SkillGrid({ rows }: { rows: Skill[] }) {
  return (
    <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.04}>
      {rows.map((skill) => (
        <RevealItem key={skill.id} className="h-full">
          <SkillCard skill={skill} />
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

function RegistrySkillRow({ skill }: { skill: VerifiedSkill }) {
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
              flagged
            </Badge>
          )}
        </div>
        <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
          {skill.author} · v{skill.version} · {skill.category}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-5 font-mono text-[11px] tabular-nums text-muted-foreground">
        <span className="flex items-center gap-1.5" title="Certification score">
          <Gauge className="size-3.5" aria-hidden />
          {skill.certScore}
        </span>
        <span className="flex items-center gap-1.5" title="Repository stars">
          <Star className="size-3.5" aria-hidden />
          {nf(skill.stars)}
        </span>
        <span className="flex items-center gap-1.5" title="Repository forks">
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
  const { state, refresh, refreshing } = useVerifiedSkills();

  if (state.status === "idle" || state.status === "loading") {
    return (
      <div className="panel-flagged p-6 pl-8 sm:p-8">
        <p className="eyebrow flex items-center gap-2">
          <RefreshCw className="size-3.5 animate-spin text-primary" aria-hidden />
          contacting registry
        </p>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
          Fetching the verified skill list from verified-skill.com. This page shows no
          numbers at all until the answer actually arrives.
        </p>
      </div>
    );
  }

  if (state.status === "offline") {
    return (
      <div className="panel-flagged p-6 pl-8 sm:p-8">
        <p className="eyebrow flex items-center gap-2">
          <WifiOff className="size-3.5 text-primary" aria-hidden />
          registry unreachable
        </p>
        <p className="mt-3 max-w-2xl font-display text-lg font-semibold leading-snug tracking-tight sm:text-xl">
          Third-party data failed to load, so I left this section empty.
        </p>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
          Cause: {state.reason}. Last attempt {stamp(state.fetchedAt)}. I would rather show
          an empty panel than fill in verification numbers I never received.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={refresh}
          disabled={refreshing}
        >
          <RefreshCw className={refreshing ? "animate-spin" : undefined} aria-hidden />
          {refreshing ? "Contacting" : "Try again"}
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
              registry reachable
            </p>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
              The numbers below are read straight from the verified-skill.com API response on{" "}
              {stamp(state.fetchedAt)}, with no edits from me. Largest category right now:{" "}
              {s.topCategory}.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={refreshing}>
            <RefreshCw className={refreshing ? "animate-spin" : undefined} aria-hidden />
            Refresh
          </Button>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-notch border border-border bg-border lg:grid-cols-4">
          {[
            { label: "Entries read", value: nf(s.total) },
            { label: "Certified ratio", value: `${Math.round(s.verifiedRatio * 100)}%` },
            { label: "Average score", value: nf(s.avgScore, 1) },
            { label: "Average trust", value: nf(s.avgTrust, 1) },
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
            {s.tainted} entries were flagged as problematic by the automated scanner. I do not filter
            them out, so you can see them as they are.
          </p>
        )}
      </div>

      <div className="panel">
        <div className="flex items-baseline justify-between gap-4 border-b border-border px-6 py-4">
          <h3 className="font-display text-base font-semibold tracking-tight">
            List of entries read
          </h3>
          <span className="font-mono text-[11px] text-muted-foreground">
            {nf(state.skills.length)} entries
          </span>
        </div>
        <ul className="divide-y divide-border px-6">
          {state.skills.slice(0, 12).map((skill) => (
            <RegistrySkillRow key={skill.fullName || skill.slug} skill={skill} />
          ))}
        </ul>
        {state.skills.length > 12 && (
          <p className="border-t border-border px-6 py-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
            Showing the first 12 entries, sorted by certification score. The rest follow the same
            pattern.
          </p>
        )}
      </div>
    </div>
  );
}

export default function Skills() {
  const [tab, setTab] = useState<string>(ALL);
  const visible = tab === ALL ? skills : skills.filter((s) => s.category === tab);

  return (
    <>
      <PageIntro
        index="04"
        eyebrow="Skills File"
        title={`${totalSkills} skills, ${staleSkills.length} of which I flag as rarely used`}
        lead="Not every row on this page stands as tall as the others, and that is deliberate. The rating numbers here come from me. Data that comes from a third-party registry is kept separate at the bottom so the two never blend."
      >
        <StatStrip
          items={[
            {
              label: "Skills tracked",
              value: <Counter value={totalSkills} />,
              hint: `${CATEGORIES.length} categories, from leadership to operations`,
            },
            {
              label: "Average rating",
              value: `${avgLevel}/100`,
              hint: "Self-rated, not the result of third-party testing",
            },
            {
              label: "Longest track record",
              value: <Counter value={deepest.years} suffix=" yrs" />,
              hint: `${deepest.name}, last used ${deepest.lastUsed}`,
            },
            {
              label: "Evidence links",
              value: <Counter value={totalEvidence} suffix=" links" />,
              hint: "Pointing to projects, certificates, or roles",
            },
          ]}
        />
      </PageIntro>

      {/* 01 - spread */}
      <PageSection>
        <SectionHeading
          index="01"
          eyebrow="Spread"
          title="Where my claims are strong, and where the evidence is still thin"
          description="The first chart compares the self rating against the amount of evidence in each category. If those two lines sit far apart, it means I rate myself higher than the amount of work I can actually show."
        />

        <div className="mt-10 space-y-6">
          <Reveal>
            <ChartFrame
              title="Balance of claim and evidence per category"
              note="The rust line is the self rating, the dashed moss line is evidence strength normalized to the same scale."
              legend={[
                { label: "Self rating", color: CHART_COLORS.rust },
                { label: "Evidence strength", color: CHART_COLORS.moss },
              ]}
            >
              <SkillBalanceRadar data={skills} />
            </ChartFrame>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <ChartFrame
                title="Ten highest ratings"
                note="Bar colour marks the band: deep rust above 85, rust above 75, moss for the rest."
                legend={[
                  { label: "85 and above", color: CHART_COLORS.rustDeep },
                  { label: "75 to 84", color: CHART_COLORS.rust },
                  { label: "below 75", color: CHART_COLORS.moss },
                ]}
              >
                <TopSkillsBar data={skills} limit={10} />
              </ChartFrame>
            </Reveal>

            <Reveal className="lg:col-span-5" delay={0.1}>
              <ChartFrame
                title="Track record per category"
                note="The highest figure in each category, not the average. One person who has spent nine years in a single area still shows up."
              >
                <ExperienceSpreadChart />
              </ChartFrame>
            </Reveal>
          </div>

          <Reveal>
            <ChartFrame
              title="Tools actually used in projects"
              note="Only tools that appear in at least two projects. One-off tools are left out, so this chart does not turn into a wish list."
            >
              <StackUsageChart />
            </ChartFrame>
          </Reveal>
        </div>
      </PageSection>

      {/* 02 - self rating */}
      <PageSection className="border-y border-border bg-card/25">
        <SectionHeading
          index="02"
          eyebrow="Self rating"
          title="Thirty skills, filtered by the kind of work"
          description="Each card shows the level, years of experience, last year used, and evidence links. Pick a category to narrow the view."
        />

        <Reveal className="mt-10">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value={ALL}>All ({totalSkills})</TabsTrigger>
              {CATEGORIES.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category} ({skills.filter((s) => s.category === category).length})
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={tab}>
              <SkillGrid rows={visible} />
            </TabsContent>
          </Tabs>
        </Reveal>

        <Reveal className="mt-8">
          <div className="panel-flagged p-6 pl-8 sm:p-8">
            <p className="eyebrow flex items-center gap-2">
              <AlertTriangle className="size-3.5 text-primary" aria-hidden />
              honesty note
            </p>
            <p className="mt-3 max-w-3xl font-display text-lg font-semibold leading-snug tracking-tight sm:text-xl">
              Two things on this page stop me from claiming I have mastered all of it.
            </p>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <span className="eyebrow">rarely used</span>
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                  {staleSkills.length} skills were last used in {latestYear - 1}. I still consider
                  all of them alive, but calling them "currently active" would be a stretch.
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
                <span className="eyebrow">thin evidence</span>
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                  {thinClaims.length} skills I rate 80 or above, yet they only have one evidence
                  link. High claim, short trail, and I show that as it is.
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
              I deliberately did not inflate the ratings for skills with thin evidence. A portfolio
              where every bar is full gives you no information at all.
            </p>
          </div>
        </Reveal>
      </PageSection>

      {/* 03 - registry */}
      <PageSection>
        <SectionHeading
          index="03"
          eyebrow="Third-party registry"
          title="Verified skills, shown as they are"
          description="This section pulls data from a public skill registry, not from my own rating. If the registry cannot be reached, the panel will say so plainly."
        />

        <Reveal className="mt-10">
          <div className="panel mb-6 flex items-start gap-3 p-5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
              One clarification so nobody misreads this: tasteskill.dev is not a skill data API
              provider. The one with a real public API is the verified-skill.com registry, and that
              is what I call. If you go looking for a person profile on tasteskill.dev, you will not
              find one.
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
                translation
              </p>
              <p className="mt-3 max-w-2xl font-display text-lg font-semibold leading-snug tracking-tight sm:text-xl">
                Four areas of work I connect to the registry results
              </p>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
                I wrote this mapping myself. The registry does not know what I do day to day, so the
                links below are my own translation, not an automatic claim from any system.
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
                Summary per category
              </h3>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted-foreground">
                Sorted by highest average rating
              </p>
              <ul className="mt-5 space-y-4">
                {CATEGORY_STATS.map((row) => (
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
                      aria-label={`Average ${row.category}: ${row.avg} out of 100`}
                    />
                    <p className="mt-1.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                      {row.count} skills · {row.evidence} evidence links · longest {row.maxYears} yrs
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
                  continued
                </p>
                <p className="mt-3 max-w-2xl font-display text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
                  A skill without context is just a list of words. How I make decisions lives on
                  the about page.
                </p>
                <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="size-3.5 text-moss-400" aria-hidden />
                    Self ratings and registry numbers kept apart
                  </li>
                  <li className="flex items-center gap-2">
                    <WifiOff className="size-3.5 text-primary" aria-hidden />
                    Registry failure means an empty panel
                  </li>
                </ul>
              </div>
              <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
                <Button asChild>
                  <Link to="/about">
                    Read the working principles
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/contact">Get in touch</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </PageSection>
    </>
  );
}
