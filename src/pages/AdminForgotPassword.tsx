import * as React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PageSection } from "@/components/layout/SectionHeading";
import { Reveal } from "@/components/fx/Reveal";
import { useAdminAuth } from "@/admin/AdminAuthProvider";

export default function AdminForgotPassword() {
  const { canSignIn, configMessage, sendPasswordReset } = useAdminAuth();

  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);

    const outcome = await sendPasswordReset(input);
    setBusy(false);

    if (!outcome.ok) {
      setError(outcome.message ?? "Could not send reset email.");
      return;
    }

    setSuccess(outcome.message ?? "Password reset link sent to your email.");
  }

  return (
    <PageSection className="pt-16 sm:pt-20">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <Reveal className="lg:col-span-7">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[12px] font-bold text-primary">08</span>
            <span className="eyebrow">admin recovery</span>
          </div>

          <h1 className="mt-6 font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
            Reset administrator password
          </h1>

          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground text-pretty">
            Enter your registered admin username or email. If the account exists on the admin
            allowlist, a secure recovery link will be sent to your email.
          </p>

          <Separator dashed className="my-10" />

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <ShieldCheck className="size-5 text-primary" aria-hidden />
              <h2 className="mt-3 font-display text-lg leading-snug">Restricted to Admins</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground text-pretty">
                Only email addresses registered on the database allowlist can receive access to
                reset their credentials.
              </p>
            </div>
            <div>
              <KeyRound className="size-5 text-primary" aria-hidden />
              <h2 className="mt-3 font-display text-lg leading-snug">Time-limited Token</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground text-pretty">
                The link inside the email is single-use and expires automatically to keep your
                account safe.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-5">
          <div className="panel p-7">
            <h2 className="font-display text-xl">Forgot Password</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              We will send a reset link to the email connected to your admin account.
            </p>

            {configMessage ? (
              <p
                role="alert"
                className="mt-5 text-[14px] leading-relaxed text-destructive text-pretty"
              >
                {configMessage}
              </p>
            ) : null}

            {success ? (
              <div className="mt-6 space-y-5">
                <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 p-4 text-[14px] leading-relaxed text-primary">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <p>{success}</p>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/admin/login">Return to sign in</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
                <div className="space-y-2">
                  <label
                    htmlFor="reset-input"
                    className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground"
                  >
                    Username or Email
                  </label>
                  <Input
                    id="reset-input"
                    name="emailOrUsername"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="arnalputra or arnal@steadbyte.com"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
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

                <Button type="submit" disabled={busy || !canSignIn || !input.trim()} className="w-full">
                  {busy ? "Sending link..." : "Send reset link"}
                  <Mail aria-hidden />
                </Button>

                <div className="text-center">
                  <Link
                    to="/admin/login"
                    className="text-[13px] text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Remember your password? Sign in
                  </Link>
                </div>
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
