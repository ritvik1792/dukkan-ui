"use client";

import { LogoMark } from "@/components/LogoMark";
import { Field, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { ApiError } from "@/lib/api";
import { ROUTES } from "@/lib/routes";
import { validateEmail, validatePassword } from "@/services/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function SignupForm() {
  const { signup } = useApp();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (name.trim().length < 2) {
      setError("Enter your name.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signup({ name: name.trim(), email: email.trim(), password });
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("That email is already registered. Sign in instead.");
        return;
      }
      setError("Could not reach the API. Is the backend running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-12">
      <div className="flex justify-center">
        <LogoMark className="h-14 w-14 rounded-full" />
      </div>
      <h1 className="mt-4 text-center text-2xl font-semibold">Create an account</h1>
      <p className="mt-2 text-center text-sm text-stone-500">
        Your password is stored as a hash in the database — never in Google Secret Manager
        or Cloud Run env vars. New accounts start as buyers.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Name">
          <TextInput
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </Field>
        <Field label="Email">
          <TextInput
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourdomain.com"
          />
        </Field>
        <Field label="Password">
          <TextInput
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-ink py-2.5 text-sm font-semibold text-lime disabled:opacity-60"
        >
          {busy ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link href={ROUTES.consoleLogin} className="underline">
          Console sign in
        </Link>
        {" · "}
        <Link href={ROUTES.home} className="underline">
          Back to the shop
        </Link>
      </p>
    </div>
  );
}
