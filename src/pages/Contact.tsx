import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Copy,
  Github,
  Inbox,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageIntro, StatStrip } from "@/components/layout/PageIntro";
import { PageSection, SectionHeading } from "@/components/layout/SectionHeading";
import { Reveal, RevealGroup, RevealItem } from "@/components/fx/Reveal";
import { SpotlightCard } from "@/components/fx/SpotlightCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { profile } from "@/data/portfolio";
import { useSiteText } from "@/content/ContentProvider";
import { sendContactMessage } from "@/lib/messages";
import { cn, mailtoHref } from "@/lib/utils";

const MIN_MESSAGE = 20;

const FIELD =
  "flex w-full rounded-notch border border-input bg-background/60 px-3.5 py-2.5 " +
  "font-mono text-sm text-foreground placeholder:text-muted-foreground/70 " +
  "transition-colors duration-200 hover:border-foreground/25 " +
  "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35";

interface FormState {
  name: string;
  email: string;
  topic: string;
  message: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState, t: ReturnType<typeof useSiteText>): Errors {
  const errors: Errors = {};
  if (form.name.trim().length < 2) errors.name = t("contact.form.error.name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = t("contact.form.error.email");
  if (form.message.trim().length < MIN_MESSAGE)
    errors.message = t("contact.form.error.message", {
      count: MIN_MESSAGE - form.message.trim().length,
    });
  return errors;
}

const SOCIAL_ICON = { GitHub: Github, LinkedIn: Linkedin, Email: Mail } as const;

export default function Contact() {
  const t = useSiteText();
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [failure, setFailure] = useState("");
  const [copied, setCopied] = useState(false);

  const topicOptions = useMemo(
    () => [
      t("contact.form.topic.option.1"),
      t("contact.form.topic.option.2"),
      t("contact.form.topic.option.3"),
      t("contact.form.topic.option.4"),
      t("contact.form.topic.option.5"),
    ],
    [t],
  );

  const emptyForm = useMemo<FormState>(
    () => ({ name: "", email: "", topic: topicOptions[0], message: "" }),
    [topicOptions],
  );

  const [form, setForm] = useState<FormState>(emptyForm);

  const messageLength = form.message.trim().length;
  const ready = messageLength >= MIN_MESSAGE;

  const notFilled = t("contact.form.copy.placeholder.name");

  const plainText = useMemo(
    () =>
      [
        t("contact.form.preview.name", { value: form.name.trim() || notFilled }),
        t("contact.form.preview.email", { value: form.email.trim() || notFilled }),
        t("contact.form.preview.topic", { value: form.topic }),
        "",
        form.message.trim(),
      ].join("\n"),
    [form, notFilled, t],
  );

  const recipientEmail = t("global.profile.email") || profile.email;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    setStatus("idle");
    setFailure("");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = validate(form, t);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus("idle");
      return;
    }

    setStatus("sending");
    setFailure("");

    const result = await sendContactMessage({
      name: form.name.trim(),
      email: form.email.trim(),
      topic: form.topic,
      message: form.message.trim(),
    });

    if (!result.ok) {
      setStatus("failed");
      setFailure(result.error ?? t("contact.form.error.send"));
      return;
    }

    setStatus("sent");
    setForm(emptyForm);
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }

  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <>
      <PageIntro
        eyebrow={t("contact.eyebrow")}
        title={t("contact.title")}
        lead={t("contact.lead")}
      >
        <StatStrip
          items={[
            {
              label: t("contact.stat.response"),
              value: t("contact.stat.response.value"),
              hint: t("contact.stat.response.hint"),
            },
            {
              label: t("contact.stat.timezone"),
              value: t("global.profile.timezone"),
              hint: t("contact.stat.timezone.hint", { location: t("global.profile.location") }),
            },
            {
              label: t("contact.stat.channels"),
              value: `${profile.socials.length}`,
              hint: t("contact.stat.channels.hint", {
                names: profile.socials.map((s) => s.label).join(" · "),
              }),
            },
            {
              label: t("contact.stat.status"),
              value: t("contact.stat.status.value", {
                availability: t("global.profile.availability"),
              }),
              hint: t("contact.stat.status.hint", {
                roles: t("home.hero.stat.role.value"),
              }),
            },
          ]}
        />
      </PageIntro>

      {/* 01 - form */}
      <PageSection>
        <SectionHeading
          eyebrow={t("contact.form.eyebrow")}
          title={t("contact.form.title")}
          description={t("contact.form.description")}
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <form onSubmit={onSubmit} noValidate className="panel-flagged p-6 pl-8 sm:p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    name
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder={t("contact.form.field.name.placeholder")}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    className={cn(FIELD, "mt-2", errors.name && "border-destructive/60")}
                  />
                  {errors.name && (
                    <p id="name-error" className="mt-2 font-mono text-[11px] text-destructive">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder={t("contact.form.field.email.placeholder")}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className={cn(FIELD, "mt-2", errors.email && "border-destructive/60")}
                  />
                  {errors.email && (
                    <p id="email-error" className="mt-2 font-mono text-[11px] text-destructive">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="topic"
                  className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
                >
                  topic
                </label>
                <Select value={form.topic} onValueChange={(value) => update("topic", value)}>
                  <SelectTrigger id="topic" className="mt-2">
                    <SelectValue placeholder={t("contact.form.field.topic.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {topicOptions.map((topic) => (
                      <SelectItem key={topic} value={topic}>
                        {topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-5">
                <div className="flex items-baseline justify-between gap-4">
                  <label
                    htmlFor="message"
                    className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    message
                  </label>
                  <span
                    className={cn(
                      "font-mono text-[11px] tabular-nums",
                      ready ? "text-moss-300" : "text-muted-foreground",
                    )}
                  >
                    {t("contact.form.counter", { count: messageLength })}
                  </span>
                </div>
                <textarea
                  id="message"
                  name="message"
                  rows={7}
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder={t("contact.form.field.message.placeholder")}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby="message-hint"
                  className={cn(FIELD, "mt-2 resize-y", errors.message && "border-destructive/60")}
                />
                <Progress
                  value={Math.min(100, (messageLength / MIN_MESSAGE) * 100)}
                  className="mt-3 h-1"
                  indicatorClassName={ready ? "bg-moss-500" : "bg-primary"}
                  aria-label={t("contact.form.length.label")}
                />
                <p
                  id="message-hint"
                  className={cn(
                    "mt-2 font-mono text-[11px] leading-relaxed",
                    errors.message ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {errors.message ??
                    (ready
                      ? t("contact.form.hint.ready")
                      : t("contact.form.hint.tooShort", { count: MIN_MESSAGE }))}
                </p>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={status === "sending"}>
                  {status === "sending" ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <Send aria-hidden />
                  )}
                  {status === "sending" ? t("contact.form.submit.sending") : t("contact.form.submit")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setForm(emptyForm);
                    setErrors({});
                    setStatus("idle");
                    setFailure("");
                  }}
                >
                  {t("contact.form.clear")}
                </Button>
                {errorCount > 0 && (
                  <span
                    role="alert"
                    className="font-mono text-[11px] uppercase tracking-[0.1em] text-destructive"
                  >
                    {t("contact.form.error.summary", { count: errorCount })}
                  </span>
                )}
              </div>

              {status === "sent" && (
                <div
                  role="status"
                  className="mt-7 rounded-notch border border-moss-600/40 bg-moss-600/10 p-5"
                >
                  <p className="eyebrow flex items-center gap-2 text-moss-300">
                    <Check className="size-3.5" aria-hidden />
                    {t("contact.form.sent.title")}
                  </p>
                  <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                    {t("contact.form.sent.body", { email: recipientEmail })}
                  </p>
                </div>
              )}

              {status === "failed" && (
                <div
                  role="alert"
                  className="mt-7 rounded-notch border border-destructive/40 bg-destructive/10 p-5"
                >
                  <p className="eyebrow flex items-center gap-2 text-destructive">
                    <AlertTriangle className="size-3.5" aria-hidden />
                    {t("contact.form.failed.title")}
                  </p>
                  <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                    {t("contact.form.failed.body", { error: failure })}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button variant="outline" size="sm" onClick={copyMessage}>
                      {copied ? (
                        <Check className="size-4" aria-hidden />
                      ) : (
                        <Copy className="size-4" aria-hidden />
                      )}
                      {copied ? t("contact.form.copy.copied") : t("contact.form.copy")}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Reveal>

          {/* sidebar */}
          <div className="space-y-6 lg:col-span-5">
            <Reveal delay={0.08}>
              <div className="panel p-6 sm:p-8">
                <p className="eyebrow flex items-center gap-2">
                  <Inbox className="size-3.5 text-primary" aria-hidden />
                  {t("contact.sidebar.answer.title")}
                </p>
                <ul className="mt-5 space-y-3 text-[14px] leading-relaxed text-muted-foreground">
                  {[
                    t("contact.sidebar.answer.item.1"),
                    t("contact.sidebar.answer.item.2"),
                    t("contact.sidebar.answer.item.3"),
                    t("contact.sidebar.answer.item.4"),
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span aria-hidden className="mt-2 size-1 shrink-0 rotate-45 bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Separator className="my-6" />

                <p className="eyebrow flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-primary" aria-hidden />
                  {t("contact.sidebar.promise.title")}
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                  {t("contact.sidebar.promise.body")}
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.16}>
              <div className="panel-flagged p-6 pl-8">
                <p className="eyebrow flex items-center gap-2">
                  <AlertTriangle className="size-3.5 text-primary" aria-hidden />
                  {t("contact.sidebar.note.title")}
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                  {t("contact.sidebar.note.body")}
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="panel p-6 sm:p-8">
                <p className="eyebrow">{t("contact.channels.title")}</p>
                <RevealGroup className="mt-5 space-y-px overflow-hidden rounded-notch border border-border bg-border">
                  {profile.socials.map((social) => {
                    const Icon = SOCIAL_ICON[social.label as keyof typeof SOCIAL_ICON] ?? Mail;
                    // The email channel follows the editable address so the
                    // channel list never points at a stale mailbox.
                    const href = social.href.startsWith("mailto:")
                      ? mailtoHref(t("global.profile.email"))
                      : social.href;
                    if (!href) return null;
                    return (
                      <RevealItem key={social.label}>
                        <SpotlightCard className="rounded-none border-0 p-0">
                          <a
                            href={href}
                            target={href.startsWith("http") ? "_blank" : undefined}
                            rel="noreferrer noopener"
                            className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
                          >
                            <span className="flex items-center gap-3">
                              <Icon className="size-4 text-primary" aria-hidden />
                              <span className="font-display text-[15px] font-medium tracking-tight">
                                {social.label}
                              </span>
                            </span>
                            <ArrowRight
                              className="size-4 text-muted-foreground transition-transform duration-300 ease-out-expo group-hover:translate-x-1 group-hover:text-primary"
                              aria-hidden
                            />
                          </a>
                        </SpotlightCard>
                      </RevealItem>
                    );
                  })}
                </RevealGroup>

                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <MapPin className="size-3.5" aria-hidden />
                    {t("global.profile.location")}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="size-3.5" aria-hidden />
                    {t("global.profile.timezone")}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  <Badge variant="moss" dot>
                    {t("contact.channels.badge.open")}
                  </Badge>
                  <Badge variant="muted">{t("contact.channels.badge.reply")}</Badge>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </PageSection>

      {/* CTA */}
      <PageSection className="border-t border-border bg-card/25">
        <Reveal>
          <div className="panel-flagged relative overflow-hidden p-8 sm:p-10">
            <div aria-hidden className="pointer-events-none absolute inset-0 grid-lines opacity-35" />
            <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-8">
                <p className="eyebrow">{t("contact.cta.eyebrow")}</p>
                <p className="mt-3 max-w-2xl font-display text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
                  {t("contact.cta.body")}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
                <Button asChild variant="outline">
                  <Link to="/projects">
                    {t("contact.cta.button.projects")}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/">{t("contact.cta.button.home")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </PageSection>
    </>
  );
}
