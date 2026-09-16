import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageSection } from "@/components/layout/SectionHeading";
import { Reveal } from "@/components/fx/Reveal";
import { useAdminAuth } from "@/admin/AdminAuthProvider";
import { checkNewPassword, MIN_PASSWORD_LENGTH, PASSWORD_PROBLEM_TEXT } from "@/lib/adminAccount";

export default function AdminResetPassword() {
  const navigate = useNavigate();
  const { status, resetPasswordWithToken } = useAdminAuth();

  const [password, setPassword] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const problem = checkNewPassword(password, confirmation, "");
    if (problem) {
      setError(PASSWORD_PROBLEM_TEXT[problem]);
      return;
    }

    setBusy(true);
    const outcome = await resetPasswordWithToken(password);
    setBusy(false);

    if (!outcome.ok) {
      setError(outcome.message ?? "Could not update password.");
      return;
    }

    setSuccess(true);
  }

  return (
    <PageSection className="pt-16 sm:pt-20">
      <div className="mx-auto max-w-lg">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[12px] font-bold text-primary">08</span>
            <span className="eyebrow">admin password reset</span>
          </div>

          <h1 className="mt-6 font-display text-3xl leading-[1.05] tracking-tight sm:text-4xl">
            Set new password
          </h1>

          <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground text-pretty">
            Choose a strong new password for your admin account. Password must be at least{" "}
            {MIN_PASSWORD_LENGTH} characters.
          </p>

          <div className="panel mt-8 p-7">
            {status === "loading" ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : success ? (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 p-4 text-[14px] leading-relaxed text-primary">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <p>Your password has been successfully updated.</p>
                </div>
                <Button onClick={() => navigate("/admin", { replace: true })} className="w-full">
                  Go to Admin Panel
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <label
                    htmlFor="new-password"
                    className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground"
                  >
                    New Password
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                    aria-invalid={Boolean(error)}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirm-password"
                    className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground"
                  >
                    Confirm Password
                  </label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    autoComplete="new-password"
                    required
                    aria-invalid={Boolean(error)}
                  />
                </div>

                {error ? (
                  <p
                    role="alert"
                    className="flex items-start gap-2.5 text-[14px] leading-relaxed text-destructive text-pretty"
                  >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {error}
                  </p>
                ) : null}

                <Button type="submit" disabled={busy || !password || !confirmation} className="w-full">
                  {busy ? "Updating..." : "Update Password"}
                  <KeyRound aria-hidden />
                </Button>
              </form>
            )}
          </div>

          <div className="mt-6">
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/login">
                <ArrowLeft aria-hidden />
                Back to Sign in
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </PageSection>
  );
}
