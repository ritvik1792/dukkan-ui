"use client";

import { LogoMark } from "@/components/LogoMark";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useApp } from "@/context/AppContext";
import { BRAND } from "@/lib/constants";
import { adminConsolePath, isStaffRole, ROUTES, sellerConsolePath } from "@/lib/routes";
import Link from "next/link";

export function ConsoleHeader() {
  const { user, isAuthenticated, logout } = useApp();
  const home = isStaffRole(user?.role) ? ROUTES.consoleDashboard : ROUTES.consoleLogin;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink text-white">
      <div className="page-shell flex items-center gap-3 py-3">
        <Link href={home} className="flex items-center gap-2">
          <LogoMark />
          <div className="leading-tight">
            <div className="text-lg font-bold tracking-tight">{BRAND.name}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-lime">Console</div>
          </div>
        </Link>

        <nav className="ml-auto flex items-center gap-2 text-sm">
          {user?.role === "admin" && (
            <>
              <Link href={adminConsolePath()} className="rounded-xl px-3 py-2 hover:bg-white/10">
                Admin
              </Link>
              <Link href={sellerConsolePath()} className="rounded-xl px-3 py-2 hover:bg-white/10">
                Seller
              </Link>
            </>
          )}
          <NotificationBell />
          {isAuthenticated && user && (
            <>
              <span className="hidden text-white/80 sm:inline">{user.name}</span>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-xl px-3 py-2 hover:bg-white/10"
              >
                Sign out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
