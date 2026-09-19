import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminAuthProvider } from "@/admin/AdminAuthProvider";
import { RequireAdmin } from "@/admin/RequireAdmin";
import { ContentProvider } from "@/content/ContentProvider";
import { EntriesProvider } from "@/entries/EntriesProvider";
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
import Steadbyte from "@/pages/Steadbyte";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminForgotPassword from "@/pages/AdminForgotPassword";
import AdminResetPassword from "@/pages/AdminResetPassword";

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
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <TooltipProvider delayDuration={180} skipDelayDuration={300}>
      <ContentProvider>
        <EntriesProvider>
          <AdminAuthProvider>
            <div className="relative min-h-dvh bg-background bg-grain-fade">
              <ScrollProgress />
              <CursorAura />
              <ScrollToTop />
              {isAdminRoute ? (
                <AdminRoutes location={location} />
              ) : (
                <>
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
                        <Route path="/about-steadbyte" element={<Steadbyte />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </PageShell>
                  </AnimatePresence>
                  <SiteFooter />
                </>
              )}
            </div>
          </AdminAuthProvider>
        </EntriesProvider>
      </ContentProvider>
    </TooltipProvider>
  );
}

/**
 * The panel renders outside the site chrome. It keeps its own routes so a
 * visitor never sees the marketing header above a sign in form, and so the
 * public 404 page cannot swallow an admin address.
 */
function AdminRoutes({ location }: { location: ReturnType<typeof useLocation> }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageShell key={location.pathname}>
        <Routes location={location}>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
          <Route path="/admin/reset-password" element={<AdminResetPassword />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            }
          />
          {/* An unknown address under /admin is a typo, not a missing page. */}
          <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </PageShell>
    </AnimatePresence>
  );
}
