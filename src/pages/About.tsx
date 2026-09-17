import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Clock,
  Compass,
  Mail,
  MapPin,
  Scale,
  Target,
  Users,
} from "lucide-react";
import { PageIntro, StatStrip } from "@/components/layout/PageIntro";
import { PageSection, SectionHeading } from "@/components/layout/SectionHeading";
import { Reveal, RevealGroup, RevealItem } from "@/components/fx/Reveal";
import { SpotlightCard } from "@/components/fx/SpotlightCard";
import { Counter } from "@/components/fx/Counter";
import { Marquee } from "@/components/fx/Marquee";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { principles, profile } from "@/data/portfolio";
import { useEntries } from "@/entries/EntriesProvider";
import { useSiteText } from "@/content/ContentProvider";
import { humanDuration, monthsBetween } from "@/lib/utils";

/** Four working habits you can use to judge me, not just slogans. */
const WORKING_STYLE = [
  {
    icon: Target,
    title: "Start from the constraint, not the tool",
    body: "Every purchase proposal I write opens with the problem happening right now and its numbers. A shiny tool without a clear problem usually ends up as a subscription nobody uses.",
  },
  {
    icon: Users,
    title: "Team first, technology second",
    body: "I refuse to raise delivery targets before the team has had time to practise. Failed adoption is almost always about people, not about licences.",
  },
  {
    icon: Scale,
    title: "Decisions I can stand behind",
    body: "When I choose wrong, I write it into the post-incident document without wrapping it in soft language. That is the only way a team actually learns from a mistake.",
  },
  {
    icon: BookOpen,
    title: "Knowledge has to change hands",
    body: "I measure success by how many things the team can do without me. If everything has to route through me, that is a sign of leadership that is not finished yet.",
  },
];

/** Real mistakes and what they cost. Written so it does not read like a brochure. */
const MISSTEPS = [
  {
    title: "Network vendor consolidation, 2021",
    cost: "3 months of double contract renewal",
    body: "I signed the new contract too early, before the old vendor's transition window closed. Two systems ran side by side for a quarter and the cost ballooned by roughly Rp 180 million. Since then I treat the handover sequence as a mandatory checklist.",
  },
  {
    title: "Kubernetes too early for three services, 2022",
    cost: "6 weeks of work that should not have been needed",
    body: "I forced cluster orchestration onto a workload that one server could honestly handle. Running costs went up, and only two people on the team understood how to maintain it. I later cut it back to a simple deployment.",
  },
  {
    title: "Customer portal without network failure testing, 2018",
    cost: "two incidents in a single month",
    body: "I tested the feature on a stable office connection. In the field, stores have connections that come and go. Only after the second incident did offline mode become a hard requirement before release.",
  },
];

const buildFaq = (t: ReturnType<typeof useSiteText>) => [
  {
    q: "Is this all real data or sample data?",
    a: "The people's names, company names, and numbers on this page are sample data I put together to show how I think. The page structure, technical decisions, and interactive features are real. I did not want to dress up invented numbers so they look like an official audit.",
  },
  {
    q: "Why are so many numbers shown raw?",
    a: "Because a rounded-up number always reads as more convincing than the truth. I would rather show the count of expired certificates and rarely used skills than hide them behind adjectives.",
  },
  {
    q: "How do you judge whether something worked?",
    a: "By three things: whether the problem is genuinely gone, whether running cost went down or at least stayed flat, and whether someone else on the team can repeat it without me. If any one of those is missing, I consider it unfinished.",
  },
  {
    q: "What kind of role are you ready for?",
    a: t("about.faq.role.answer", { availability: t("global.profile.availability") }),
  },
];

