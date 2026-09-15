import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ScrollProgress } from "@/components/fx/ScrollProgress";
import { CursorAura } from "@/components/fx/CursorAura";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import Home from "@/pages/Home";
import Career from "@/pages/Career";
import Projects from "@/pages/Projects";
import Credentials from "@/pages/Credentials";
import Skills from "@/pages/Skills";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/NotFound";

/** Page transition: quick exit, entry with a slight delay. */
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10"
    >
      {children}
    </motion.main>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <TooltipProvider delayDuration={180} skipDelayDuration={300}>
      <div className="relative min-h-dvh bg-background bg-grain-fade">
        <ScrollProgress />
        <CursorAura />
        <ScrollToTop />
        <SiteHeader />
        <AnimatePresence mode="wait" initial={false}>
          <PageShell key={location.pathname}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/career" element={<Career />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/credentials" element={<Credentials />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageShell>
        </AnimatePresence>
        <SiteFooter />
      </div>
    </TooltipProvider>
  );
}
