"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const links = [
  { href: "/account", label: "Settings" },
  { href: "/account/orders", label: "Orders" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/account/tickets", label: "Support" },
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, state } = useApp();

  if (!state.hydrated) {
    return <p className="p-8 text-sm text-stone-500">Loading…</p>;
  }

  if (!isAuthenticated || !user) {
    if (pathname === "/account") return children;
    return <RequireAuth>{children}</RequireAuth>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-xs uppercase tracking-wider text-stone-400">Account</p>
      <h1 className="text-2xl font-semibold">{user.name}</h1>
      <div className="mt-4 mb-6 flex gap-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-full px-4 py-2 text-sm ${
              pathname === l.href ? "bg-ink text-lime" : "bg-white"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