export default function About() {
  const t = useSiteText();
  const { career, certifications, projects, skills } = useEntries();

  const totalMonths = career.reduce((acc, role) => acc + monthsBetween(role.start, role.end), 0);
  const currentRole = career.find((role) => role.end === null) ?? career[career.length - 1] ?? null;
  const tools = [...new Set(projects.flatMap((p) => p.stack))];

  /** A skill is stale when it has not been used in the past year. */
  const staleFrom = Math.max(0, ...skills.map((s) => s.lastUsed));
  const staleCount = skills.filter((s) => s.lastUsed < staleFrom).length;
  const activeCerts = certifications.filter((c) => c.status === "active").length;
  const expiredCerts = certifications.filter((c) => c.status === "expired");

  return (
    <>
      <PageIntro
        index={t("about.intro.index")}
        eyebrow={t("about.eyebrow")}
        title={t("about.title")}
        lead={t("about.lead")}
      >
        <StatStrip
          items={[
            {
              label: t("about.stat.tenure"),
              value: (
                <Counter
                  value={Math.round(totalMonths / 12)}
                  suffix={t("about.stat.tenure.suffix")}
                />
              ),
              hint: t("about.stat.tenure.hint", { duration: humanDuration(totalMonths) }),
            },
            {
              label: t("about.stat.people"),
              value: <Counter value={profile.teamLed} suffix={t("about.stat.people.suffix")} />,
              hint: currentRole?.title ?? t("about.stat.people.hint.empty"),
            },
            {
              label: t("about.stat.sites"),
              value: <Counter value={profile.sitesManaged} />,
              hint: t("about.stat.sites.hint"),
            },
            {
              label: t("about.stat.tools"),
              value: <Counter value={tools.length} />,
              hint: t("about.stat.tools.hint"),
            },
          ]}
        />
      </PageIntro>

      <Marquee
        items={tools}
        speed={52}
        className="border-t-0 bg-card/30"
      />

      {/* 01 - working style */}
      <PageSection>
        <SectionHeading
          index={t("about.section.working.index")}
          eyebrow={t("about.working.eyebrow")}
          title={t("about.working.title")}
          description={t("about.working.description")}
        />

        <RevealGroup className="mt-10 grid gap-px overflow-hidden rounded-notch border border-border bg-border sm:grid-cols-2">
          {WORKING_STYLE.map((item) => (
            <RevealItem key={item.title} className="h-full">
              <SpotlightCard className="h-full rounded-none border-0 p-6 sm:p-8">
                <item.icon className="size-5 text-primary" aria-hidden />
                <h3 className="mt-5 font-display text-lg font-semibold leading-snug tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground text-pretty">
                  {item.body}
                </p>
              </SpotlightCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </PageSection>

      {/* 02 - principles */}
      <PageSection className="border-y border-border bg-card/25">
        <SectionHeading
          index={t("about.section.principles.index")}
          eyebrow={t("about.principles.eyebrow")}
          title={t("about.principles.title")}
          description={t("about.principles.description")}
        />

        <RevealGroup className="mt-10 space-y-px overflow-hidden rounded-notch border border-border bg-border">
          {principles.map((principle, i) => (
            <RevealItem key={principle.title}>
              <div className="grid gap-4 bg-card p-6 sm:grid-cols-12 sm:gap-8 sm:p-8">
                <div className="sm:col-span-1">
                  <span className="font-mono text-[13px] font-bold tabular-nums text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="sm:col-span-11">
                  <h3 className="font-display text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
                    {principle.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground text-pretty">
                    {principle.body}
                  </p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </PageSection>

      {/* 03 - missteps */}
      <PageSection>
        <SectionHeading
          index={t("about.section.missteps.index")}
          eyebrow={t("about.missteps.eyebrow")}
          title={t("about.mistakes.title")}
          description={t("about.mistakes.description")}
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-8">
            <Accordion type="single" collapsible className="panel px-6 sm:px-8">
              {MISSTEPS.map((item, i) => (
                <AccordionItem key={item.title} value={`m${i}`}>
                  <AccordionTrigger>{item.title}</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="danger" size="sm">
                        cost of the mistake
                      </Badge>
                      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                        {item.cost}
                      </span>
                    </div>
                    <p className="mt-3 max-w-2xl text-pretty">{item.body}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>

          <Reveal className="lg:col-span-4" delay={0.1}>
            <div className="panel-flagged h-full p-6 pl-8">
              <p className="eyebrow flex items-center gap-2">
                <AlertTriangle className="size-3.5 text-primary" aria-hidden />
                still unfinished
              </p>
              <h3 className="mt-3 font-display text-lg font-semibold leading-snug tracking-tight">
                Things I am still working on today
              </h3>
              <ul className="mt-5 space-y-3 text-[14px] leading-relaxed text-muted-foreground">
                <li className="flex gap-3">
                  <span aria-hidden className="mt-2 size-1 shrink-0 rotate-45 bg-primary" />
                  Writing run documentation consistently across two languages. One language always
                  falls behind.
                </li>
                <li className="flex gap-3">
                  <span aria-hidden className="mt-2 size-1 shrink-0 rotate-45 bg-primary" />
                  Delegating small budget decisions. I still want to decide too many of them myself.
                </li>
                <li className="flex gap-3">
                  <span aria-hidden className="mt-2 size-1 shrink-0 rotate-45 bg-primary" />
                  Keeping {staleCount} skills alive that were last used before {staleFrom}.{" "}
                  {activeCerts} active certificates, {expiredCerts.length} already expired.
                </li>
              </ul>

              <Separator dashed className="my-6" />

              <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
                I am not looking for a job that demands nothing. I am looking for a place where the
                problems are interesting enough to take seriously.
              </p>
            </div>
          </Reveal>
        </div>
      </PageSection>

      {/* 04 - questions */}
      <PageSection className="border-t border-border">
        <SectionHeading
          index={t("about.section.faq.index")}
          eyebrow={t("about.faq.eyebrow")}
          title={t("about.faq.title")}
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-8">
            <Accordion type="single" collapsible className="panel px-6 sm:px-8">
              {buildFaq(t).map((item, i) => (
                <AccordionItem key={item.q} value={`f${i}`}>
                  <AccordionTrigger>{item.q}</AccordionTrigger>
                  <AccordionContent>
                    <p className="max-w-2xl text-pretty">{item.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>

          <Reveal className="lg:col-span-4" delay={0.1}>
            <div className="panel h-full p-6 sm:p-8">
              <p className="eyebrow flex items-center gap-2">
                <Compass className="size-3.5 text-primary" aria-hidden />
                {t("about.profile.eyebrow")}
              </p>
              <dl className="mt-5 space-y-4">
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                    {t("about.profile.field.name")}
                  </dt>
                  <dd className="mt-1 font-display text-[15px] font-medium tracking-tight">
                    {t("global.profile.fullName")}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                    {t("about.profile.field.role")}
                  </dt>
                  <dd className="mt-1 flex items-center gap-2 text-[15px]">
                    <Target className="size-4 text-primary" aria-hidden />
                    {t("global.profile.role")}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                    {t("about.profile.field.location")}
                  </dt>
                  <dd className="mt-1 flex items-center gap-2 text-[15px]">
                    <MapPin className="size-4 text-primary" aria-hidden />
                    {t("global.profile.location")}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                    {t("about.profile.field.timezone")}
                  </dt>
                  <dd className="mt-1 flex items-center gap-2 text-[15px]">
                    <Clock className="size-4 text-primary" aria-hidden />
                    {t("global.profile.timezone")}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                    {t("about.profile.field.email")}
                  </dt>
                  <dd className="mt-1 flex items-center gap-2 text-[15px]">
                    <Mail className="size-4 text-primary" aria-hidden />
                    <a
                      href={`mailto:${profile.email}`}
                      className="underline decoration-primary/40 decoration-2 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
                    >
                      {t("global.profile.email")}
                    </a>
                  </dd>
                </div>
              </dl>

              <Separator className="my-6" />

              <p className="text-[14px] leading-relaxed text-muted-foreground">
                {t("global.profile.availability")}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="sm">
                  <Link to="/contact">
                    {t("about.profile.button")}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/projects">{t("about.projects.button")}</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </PageSection>
    </>
  );
}
