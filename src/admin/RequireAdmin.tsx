import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAdminAuth } from "@/admin/AdminAuthProvider";

/**
 * Keeps the panel away from anyone who is not an allowlisted admin.
 *
 * This is a convenience, not the security boundary. Every table behind it is
 * already unreachable without a policy or a definer function that checks the
 * caller, so bypassing this component in the browser reveals nothing but an
 * empty shell.
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { status, identity } = useAdminAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div
        role="status"
        className="container flex min-h-[60dvh] items-center gap-3 py-24 text-[14px] text-muted-foreground"
      >
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Checking the session
      </div>
    );
  }

  if (status !== "signed-in" || !identity) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  // A placeholder password opens nothing until it has been replaced.
  if (identity.mustChangePassword) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
