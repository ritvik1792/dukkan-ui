"use client";

import { LogoMark } from "@/components/LogoMark";
import { Field, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { ApiError } from "@/lib/api";
import { BRAND } from "@/lib/constants";
import { ROUTES } from "@/lib/routes";
import { validateEmail, validateMobile, validatePassword } from "@/services/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function SignupForm() {
  const { signup } = useApp();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
    const phoneError = validateMobile(phone);
    if (phoneError) {
      setError(phoneError);
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
      await signup({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("That email is already registered. Sign in instead.");
        return;
      }
      if (err instanceof ApiError && err.status === 400) {
        setError(err.message || "Check your phone, email, and password.");
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
        <LogoMark className="h-14 w-14" />
      </div>
      <h1 className="mt-4 text-center text-2xl font-semibold">Create an account</h1>
      <p className="mt-2 text-center text-sm text-stone-500">
        Enter phone, email, and password. Phone verification is not required yet — your number
        is stored for later. Passwords are hashed with BCrypt.
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
        <Field label="Phone">
          <TextInput
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            required
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit mobile"
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
          className="btn-primary btn-block"
        >
          {busy ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="underline">
          Sign in
        </Link>
        {" · "}
        <Link href={ROUTES.consoleLogin} className="underline">
          Console
        </Link>
        {" · "}
        <Link href={ROUTES.home} className="underline">
          {BRAND.name}
        </Link>
      </p>
    </div>
  );
}
