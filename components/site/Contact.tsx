"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { site } from "@/lib/site";
import { useSite } from "./SiteProvider";

const WEB3FORMS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;

type Fields = { name: string; email: string; subject: string; artwork: string; message: string };
type Errors = Partial<Record<keyof Fields, string>>;

const empty: Fields = { name: "", email: "", subject: "", artwork: "", message: "" };

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = "Please add your name.";
  if (!f.email.trim()) e.email = "Please add an email address so Prichard can reply.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "That email address looks incomplete.";
  if (!f.message.trim()) e.message = "Please write a short message.";
  return e;
}

export function Contact() {
  const { artworks, inquiry } = useSite();
  const [fields, setFields] = useState<Fields>(empty);
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "mailto" | "error">("idle");
  const nameRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Links from an artwork's own page arrive as /?inquire=<slug>#contact.
  useEffect(() => {
    const url = new URL(window.location.href);
    const slug = url.searchParams.get("inquire");
    const match = slug && artworks.find((a) => a.slug === slug);
    if (!match) return;
    setFields((f) => ({ ...f, artwork: match.title, subject: `About "${match.title}"` }));
    url.searchParams.delete("inquire");
    window.history.replaceState(null, "", url);
  }, [artworks]);

  // Picks up "Inquire about this piece" from the lightbox.
  useEffect(() => {
    if (!inquiry) return;
    setFields((f) => ({ ...f, artwork: inquiry.title, subject: f.subject || `About "${inquiry.title}"` }));
    setState("idle");
    const t = setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 500);
    return () => clearTimeout(t);
  }, [inquiry]);

  const errors = validate(fields);
  const show = (k: keyof Fields) => (touched[k] ? errors[k] : undefined);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));
  const blur = (k: keyof Fields) => () => setTouched((t) => ({ ...t, [k]: true }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (Object.keys(errors).length) {
      setTouched({ name: true, email: true, message: true });
      const first = (["name", "email", "message"] as const).find((k) => errors[k]);
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    const subject = fields.subject.trim() || (fields.artwork ? `About "${fields.artwork}"` : "Message from the website");
    const body = [
      fields.message.trim(),
      "",
      ...(fields.artwork ? [`Artwork: ${fields.artwork}`] : []),
      `From: ${fields.name} <${fields.email}>`,
    ].join("\n");

    if (!WEB3FORMS_KEY) {
      window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setState("mailto");
      return;
    }

    setState("sending");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject,
          from_name: fields.name,
          name: fields.name,
          email: fields.email,
          artwork: fields.artwork || "None selected",
          message: fields.message,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setState("sent");
      setFields(empty);
      setTouched({});
    } catch {
      setState("error");
    }
  }

  const input = "field mt-2";

  return (
    <section id="contact" aria-labelledby="contact-title" className="border-t border-sand bg-mist/50 py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-10">
        <div className="lg:col-span-5">
          <h2 id="contact-title" className="font-serif text-5xl font-semibold tracking-tight sm:text-6xl">
            Get in touch
          </h2>
          <p className="mt-6 max-w-md text-lg text-ink-soft">
            Ask about an original, order a print, or describe a commission. Photos of the boat, house
            or person you have in mind are a great place to start.
          </p>

          <ul className="mt-10 space-y-6">
            <li className="flex gap-4">
              <Mail className="mt-1 size-5 shrink-0 text-bay" aria-hidden />
              <div>
                <p className="text-sm text-ink-soft">Email</p>
                <a href={`mailto:${site.email}`} className="text-lg text-ink underline decoration-sand underline-offset-4 transition-colors hover:decoration-bay">
                  {site.email}
                </a>
              </div>
            </li>
            <li className="flex gap-4">
              <MapPin className="mt-1 size-5 shrink-0 text-bay" aria-hidden />
              <div>
                <p className="text-sm text-ink-soft">Studio</p>
                <a href={site.mapUrl} target="_blank" rel="noreferrer" className="text-lg text-ink underline decoration-sand underline-offset-4 transition-colors hover:decoration-bay">
                  {site.address.street}
                  <br />
                  {site.address.city}
                  <span className="sr-only"> (opens Google Maps in a new tab)</span>
                </a>
              </div>
            </li>
            <li className="flex gap-4">
              <MessageCircle className="mt-1 size-5 shrink-0 text-bay" aria-hidden />
              <div>
                <p className="text-sm text-ink-soft">Facebook &amp; Messenger</p>
                <a href={site.facebookUrl} target="_blank" rel="noreferrer" className="text-lg text-ink underline decoration-sand underline-offset-4 transition-colors hover:decoration-bay">
                  {site.messengerName}
                  <span className="sr-only"> on Facebook (opens in a new tab)</span>
                </a>
              </div>
            </li>
          </ul>
        </div>

        <form
          ref={formRef}
          noValidate
          aria-labelledby="contact-title"
          onSubmit={onSubmit}
          className="border border-stone-200 bg-paper p-6 shadow-sm sm:p-10 lg:col-span-7"
        >
          <p className="mb-6 text-sm text-ink-soft">
            Fields marked <span className="text-rust-text">*</span> are required.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Name" required error={show("name")} id="c-name">
              <input ref={nameRef} id="c-name" name="name" autoComplete="name" value={fields.name} onChange={set("name")} onBlur={blur("name")} aria-required="true" aria-invalid={!!show("name")} aria-describedby={show("name") ? "c-name-err" : undefined} className={`${input}`} />
            </Field>
            <Field label="Email" required error={show("email")} id="c-email">
              <input id="c-email" name="email" type="email" autoComplete="email" inputMode="email" value={fields.email} onChange={set("email")} onBlur={blur("email")} aria-required="true" aria-invalid={!!show("email")} aria-describedby={show("email") ? "c-email-err" : undefined} className={`${input}`} />
            </Field>
            <Field label="Subject" id="c-subject" className="sm:col-span-2">
              <input id="c-subject" name="subject" value={fields.subject} onChange={set("subject")} placeholder="A commission, a print, a question" className={`${input}`} />
            </Field>
            <Field label="Artwork" hint="Optional" id="c-artwork" className="sm:col-span-2">
              <select id="c-artwork" name="artwork" value={fields.artwork} onChange={set("artwork")} className={`${input} cursor-pointer`}>
                <option value="">None in particular</option>
                {artworks.map((a) => (
                  <option key={a.id} value={a.title}>
                    {a.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Message" required error={show("message")} id="c-message" className="sm:col-span-2">
              <textarea id="c-message" name="message" rows={6} value={fields.message} onChange={set("message")} onBlur={blur("message")} aria-required="true" aria-invalid={!!show("message")} aria-describedby={show("message") ? "c-message-err" : undefined} className={`${input} resize-y`} />
            </Field>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={state === "sending"}
              className="min-h-12 cursor-pointer bg-ink px-7 font-medium text-linen transition-colors duration-200 hover:bg-bay-deep disabled:cursor-wait disabled:opacity-60"
            >
              {state === "sending" ? "Sending…" : "Send message"}
            </button>
            <p aria-live="polite" className="text-sm text-ink-soft sm:max-w-xs sm:text-right">
              {state === "sent" && <span className="text-bay">Thank you. Your message is on its way.</span>}
              {state === "mailto" && "Your email app should open with the message ready to send."}
              {state === "error" && (
                <span className="text-rust-text">
                  That didn&rsquo;t go through. Please try again, or write to{" "}
                  <a className="underline" href={`mailto:${site.email}`}>{site.email}</a>.
                </span>
              )}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}

function Field({
  label,
  id,
  required,
  hint,
  error,
  className = "",
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-medium text-ink">
        <span>
          {label}
          {required && <span className="text-rust-text" aria-hidden> *</span>}
        </span>
        {hint && <span className="font-normal text-ink-soft">{hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm text-rust-text">
          {error}
        </p>
      )}
    </div>
  );
}
