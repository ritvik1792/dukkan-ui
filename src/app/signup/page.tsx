"use client";

import { Field, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { createId } from "@/lib/ids";
import {
  createBuyerUser,
  findUserByEmail,
  validateBuyerProfile,
  validatePassword,
} from "@/services/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

function SignupForm() {
  const { state, dispatch, isAuthenticated, user } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (state.hydrated && isAuthenticated && user) {
      router.replace(next);
    }
  }, [state.hydrated, isAuthenticated, user, next, router]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const profileError = validateBuyerProfile({ name, dob, email, phone, pinCode });
    if (profileError) {
      setError(profileError);
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (findUserByEmail(state.users, email)) {
      setError("That email already has an account. Login instead.");
      return;
    }
    const id = createId("u");
    const created = createBuyerUser({
      id,
      name,
      dob,
      email,
      phone,
      pinCode,
      password,
    });
    dispatch({ type: "upsertUser", user: created });
    dispatch({ type: "login", userId: id });
    router.push(next);
  }

  const nextQuery = params.get("next") ? `?next=${params.get("next")}` : "";

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-semibold">Create an account</h1>
      <p className="mt-2 text-sm text-stone-500">
        New accounts start as buyers. You can apply to open a dukkan after login.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label="Name">
          <TextInput
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Date of birth">
          <TextInput
            required
            type="date"
            autoComplete="bday"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </Field>
        <Field label="Email">
          <TextInput
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Phone number">
          <TextInput
            required
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile"
          />
        </Field>
        <Field label="PIN code">
          <TextInput
            required
            inputMode="numeric"
            maxLength={6}
            autoComplete="postal-code"
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value)}
            placeholder="6 digits"
          />
        </Field>
        <Field label="Password">
          <TextInput
            required
            type="password"
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-lime">
          Create account
        </button>
        <p className="text-center text-sm text-stone-500">
          Already have an account?{" "}
          <Link href={`/login${nextQuery}`} className="font-medium text-ink underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Loading…</p>}>
      <SignupForm />
    </Suspense>
  );
}
