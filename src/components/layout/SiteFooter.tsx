import { Link } from "react-router-dom";
import { ArrowUpRight, Mail, MapPin, Clock } from "lucide-react";
import { profile } from "@/data/portfolio";
import { navItems } from "@/components/layout/SiteHeader";
import { Marquee } from "@/components/fx/Marquee";
import { Separator } from "@/components/ui/separator";
import { useSiteText } from "@/content/ContentProvider";

export function SiteFooter() {
  const t = useSiteText();
  const year = new Date().getFullYear();

  const rollingItems = t("footer.rollingStrip")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <footer className="relative z-10 mt-24 border-t border-border bg-ink-950 text-ink-100 dark:bg-ink-950">
      {rollingItems.length > 0 ? (
        <Marquee items={rollingItems} className="border-b border-ink-800 text-ink-300" />
      ) : null}

      <div className="container grid gap-12 py-14 md:grid-cols-12">
        {/* Wide column: closing statement */}
        <div className="md:col-span-5">
          <p className="font-display text-2xl font-semibold leading-snug tracking-tight text-ink-50 text-balance sm:text-3xl">
            {t("footer.closing.line1")}
            <span className="block text-ink-400">{t("footer.closing.line2")}</span>
          </p>

          <div className="mt-7 space-y-2.5">
            <a
              href={profile.socials[2].href}
              className="group inline-flex items-center gap-2 font-mono text-sm text-ink-200 transition-colors hover:text-rust-400"
            >
              <Mail className="size-4 text-rust-500" />
              {profile.email}
              <ArrowUpRight className="size-3.5 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
            </a>
            <p className="flex items-center gap-2 font-mono text-xs text-ink-400">
              <MapPin className="size-3.5" />
              {t("global.profile.location")}
            </p>
            <p className="flex items-center gap-2 font-mono text-xs text-ink-400">
              <Clock className="size-3.5" />
              {t("global.profile.timezone")}
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="md:col-span-3" aria-label={t("footer.aria.map")}>
          <p className="eyebrow text-ink-500">{t("footer.siteMap")}</p>
          <ul className="mt-5 space-y-2.5">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="group inline-flex items-baseline gap-2 text-sm text-ink-300 transition-colors hover:text-rust-400"
                >
                  <span className="font-mono text-[10px] text-ink-600">{item.index}</span>
                  <span className="border-b border-transparent transition-colors group-hover:border-rust-500">
                    {t(item.key)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Other channels */}
        <div className="md:col-span-4">
          <p className="eyebrow text-ink-500">Network</p>
          <ul className="mt-5 space-y-2.5">
            {profile.socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer noopener"
                  className="group inline-flex items-center gap-2 text-sm text-ink-300 transition-colors hover:text-rust-400"
                >
                  {s.label}
                  <ArrowUpRight className="size-3.5 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-8 rounded-notch border border-ink-800 bg-ink-900/60 p-3.5 font-mono text-[11px] leading-relaxed text-ink-400">
            {t("global.profile.availability")}
          </p>
        </div>
      </div>

      <Separator className="bg-ink-800" />

      <div className="container flex flex-col gap-3 py-6 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {year} {t("global.profile.fullName")}. {t("footer.copyright")}
        </p>
        <p className="text-ink-600">{t("footer.dataNote")}</p>
      </div>
    </footer>
  );
}
