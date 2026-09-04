"use client";

import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function RequireAuth({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Array<"buyer" | "seller" | "admin">;
}) {
  const { user, isAuthenticated, state } = useApp();
  const pathname = usePathname();

  if (!state.hydrated) {
    return <p className="p-8 text-sm text-stone-500">Loading…</p>;
  }

  if (!isAuthenticated || !user) {
    const next = encodeURIComponent(pathname);
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Login required</h1>
        <p className="mt-2 text-sm text-stone-500">
          Sign in to open this page. New here? Create an account.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href={`/login?next=${next}`}
            className="rounded-full bg-ink px-5 py-2 text-sm text-lime"
          >
            Login
          </Link>
          <Link href={`/signup?next=${next}`} className="rounded-full border px-5 py-2 text-sm">
            Sign up
          </Link>
        </div>
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
