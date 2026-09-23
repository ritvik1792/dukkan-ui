"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { useApp } from "@/context/AppContext";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

const links = [
  { href: "/account", label: "Profile" },
  { href: "/account?tab=addresses", label: "Saved addresses" },
  { href: "/account?tab=payments", label: "Saved payment methods" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/bookings", label: "Bookings" },
  { href: "/account/service-requests", label: "Service requests" },
  { href: "/account/wishlist", label: "Saved" },
  { href: "/account/tickets", label: "Support" },
];

function linkActive(href: string, pathname: string, tab: string | null) {
  if (href === "/account") return pathname === "/account" && !tab;
  if (href.startsWith("/account?tab=")) {
    return pathname === "/account" && tab === href.slice("/account?tab=".length);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AccountLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, state } = useApp();
  const tab = searchParams.get("tab");

  if (!state.hydrated) {
    return <p className="p-8 text-sm text-stone-500">Loading…</p>;
  }

  if (!isAuthenticated || !user) {
    if (pathname === "/account") return children;
    return <RequireAuth>{children}</RequireAuth>;
  }

  return (
    <div className="page-shell py-8">
      <p className="text-xs uppercase tracking-wider text-stone-400">Account</p>
      <h1 className="text-2xl font-semibold">{user.name}</h1>
      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start">
        <aside className="w-full shrink-0 md:w-56">
          <nav className="rounded-2xl bg-white p-3">
            <ul className="space-y-1">
              {links.map((link) => {
                const active = linkActive(link.href, pathname, tab);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`block rounded-xl px-3 py-2 text-sm ${
                        active ? "bg-ink text-lime" : "hover:bg-stone-100"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  href={ROUTES.consoleDashboard}
                  className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-stone-100"
                >
                  Console
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
        <div className="min-h-[40rem] min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
