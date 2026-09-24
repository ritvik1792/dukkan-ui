"use client";

import { LogoMark } from "@/components/LogoMark";
import { Field, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { BRAND } from "@/lib/constants";
import { useMotionRouter } from "@/lib/motion";
import { ROUTES } from "@/lib/routes";
import { validateEmail } from "@/services/auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

function LoginForm() {
  const { login, isAuthenticated, state } = useApp();
  const router = useMotionRouter();
  const params = useSearchParams();
  const next = params.get("next") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!state.hydrated) return;
    if (isAuthenticated) {
      router.replace(next || "/");
    }
  }, [state.hydrated, isAuthenticated, router, next]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const signedIn = await login(email.trim(), password);
      if (!signedIn) {
        setError("Invalid email or password.");
        return;
      }
      router.replace(next || "/");
    } catch {
      setError("Could not reach the API. Is the backend running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-12">
      <div className="flex justify-center">
        <LogoMark className="h-14 w-14" />
      </div>
      <h1 className="mt-4 text-center text-2xl font-semibold">Sign in</h1>
      <p className="mt-2 text-center text-sm text-stone-500">
        Email and password for {BRAND.name}. No OTP required right now.
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
        <Field label="Password">
          <TextInput
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-ink py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        <Link href={ROUTES.forgotPassword} className="underline">
          Forgot password?
        </Link>
        {" · "}
        <Link href={ROUTES.signup} className="underline">
          Sign up
        </Link>
        {" · "}
        <Link href={ROUTES.home} className="underline">
          Home
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
