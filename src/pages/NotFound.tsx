import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Compass, FileQuestion, LifeBuoy, Search } from "lucide-react";
import { PageSection } from "@/components/layout/SectionHeading";
import { Reveal, RevealGroup, RevealItem } from "@/components/fx/Reveal";
import { SplitHeading } from "@/components/fx/Reveal";
import { SpotlightCard } from "@/components/fx/SpotlightCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEntries } from "@/entries/EntriesProvider";
import { useSiteText } from "@/content/ContentProvider";

/** Seven routes that genuinely exist, not an invented list. */
const ROUTES = [
  { to: "/", index: "00", label: "Home", hint: "Summary and headline numbers" },
  { to: "/career", index: "02", label: "Career", hint: "Ten years of role history" },
  { to: "/projects", index: "03", label: "Projects", hint: "Twelve pieces of traceable work" },
  { to: "/credentials", index: "05", label: "Credentials", hint: "Including the expired ones" },
  { to: "/skills", index: "04", label: "Skills", hint: "Self ratings and registry data" },
  { to: "/about", index: "06", label: "About", hint: "Working principles and my mistakes" },
  { to: "/contact", index: "07", label: "Contact", hint: "Email, GitHub, and LinkedIn" },
];

export default function NotFound() {
  const t = useSiteText();
  const { pathname } = useLocation();
  const { projects } = useEntries();

  const suggestions = [...projects].sort((a, b) => b.impact - a.impact).slice(0, 3);

  return (
    <>
      <header className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-28 top-1/2 hidden size-[380px] -translate-y-1/2 rounded-full bg-primary/10 blur-3xl lg:block"
        />

        <div className="container relative py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-8">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-4">
                <span className="font-mono text-[12px] font-bold text-primary">404</span>
                <span className="hairline flex-1" />
                <span className="eyebrow">{t("notfound.eyebrow")}</span>
              </div>

              <p
                aria-hidden
                className="mt-8 font-display text-[92px] font-bold leading-[0.82] tracking-tighter text-outline sm:text-[132px]"
              >
                404
              </p>

              <h1 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-[1.06] tracking-tight text-balance sm:text-4xl lg:text-5xl">
                <SplitHeading text={t("notfound.title")} />
              </h1>

              <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-muted-foreground text-pretty">
                {t("notfound.lead")}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <code className="rounded-notch border border-border bg-muted/50 px-3 py-2 font-mono text-[12px] text-muted-foreground">
                  {pathname}
                </code>
                <Button asChild size="sm">
                  <Link to="/">
                    <ArrowLeft className="size-4" aria-hidden />
                    {t("notfound.cta")}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="panel-flagged p-6 pl-8 sm:p-8">
                <p className="eyebrow flex items-center gap-2">
                  <LifeBuoy className="size-3.5 text-primary" aria-hidden />
                  if the address was mistyped
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                  Every address on this site is a plain English word:{" "}
                  <span className="font-mono text-foreground">/career</span>,{" "}
                  <span className="font-mono text-foreground">/projects</span>,{" "}
                  <span className="font-mono text-foreground">/credentials</span>. There is no
                  translated version behind them, so adding another word will not help.
                </p>

                <Separator dashed className="my-6" />

                <p className="eyebrow flex items-center gap-2">
                  <Search className="size-3.5 text-primary" aria-hidden />
                  shortcuts
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {suggestions.map((project) => (
                    <Link
                      key={project.id}
                      to="/projects"
                      className="rounded-notch border border-border px-3 py-2 font-mono text-[11px] text-muted-foreground transition-colors duration-200 hover:border-primary/45 hover:text-primary"
                    >
                      {project.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <PageSection>
        <div className="flex items-center gap-4">
          <Compass className="size-4 text-primary" aria-hidden />
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            {t("notfound.available.title")}
          </h2>
          <span aria-hidden className="hairline flex-1" />
        </div>

        <RevealGroup className="mt-8 grid gap-px overflow-hidden rounded-notch border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {ROUTES.map((route) => (
            <RevealItem key={route.to} className="h-full">
              <SpotlightCard className="h-full rounded-none border-0 p-0">
                <Link
                  to={route.to}
                  className="group flex h-full flex-col gap-3 p-6 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-primary">
                      {route.index}
                    </span>
                    <ArrowRight
                      className="size-4 text-muted-foreground transition-transform duration-300 ease-out-expo group-hover:translate-x-1 group-hover:text-primary"
                      aria-hidden
                    />
                  </div>
                  <span className="font-display text-lg font-semibold tracking-tight">
                    {route.label}
                  </span>
                  <span className="mt-auto text-[13px] leading-relaxed text-muted-foreground">
                    {route.hint}
                  </span>
                </Link>
              </SpotlightCard>
            </RevealItem>
          ))}

          <RevealItem className="h-full">
            <div className="flex h-full flex-col gap-3 bg-card p-6">
              <FileQuestion className="size-4 text-muted-foreground" aria-hidden />
              <span className="font-display text-lg font-semibold tracking-tight text-muted-foreground">
                {t("notfound.beyond.title")}
              </span>
              <span className="mt-auto text-[13px] leading-relaxed text-muted-foreground">
                {t("notfound.beyond.body")}
              </span>
            </div>
          </RevealItem>
        </RevealGroup>

        <Reveal className="mt-10">
          <div className="panel flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground text-pretty">
              {t("notfound.report.body")}
            </p>
            <Button asChild variant="outline">
              <Link to="/contact">
                Report a broken link
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </Reveal>
      </PageSection>
    </>
  );
}
