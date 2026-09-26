"use client";

import { AccountMenu } from "@/components/AccountMenu";
import { CategoryList } from "@/components/CategoryNav";
import { LogoMark } from "@/components/LogoMark";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuthDialog } from "@/components/auth/AuthDialog";
import { LocationChip } from "@/components/location/LocationChip";
import { SearchSuggest } from "@/components/search/SearchSuggest";
import { useApp } from "@/context/AppContext";
import { useIsHydrated } from "@/lib/hydration";
import { afterPaint } from "@/lib/drawer";
import { BRAND } from "@/lib/constants";
import { isStaffRole, ROUTES } from "@/lib/routes";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Header() {
  const { user, cartCount } = useApp();
  const { openAuth } = useAuthDialog();
  const isHydrated = useIsHydrated();
  const displayCartCount = isHydrated ? cartCount : 0;
  const displayUser = isHydrated ? user : null;
  const showConsole = isHydrated && isStaffRole(displayUser?.role);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuShown, setMenuShown] = useState(false);
  const [menuRender, setMenuRender] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      setMenuRender(true);
      const cancel = afterPaint(() => setMenuShown(true));
      return cancel;
    }
    setMenuShown(false);
    const timeout = window.setTimeout(() => setMenuRender(false), 280);
    return () => window.clearTimeout(timeout);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 overflow-visible border-b border-white/10 bg-ink text-white">
      <div className="page-shell flex min-w-0 items-center gap-2 py-3 sm:gap-3">
        <button
          type="button"
          aria-label="Open categories"
          onClick={() => setMenuOpen(true)}
          className="shrink-0 rounded-xl p-2.5 hover:bg-white/10"
        >
          <span className="block h-0.5 w-5 bg-white" />
          <span className="mt-1 block h-0.5 w-5 bg-white" />
          <span className="mt-1 block h-0.5 w-5 bg-white" />
        </button>

        <Link href="/" className="flex min-w-0 shrink items-center gap-2">
          <LogoMark />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-base font-bold tracking-tight sm:text-lg">{BRAND.name}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-rose-gold">Near you</div>
          </div>
        </Link>

        <SearchSuggest
          variant="header"
          className="hidden min-w-0 flex-1 md:block"
          onNavigated={() => setMenuOpen(false)}
        />

        <LocationChip className="hidden max-w-sm shrink md:block" />

        <nav className="ml-auto flex shrink-0 items-center gap-0.5 text-sm sm:gap-1">
          {showConsole && (
            <Link
              href={ROUTES.consoleDashboard}
              className="hidden rounded-xl px-3 py-2 hover:bg-white/10 sm:block"
            >
              Console
            </Link>
          )}
          <NotificationBell />
          <Link
            href="/cart"
            className="relative rounded-xl bg-carrot px-2.5 py-2 font-semibold text-white shadow-sm ring-1 ring-white/10 hover:brightness-105 sm:px-3"
          >
            Cart
            <span
              key={displayCartCount}
              aria-hidden={displayCartCount === 0}
              className={`cart-badge absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] text-ink ${
                displayCartCount === 0 ? "invisible" : ""
              }`}
            >
              {displayCartCount}
            </span>
          </Link>
          <AccountMenu />
        </nav>
      </div>

      <div className="page-shell space-y-2 pb-3 md:hidden">
        <LocationChip className="w-full" />
        <SearchSuggest
          variant="header"
          className="min-w-0"
          onNavigated={() => setMenuOpen(false)}
        />
      </div>

      {menuRender && (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            className={`drawer-scrim flex-1 bg-black/40 ${menuShown ? "opacity-100" : "opacity-0"}`}
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className={`drawer-panel absolute left-0 top-0 h-full w-72 overflow-y-auto bg-white p-4 text-ink shadow-xl ${
              menuShown ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold">Categories</p>
              <button type="button" onClick={() => setMenuOpen(false)} className="text-sm">
                Close
              </button>
            </div>
            <CategoryList onSelect={() => setMenuOpen(false)} />
            <div className="mt-6 space-y-1 border-t pt-4 text-sm">
              {user ? (
                <>
                  <Link href="/account" onClick={() => setMenuOpen(false)} className="block rounded-lg px-1 py-2.5">
                    Profile
                  </Link>
                  <Link href="/account/wishlist" onClick={() => setMenuOpen(false)} className="block rounded-lg px-1 py-2.5">
                    Saved
                  </Link>
                  <Link href="/account/orders" onClick={() => setMenuOpen(false)} className="block rounded-lg px-1 py-2.5">
                    Orders
                  </Link>
                  <Link href="/account/bookings" onClick={() => setMenuOpen(false)} className="block rounded-lg px-1 py-2.5">
                    Bookings
                  </Link>
                  <Link href="/account/service-requests" onClick={() => setMenuOpen(false)} className="block rounded-lg px-1 py-2.5">
                    Service requests
                  </Link>
                  <Link href="/account/tickets" onClick={() => setMenuOpen(false)} className="block rounded-lg px-1 py-2.5">
                    Support
                  </Link>
                  {showConsole && (
                    <Link
                      href={ROUTES.consoleDashboard}
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg px-1 py-2.5"
                    >
                      Console
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      openAuth();
                    }}
                    className="block w-full rounded-lg px-1 py-2.5 text-left"
                  >
                    Sign in
                  </button>
                </>
              )}
              <Link href="/sell" onClick={() => setMenuOpen(false)} className="block rounded-lg px-1 py-2.5">
                Sell on Pink Carrot
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
