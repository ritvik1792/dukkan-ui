"use client";

import { LogoMark } from "@/components/LogoMark";
import { Field, TextInput } from "@/components/ui/Field";
import { ApiError, resetPasswordRequest } from "@/lib/api";
import { BRAND } from "@/lib/constants";
import { ROUTES } from "@/lib/routes";
import { validatePassword } from "@/services/auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Missing reset token. Open the link from your email.");
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await resetPasswordRequest(token, password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Invalid or expired reset link.");
      } else {
        setError("Could not reach the API. Is the backend running?");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-12">
      <div className="flex justify-center">
        <LogoMark className="h-14 w-14" />
      </div>
      <h1 className="mt-4 text-center text-2xl font-semibold">Reset password</h1>
      {done ? (
        <div className="mt-6 space-y-4 text-center text-sm text-stone-600">
          <p>Your password was updated. Sign in with the new password.</p>
          <Link href={ROUTES.login} className="inline-block underline">
            Go to sign in
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-2 text-center text-sm text-stone-500">
            Choose a new password for your {BRAND.name} account.
          </p>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Field label="New password">
              <TextInput
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label="Confirm password">
              <TextInput
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={busy || !token}
              className="w-full rounded-full bg-ink py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        </>
      )}
      <p className="mt-6 text-center text-sm text-stone-500">
        <Link href={ROUTES.forgotPassword} className="underline">
          Request a new link
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Loading…</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
