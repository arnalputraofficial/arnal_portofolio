import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CircleDot,
  Database,
  Layers,
  ListChecks,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { PageIntro, StatStrip } from "@/components/layout/PageIntro";
import { PageSection, SectionHeading } from "@/components/layout/SectionHeading";
import { Reveal, RevealGroup, RevealItem } from "@/components/fx/Reveal";
import { SpotlightCard } from "@/components/fx/SpotlightCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSiteText } from "@/content/ContentProvider";
import { navItems } from "@/components/layout/SiteHeader";

/** Icons for the three problem cards, kept out of content so editing stays text only. */
const PROBLEM_ICON = [Database, Wrench, Layers] as const;

/** Icons for the decision cards. */
const ROLE_ICON = [Boxes, Layers, ShieldCheck, ListChecks] as const;

export default function Steadbyte() {
  const t = useSiteText();

  const problems = [
    {
      icon: PROBLEM_ICON[0],
      title: t("steadbyte.problem.item1.title"),
      body: t("steadbyte.problem.item1.body"),
    },
    {
      icon: PROBLEM_ICON[1],
      title: t("steadbyte.problem.item2.title"),
      body: t("steadbyte.problem.item2.body"),
    },
    {
      icon: PROBLEM_ICON[2],
      title: t("steadbyte.problem.item3.title"),
      body: t("steadbyte.problem.item3.body"),
    },
  ];

  const decisions = [
    {
      icon: ROLE_ICON[0],
      title: t("steadbyte.role.item1.title"),
      body: t("steadbyte.role.item1.body"),
    },
    {
      icon: ROLE_ICON[1],
      title: t("steadbyte.role.item2.title"),
      body: t("steadbyte.role.item2.body"),
    },
    {
      icon: ROLE_ICON[2],
      title: t("steadbyte.role.item3.title"),
      body: t("steadbyte.role.item3.body"),
    },
    {
      icon: ROLE_ICON[3],
      title: t("steadbyte.role.item4.title"),
      body: t("steadbyte.role.item4.body"),
    },
  ];

  const summaryFacts = [
    {
      title: t("steadbyte.summary.fact1.title"),
      body: t("steadbyte.summary.fact1.body"),
    },
    {
      title: t("steadbyte.summary.fact2.title"),
      body: t("steadbyte.summary.fact2.body"),
    },
    {
      title: t("steadbyte.summary.fact3.title"),
      body: t("steadbyte.summary.fact3.body"),
    },
  ];

  const summaryDetails = [
    t("steadbyte.summary.detail.1"),
    t("steadbyte.summary.detail.2"),
    t("steadbyte.summary.detail.3"),
    t("steadbyte.summary.detail.4"),
  ];

  const stack = [
    t("steadbyte.role.stack.1"),
    t("steadbyte.role.stack.2"),
    t("steadbyte.role.stack.3"),
    t("steadbyte.role.stack.4"),
    t("steadbyte.role.stack.5"),
    t("steadbyte.role.stack.6"),
  ];

  const honestNotes = [
    t("steadbyte.honest.item1"),
    t("steadbyte.honest.item2"),
    t("steadbyte.honest.item3"),
    t("steadbyte.honest.item4"),
    t("steadbyte.honest.item5"),
  ];

  /**
   * Route count is read from the navigation list itself, not typed by hand,
   * so this number stays true when a route is added or removed.
   */
  const routeCount = `${navItems.length}`;

  return (
    <>
      <PageIntro
        index={t("steadbyte.intro.index")}
        eyebrow={t("steadbyte.eyebrow")}
        title={t("steadbyte.title")}
        lead={t("steadbyte.lead")}
      >
        <StatStrip
          items={[
            {
              label: t("steadbyte.stat.stack"),
              value: t("steadbyte.stat.stack.value"),
              hint: t("steadbyte.stat.stack.hint"),
            },
            {
              label: t("steadbyte.stat.pages"),
              value: routeCount,
              hint: t("steadbyte.stat.pages.hint"),
            },
            {
              label: t("steadbyte.stat.editing"),
              value: t("steadbyte.stat.editing.value"),
              hint: t("steadbyte.stat.editing.hint"),
            },
            {
              label: t("steadbyte.stat.owner"),
              value: t("steadbyte.stat.owner.value"),
              hint: t("steadbyte.stat.owner.hint"),
            },
          ]}
        />
      </PageIntro>

      {/* 01 - what it is and where it stands */}
      <PageSection>
        <SectionHeading
          index={t("steadbyte.section.summary.index")}
          eyebrow={t("steadbyte.summary.eyebrow")}
          title={t("steadbyte.summary.title")}
          description={t("steadbyte.summary.description")}
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <RevealGroup className="grid gap-5 sm:grid-cols-3 lg:col-span-8">
            {summaryFacts.map((fact) => (
              <RevealItem key={fact.title} className="h-full">
                <SpotlightCard className="h-full p-6">
                  <p className="eyebrow">{fact.title}</p>
                  <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                    {fact.body}
                  </p>
                </SpotlightCard>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal className="lg:col-span-4" delay={0.1}>
            <div className="panel h-full p-6 sm:p-8">
              <p className="eyebrow flex items-center gap-2">
                <CircleDot className="size-3.5 text-primary" aria-hidden />
                {t("steadbyte.summary.status.label")}
              </p>
              <p className="mt-3 font-display text-xl font-semibold tracking-tight">
                {t("steadbyte.summary.status.value")}
              </p>

              <Separator className="my-6" />

              <p className="eyebrow flex items-center gap-2">
                <ListChecks className="size-3.5 text-primary" aria-hidden />
                {t("steadbyte.summary.detail.label")}
              </p>
              <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-muted-foreground">
                {summaryDetails.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden className="mt-2 size-1 shrink-0 rotate-45 bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </PageSection>

      {/* 02 - the problems it solves */}
      <PageSection className="border-t border-border bg-card/25">
        <SectionHeading
          index={t("steadbyte.section.problem.index")}
          eyebrow={t("steadbyte.problem.eyebrow")}
          title={t("steadbyte.problem.title")}
          description={t("steadbyte.problem.description")}
        />

        <RevealGroup className="mt-10 grid gap-px overflow-hidden rounded-notch border border-border bg-border lg:grid-cols-3">
          {problems.map((item) => (
            <RevealItem key={item.title} className="h-full">
              <SpotlightCard className="h-full rounded-none border-0 p-6 sm:p-8">
                <item.icon className="size-5 text-primary" aria-hidden />
                <h3 className="mt-5 font-display text-lg font-semibold leading-snug tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </SpotlightCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </PageSection>

      {/* 03 - my role and the decisions behind it */}
      <PageSection>
        <SectionHeading
          index={t("steadbyte.section.role.index")}
          eyebrow={t("steadbyte.role.eyebrow")}
          title={t("steadbyte.role.title")}
          description={t("steadbyte.role.description")}
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <RevealGroup className="grid gap-px overflow-hidden rounded-notch border border-border bg-border sm:grid-cols-2 lg:col-span-7">
            {decisions.map((item) => (
              <RevealItem key={item.title} className="h-full">
                <SpotlightCard className="h-full rounded-none border-0 p-6">
                  <item.icon className="size-5 text-primary" aria-hidden />
                  <h3 className="mt-4 font-display text-base font-semibold leading-snug tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </SpotlightCard>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal className="lg:col-span-5" delay={0.1}>
            <div className="panel-flagged h-full p-6 pl-8 sm:p-8 sm:pl-10">
              <p className="eyebrow flex items-center gap-2">
                <Wrench className="size-3.5 text-primary" aria-hidden />
                {t("steadbyte.role.stack.label")}
              </p>
              <ul className="mt-5 space-y-3.5 text-[14px] leading-relaxed text-muted-foreground">
                {stack.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden className="mt-2 size-1 shrink-0 rotate-45 bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-1.5">
                <Badge variant="accent">{t("steadbyte.role.stack.badge1")}</Badge>
                <Badge variant="muted">{t("steadbyte.role.stack.badge2")}</Badge>
              </div>
            </div>
          </Reveal>
        </div>
      </PageSection>

      {/* 04 - the honest footnote */}
      <PageSection className="border-t border-border bg-card/25">
        <SectionHeading
          index={t("steadbyte.section.honest.index")}
          eyebrow={t("steadbyte.honest.eyebrow")}
          title={t("steadbyte.honest.title")}
          description={t("steadbyte.honest.description")}
        />

        <Reveal className="mt-10">
          <div className="panel-flagged p-6 pl-8 sm:p-8 sm:pl-10">
            <p className="eyebrow flex items-center gap-2 text-primary">
              <AlertTriangle className="size-3.5" aria-hidden />
              {t("steadbyte.honest.eyebrow")}
            </p>
            <ul className="mt-5 grid gap-4 text-[14px] leading-relaxed text-muted-foreground sm:grid-cols-2">
              {honestNotes.map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden className="mt-2 size-1 shrink-0 rotate-45 bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </PageSection>

      {/* closing */}
      <PageSection className="border-t border-border">
        <Reveal>
          <div className="panel-flagged relative overflow-hidden p-8 sm:p-10">
            <div aria-hidden className="pointer-events-none absolute inset-0 grid-lines opacity-35" />
            <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-8">
                <p className="font-display text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
                  {t("steadbyte.closing.title")}
                </p>
                <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                  {t("steadbyte.closing.body")}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
                <Button asChild>
                  <Link to="/contact">
                    {t("nav.contact")}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/">{t("nav.home")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </PageSection>
    </>
  );
}
