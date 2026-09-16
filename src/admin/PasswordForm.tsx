import * as React from "react";
import { AlertTriangle, Check, KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminAuth } from "@/admin/AdminAuthProvider";
import {
  checkNewPassword,
  MIN_PASSWORD_LENGTH,
  PASSWORD_PROBLEM_TEXT,
  type PasswordProblem,
} from "@/lib/adminAccount";

interface PasswordFormProps {
  onDone: () => void;
  /** Label on the submit button. */
  submitLabel?: string;
}

/**
 * Replaces the account password.
 *
 * The current password is asked for every time, even on the very first change.
 * That is what stops a borrowed browser, with a session already open, from
 * being used to lock the owner out of their own account.
 */
export function PasswordForm({ onDone, submitLabel = "Set password" }: PasswordFormProps) {
  const { changePassword } = useAdminAuth();

  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [problem, setProblem] = React.useState<PasswordProblem>(null);
  const [error, setError] = React.useState<string | null>(null);

  const longEnough = next.length >= MIN_PASSWORD_LENGTH;
  const matches = next.length > 0 && next === confirmation;
  const differs = next.length > 0 && next !== current;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const found = checkNewPassword(next, confirmation, current);
    setProblem(found);
    if (found) return;

    setBusy(true);
    const outcome = await changePassword(current, next);
    setBusy(false);

    if (!outcome.ok) {
      setError(outcome.message ?? "The password could not be changed.");
      return;
    }

    setCurrent("");
    setNext("");
    setConfirmation("");
    onDone();
  }

  const describedBy = error ? "password-error" : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label
          htmlFor="password-current"
          className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground"
        >
          Current password
        </label>
        <Input
          id="password-current"
          type="password"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          autoComplete="current-password"
          required
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password-next"
          className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground"
        >
          New password
        </label>
        <Input
          id="password-next"
          type="password"
          value={next}
          onChange={(event) => setNext(event.target.value)}
          autoComplete="new-password"
          required
          aria-invalid={Boolean(problem) || Boolean(error)}
          aria-describedby="password-rules"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password-confirm"
          className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground"
        >
          Repeat the new password
        </label>
        <Input
          id="password-confirm"
          type="password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="new-password"
          required
          aria-invalid={Boolean(problem) || Boolean(error)}
          aria-describedby="password-rules"
        />
      </div>

      <ul id="password-rules" className="space-y-2">
        <Rule satisfied={longEnough} label={`At least ${MIN_PASSWORD_LENGTH} characters`} />
        <Rule satisfied={matches} label="Both entries match" />
        <Rule satisfied={differs} label="Different from the password in use" />
      </ul>

      {problem ? (
        <p role="alert" className="flex items-start gap-2.5 text-[14px] text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {PASSWORD_PROBLEM_TEXT[problem]}
        </p>
      ) : null}

      {error ? (
        <p
          id="password-error"
          role="alert"
          className="flex items-start gap-2.5 text-[14px] leading-relaxed text-destructive text-pretty"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Saving" : submitLabel}
        <KeyRound aria-hidden />
      </Button>
    </form>
  );
}

function Rule({ satisfied, label }: { satisfied: boolean; label: string }) {
  const Icon = satisfied ? Check : X;
  return (
    <li
      className={
        satisfied
          ? "flex items-center gap-2 font-mono text-[11px] tracking-wide text-moss-300"
          : "flex items-center gap-2 font-mono text-[11px] tracking-wide text-muted-foreground"
      }
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {label}
    </li>
  );
}
