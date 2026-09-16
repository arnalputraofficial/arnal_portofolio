import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, KeyRound, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageSection } from "@/components/layout/SectionHeading";
import { Reveal } from "@/components/fx/Reveal";
import { PasswordForm } from "@/admin/PasswordForm";
import { useAdminAuth } from "@/admin/AdminAuthProvider";

/** Honest notes shown beside the form, so the page is not a bare box. */
const NOTES = [
  {
    icon: ShieldCheck,
    title: "The allowlist decides, not the form",
    body: "Holding an account on this Supabase project is not enough. The database checks the address against an allowlist before a session is handed anything, and a signed in account that is not on that list is signed straight back out.",
  },
  {
    icon: KeyRound,
    title: "Published content is public",
    body: "Publishing writes to the same table the public site reads from, so whatever is published becomes visible to every visitor. Drafts stay private until they are published on purpose.",
  },
];

export default function AdminLogin() {
  const navigate = useNavigate();
  const { status, identity, canSignIn, configMessage, signIn } = useAdminAuth();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const mustChangePassword = status === "signed-in" && Boolean(identity?.mustChangePassword);

  // A live session with a settled password has no business on this page.
  React.useEffect(() => {
    if (status === "signed-in" && identity && !identity.mustChangePassword) {
      navigate("/admin", { replace: true });
    }
  }, [status, identity, navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    const outcome = await signIn(username, password);
    setBusy(false);

    if (!outcome.ok) {
      setError(outcome.message ?? "Sign in failed.");
      setPassword("");
      return;
    }

    setPassword("");
    if (!outcome.mustChangePassword) navigate("/admin", { replace: true });
  }

  return (
    <PageSection className="pt-16 sm:pt-20">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <Reveal className="lg:col-span-7">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[12px] font-bold text-primary">08</span>
            <span className="eyebrow">admin access</span>
          </div>

          <h1 className="mt-6 font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
            The lock is in the database
          </h1>

          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground text-pretty">
            This page is reachable by anyone, and that is deliberate. Nothing here is protected by
            being unknown. It is protected by what the database refuses to do for a caller it does
            not recognise.
          </p>

          <Separator dashed className="my-10" />

          <ul className="grid gap-8 sm:grid-cols-2">
            {NOTES.map((note) => (
              <li key={note.title}>
                <note.icon className="size-5 text-primary" aria-hidden />
                <h2 className="mt-3 font-display text-lg leading-snug">{note.title}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground text-pretty">
                  {note.body}
                </p>
              </li>
            ))}
          </ul>

          <div className="panel-flagged mt-10 p-5">
            <p className="text-[14px] leading-relaxed text-muted-foreground text-pretty">
              The panel is deliberately absent from the site navigation, so there is no link to it
              anywhere. Keep the address, or go back to{" "}
              <Link
                to="/"
                className="text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
              >
                the public site
              </Link>
              .
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-5">
          <div className="panel p-7">
            {status === "loading" ? (
              <LoadingCard />
            ) : mustChangePassword ? (
              <FirstPasswordCard onDone={() => navigate("/admin", { replace: true })} />
            ) : (
              <SignInCard
                username={username}
                password={password}
                busy={busy}
                error={error}
                canSignIn={canSignIn}
                configMessage={configMessage}
                onUsername={setUsername}
                onPassword={setPassword}
                onSubmit={handleSubmit}
              />
            )}
          </div>

          <div className="mt-6">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <ArrowLeft aria-hidden />
                Back to the site
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </PageSection>
  );
}

function LoadingCard() {
  return (
    <div role="status" className="flex items-center gap-3 text-[14px] text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      Checking the existing session
    </div>
  );
}

function FirstPasswordCard({ onDone }: { onDone: () => void }) {
  const { identity, signOut } = useAdminAuth();

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl">Choose a password</h2>
        <Badge variant="accent" dot>
          first sign in
        </Badge>
      </div>

      <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground text-pretty">
        The account for <span className="font-mono text-foreground">{identity?.email}</span> still
        carries the placeholder password it was created with. That password was shared in plain
        text, so it is treated as public until it is replaced.
      </p>

      <Separator dashed className="my-6" />

      <PasswordForm onDone={onDone} submitLabel="Set password and continue" />

      <Separator dashed className="my-6" />

      <div className="flex items-center justify-between gap-4">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          The panel stays locked until this is done.
        </p>
        <Button variant="ghost" size="sm" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    </>
  );
}

interface SignInCardProps {
  username: string;
  password: string;
  busy: boolean;
  error: string | null;
  canSignIn: boolean;
  configMessage: string | null;
  onUsername: (value: string) => void;
  onPassword: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

function SignInCard({
  username,
  password,
  busy,
  error,
  canSignIn,
  configMessage,
  onUsername,
  onPassword,
  onSubmit,
}: SignInCardProps) {
  const invalid = Boolean(error);

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl">Sign in</h2>
        <Badge variant={canSignIn ? "accent" : "danger"} dot={canSignIn}>
          {canSignIn ? "backend reachable" : "no backend"}
        </Badge>
      </div>

      {configMessage ? (
        <p
          role="alert"
          className="mt-5 text-[14px] leading-relaxed text-destructive text-pretty"
        >
          {configMessage}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
        <div className="space-y-2">
          <label
            htmlFor="admin-username"
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground"
          >
            Username
          </label>
          <Input
            id="admin-username"
            name="username"
            value={username}
            onChange={(event) => onUsername(event.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            aria-invalid={invalid}
            aria-describedby={invalid ? "admin-signin-error" : undefined}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="admin-password"
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground"
          >
            Password
          </label>
          <Input
            id="admin-password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => onPassword(event.target.value)}
            autoComplete="current-password"
            required
            aria-invalid={invalid}
            aria-describedby={invalid ? "admin-signin-error" : undefined}
          />
        </div>

        {error ? (
          <p
            id="admin-signin-error"
            role="alert"
            className="flex items-start gap-2.5 text-[14px] leading-relaxed text-destructive text-pretty"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={busy || !canSignIn} className="w-full">
          {busy ? "Checking" : "Sign in"}
          <LogIn aria-hidden />
        </Button>
      </form>

      <Separator dashed className="my-6" />

      <p className="text-[13px] leading-relaxed text-muted-foreground text-pretty">
        There is no self service reset on this screen. If the password is lost, it has to be reset
        from the Supabase dashboard, which is a deliberate limit rather than a missing feature.
      </p>
    </>
  );
}
