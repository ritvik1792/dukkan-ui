"use client";

import { Field, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { DEMO_PASSWORD } from "@/lib/constants";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

function LoginForm() {
  const { login, isAuthenticated, user, state } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (state.hydrated && isAuthenticated && user) {
      router.replace(next || defaultHome(user.role));
    }
  }, [state.hydrated, isAuthenticated, user, next, router]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const found = login(email, password);
    if (!found) {
      setError("Email or password is incorrect.");
      return;
    }
    router.push(params.get("next") || defaultHome(found.role));
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-semibold">Login</h1>
      <p className="mt-2 text-sm text-stone-500">
        Use your Dukkan account. Demo password for seed users is{" "}
        <code className="rounded bg-white px-1">{DEMO_PASSWORD}</code>.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label="Email">
          <TextInput
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="priya@example.com"
          />
        </Field>
        <Field label="Password">
          <TextInput
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-lime">
          Login
        </button>
        <p className="text-center text-sm text-stone-500">
          Don&apos;t have an account?{" "}
          <Link
            href={`/signup${params.get("next") ? `?next=${params.get("next")}` : ""}`}
            className="font-medium text-ink underline"
          >
            Create account
          </Link>
        </p>
      </form>
      <p className="mt-6 text-xs text-stone-400">
        Buyer: priya@example.com · Seller: gupta@dukkan.shop · Admin: ops@dukkan.in
      </p>
    </div>
  );
}

function defaultHome(role?: string) {
  if (role === "seller") return "/seller";
  if (role === "admin") return "/admin";
  return "/";
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
