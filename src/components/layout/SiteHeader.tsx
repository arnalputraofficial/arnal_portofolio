import * as React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { cn, mailtoHref } from "@/lib/utils";
import { ThemeToggle } from "@/components/fx/ThemeToggle";
import { useSiteText } from "@/content/ContentProvider";
import { profile } from "@/data/portfolio";

export const navItems = [
  { to: "/", label: "Home", key: "nav.home" },
  { to: "/career", label: "Career", key: "nav.career" },
  { to: "/projects", label: "Projects", key: "nav.projects" },
  { to: "/skills", label: "Skills", key: "nav.skills" },
  { to: "/credentials", label: "Credentials", key: "nav.credentials" },
  { to: "/about", label: "About", key: "nav.about" },
  { to: "/contact", label: "Contact", key: "nav.contact" },
  { to: "/about-steadbyte", label: "About Steadbyte", key: "nav.steadbyte" },
];

export function SiteHeader() {
  const t = useSiteText();
  const [open, setOpen] = React.useState(false);
  const location = useLocation();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // lock scroll while the mobile menu is open
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  React.useEffect(() => setOpen(false), [location.pathname]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-400 ease-out-expo",
          scrolled
            ? "border-b border-border bg-background/88 backdrop-blur-md"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="container flex h-16 items-center justify-between gap-6">
          {/* Mark: monogram + role, not a logo with centered navigation */}
          <Link
            to="/"
            className="group flex items-center gap-3"
            aria-label="Go to home"
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-blob border border-primary/40 bg-primary/12",
                "font-mono text-[13px] font-bold text-primary",
                "transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground",
              )}
            >
              {t("header.monogram")}
            </span>
            <span className="hidden leading-none sm:block">
              <span className="block font-display text-[15px] font-semibold tracking-tight">
                {t("global.profile.fullName", { name: profile.fullName })}
              </span>
              <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {t("global.profile.role")}
              </span>
            </span>
          </Link>

          {/* Desktop navigation: labels with a small index number */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "group relative rounded-sm px-3 py-2 font-mono text-[12px] uppercase tracking-[0.1em]",
                    "transition-colors duration-200",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {t(item.key)}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-1.5 -bottom-0.5 h-px bg-primary"
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle className="hidden md:inline-flex" />
            <Link
              to="/contact"
              className={cn(
                "hidden items-center gap-1.5 rounded-notch border border-foreground/20 px-4 py-2.5 lg:inline-flex",
                "font-mono text-[11px] uppercase tracking-[0.12em] transition-all duration-300",
                "hover:border-primary hover:bg-primary hover:text-primary-foreground",
              )}
            >
              {t("header.cta")}
              <ArrowUpRight className="size-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              className={cn(
                "grid size-10 place-items-center rounded-notch border border-border lg:hidden",
                "transition-colors hover:border-primary hover:text-primary",
              )}
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu panel: one big stack, not a small centered list */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-background/97 backdrop-blur-lg lg:hidden"
          >
            <nav className="container flex h-full flex-col justify-center gap-1 pt-16">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, x: -22 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 + i * 0.045, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-baseline gap-4 border-b border-border/60 py-4",
                        "font-display text-3xl font-semibold tracking-tight transition-colors",
                        isActive ? "text-primary" : "text-foreground hover:text-primary",
                      )
                    }
                  >
                    {t(item.key)}
                  </NavLink>
                </motion.div>
              ))}
              <div className="mt-8 flex items-center justify-between">
                <ThemeToggle />
                <a
                  href={mailtoHref(t("global.profile.email")) || undefined}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-mono text-[12px] uppercase tracking-[0.12em] text-primary"
                >
                  {t("global.profile.email")}
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
