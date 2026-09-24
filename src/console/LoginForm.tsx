"use client";

import { LogoMark } from "@/components/LogoMark";
import { Field, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { isStaffRole, ROUTES, safeConsoleNext } from "@/lib/routes";
import { validateEmail } from "@/services/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export function ConsoleLoginForm({
  next,
  buyerBlocked = false,
}: {
  next?: string | null;
  buyerBlocked?: boolean;
}) {
  const { login, isAuthenticated, user, state } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    buyerBlocked ? "Sellers and admins only. Sign in with a staff email and password." : "",
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!state.hydrated) return;
    if (isAuthenticated && user && isStaffRole(user.role)) {
      router.replace(safeConsoleNext(next, user.role));
    }
  }, [state.hydrated, isAuthenticated, user, next, router]);

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
      if (!isStaffRole(signedIn.role)) {
        setError("Buyer accounts cannot open the console. Use a seller or admin login.");
        return;
      }
      router.replace(safeConsoleNext(next, signedIn.role));
    } catch {
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
      <h1 className="mt-4 text-center text-2xl font-semibold">Sign in to Console</h1>
      <p className="mt-2 text-center text-sm text-stone-500">
        Sellers and admins only. Email and password — OTP is not required.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Email">
          <TextInput
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@shop.com"
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
          className="btn-primary btn-block"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        <Link href={ROUTES.forgotPassword} className="underline">
          Forgot password?
        </Link>
        {" · "}
        Need an account?{" "}
        <Link href={ROUTES.signup} className="underline">
          Sign up
        </Link>
        {" · "}
        <Link href={ROUTES.home} className="underline">
          Back to the shop
        </Link>
      </p>
    </div>
  );
}
