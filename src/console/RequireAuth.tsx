"use client";

import { ConsoleLoginForm } from "@/console/LoginForm";
import { useApp } from "@/context/AppContext";
import { defaultConsolePath, isStaffRole, ROUTES } from "@/lib/routes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function RequireConsoleAuth({
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

  if (!isAuthenticated || !user || !isStaffRole(user.role)) {
    return (
      <ConsoleLoginForm
        next={pathname && pathname !== ROUTES.consoleLogin ? pathname : undefined}
        buyerBlocked={user?.role === "buyer"}
      />
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">This account cannot open this page</h1>
        <p className="mt-2 text-sm text-stone-500">You are signed in as {user.role}.</p>
        <Link href={defaultConsolePath(user.role)} className="mt-4 inline-block text-sm underline">
          Go to your console
        </Link>
      </div>
    );
  }

  return children;
}
