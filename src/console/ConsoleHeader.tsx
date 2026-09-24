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
      <div className="page-shell flex min-w-0 items-center gap-2 py-3 sm:gap-3">
        <Link href={home} className="flex min-w-0 shrink items-center gap-2">
          <LogoMark />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-base font-bold tracking-tight sm:text-lg">{BRAND.name}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-rose-gold">Console</div>
          </div>
        </Link>

        <nav className="ml-auto flex max-w-full items-center gap-0.5 overflow-x-auto text-sm sm:gap-2">
          {user?.role === "admin" && (
            <>
              <Link href={adminConsolePath()} className="shrink-0 rounded-xl px-2.5 py-2 hover:bg-white/10 sm:px-3">
                Admin
              </Link>
              <Link href={sellerConsolePath()} className="shrink-0 rounded-xl px-2.5 py-2 hover:bg-white/10 sm:px-3">
                Seller
              </Link>
            </>
          )}
          <NotificationBell />
          {isAuthenticated && user && (
            <>
              <span className="hidden truncate text-white/80 sm:inline">{user.name}</span>
              <button
                type="button"
                onClick={() => logout()}
                className="shrink-0 rounded-xl px-2.5 py-2 hover:bg-white/10 sm:px-3"
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
