"use client";

import { useAuthDialog } from "@/components/auth/AuthDialog";
import { useApp } from "@/context/AppContext";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";

export function RequireAuth({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Array<"buyer" | "seller" | "admin">;
}) {
  const { user, isAuthenticated, state } = useApp();
  const { openAuth } = useAuthDialog();

  useEffect(() => {
    if (!state.hydrated) return;
    if (!isAuthenticated) openAuth();
  }, [state.hydrated, isAuthenticated, openAuth]);

  if (!state.hydrated) {
    return <p className="p-8 text-sm text-stone-500">Loading…</p>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Sign in to continue</h1>
        <p className="mt-2 text-sm text-stone-500">
          Sign in, or{" "}
          <Link href={ROUTES.signup} className="underline">
            create an account
          </Link>{" "}
          and pick shop categories and services on the same form.
        </p>
        <button
          type="button"
          onClick={() => openAuth()}
          className="mt-6 rounded-full bg-carrot px-5 py-2 text-sm text-white hover:opacity-90"
        >
          Sign in with phone
        </button>
      </div>
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">This account cannot open this page</h1>
        <p className="mt-2 text-sm text-stone-500">
          You are signed in as {user.role}. Use an account with the right role.
        </p>
        <Link href="/account" className="mt-4 inline-block text-sm underline">
          Go to account
        </Link>
      </div>
    );
  }

  return children;
}
