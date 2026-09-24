"use client";

import { LogoMark } from "@/components/LogoMark";
import { Field, TextInput } from "@/components/ui/Field";
import { forgotPasswordRequest } from "@/lib/api";
import { BRAND } from "@/lib/constants";
import { ROUTES } from "@/lib/routes";
import { validateEmail } from "@/services/auth";
import Link from "next/link";
import { FormEvent, useState } from "react";

const GENERIC_SUCCESS =
  "If an account exists for that email, a password reset link has been sent.";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await forgotPasswordRequest(email.trim());
      setMessage(res.message || GENERIC_SUCCESS);
    } catch {
      // Still show the generic message — do not leak API reachability quirks as existence.
      setMessage(GENERIC_SUCCESS);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-12">
      <div className="flex justify-center">
        <LogoMark className="h-14 w-14" />
      </div>
      <h1 className="mt-4 text-center text-2xl font-semibold">Forgot password</h1>
      <p className="mt-2 text-center text-sm text-stone-500">
        Enter your email. We&apos;ll send a reset link if an account exists. Locally, when SMTP
        is unset, the API logs the link for development.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Email">
          <TextInput
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
          />
        </Field>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {message && <p className="text-sm text-stone-600">{message}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-ink py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        <Link href={ROUTES.login} className="underline">
          Back to sign in
        </Link>
        {" · "}
        <Link href={ROUTES.home} className="underline">
          {BRAND.name}
        </Link>
      </p>
    </div>
  );
}
