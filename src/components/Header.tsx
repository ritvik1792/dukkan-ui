"use client";

import { AccountMenu } from "@/components/AccountMenu";
import { CategoryList } from "@/components/CategoryNav";
import { LogoMark } from "@/components/LogoMark";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuthDialog } from "@/components/auth/AuthDialog";
import { LocationChip } from "@/components/location/LocationChip";
import { useApp } from "@/context/AppContext";
import { afterPaint } from "@/lib/drawer";
import { useMotionRouter } from "@/lib/motion";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export function Header() {
  const { user, cartCount, state } = useApp();
  const { openAuth } = useAuthDialog();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuShown, setMenuShown] = useState(false);
  const [menuRender, setMenuRender] = useState(false);
  const router = useMotionRouter();

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

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 overflow-visible border-b border-white/10 bg-ink text-white">
      <div className="page-shell flex items-center gap-3 py-3">
        <button
          type="button"
          aria-label="Open categories"
          onClick={() => setMenuOpen(true)}
          className="rounded-xl p-2 hover:bg-white/10"
        >
          <span className="block h-0.5 w-5 bg-white" />
          <span className="mt-1 block h-0.5 w-5 bg-white" />
          <span className="mt-1 block h-0.5 w-5 bg-white" />
        </button>

        <Link href="/" className="flex items-center gap-2">
          <LogoMark />
          <div className="leading-tight">
            <div className="text-lg font-bold tracking-tight">GreenOwl</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-lime">Near you</div>
          </div>
        </Link>

        <LocationChip className="hidden max-w-[220px] md:flex" />

        <form onSubmit={onSearch} className="hidden flex-1 md:block">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products, shops, services or people..."
            className="w-full rounded-xl border border-white/10 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-stone-400"
          />
        </form>

        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link
            href={ROUTES.consoleDashboard}
            className="hidden rounded-xl px-3 py-2 hover:bg-white/10 sm:block"
          >
            Console
          </Link>
          <NotificationBell />
          <Link
            href="/cart"
            className="relative rounded-xl bg-lime px-3 py-2 font-semibold text-ink"
          >
            Cart
            <span
              key={cartCount}
              aria-hidden={cartCount === 0}
              className={`cart-badge absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] text-ink ${
                cartCount === 0 ? "invisible" : ""
              }`}
            >
              {cartCount}
            </span>
          </Link>
          <AccountMenu />
        </nav>
      </div>

      <div className="page-shell flex gap-2 pb-3 md:hidden">
        <LocationChip className="max-w-[9.5rem] shrink-0 px-2 py-1.5" />
        <form onSubmit={onSearch} className="flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products, shops, services or people..."
            className="w-full rounded-xl bg-white px-3 py-2 text-sm text-ink"
          />
        </form>
      </div>

      {state.settings.showDemoRoleSwitcher && user && (
        <div className="bg-white/5 px-4 py-1 text-center text-[11px] text-white/60">
          Demo preview is on in admin settings
        </div>
      )}

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
            <div className="mt-6 space-y-2 border-t pt-4 text-sm">
              {user ? (
                <>
                  <Link href="/account" onClick={() => setMenuOpen(false)} className="block py-1">
                    Profile
                  </Link>
                  <Link href="/account/wishlist" onClick={() => setMenuOpen(false)} className="block py-1">
                    Saved
                  </Link>
                  <Link href="/account/orders" onClick={() => setMenuOpen(false)} className="block py-1">
                    Orders
                  </Link>
                  <Link href="/account/bookings" onClick={() => setMenuOpen(false)} className="block py-1">
                    Bookings
                  </Link>
                  <Link href="/account/service-requests" onClick={() => setMenuOpen(false)} className="block py-1">
                    Service requests
                  </Link>
                  <Link href="/account/tickets" onClick={() => setMenuOpen(false)} className="block py-1">
                    Support
                  </Link>
                  <Link
                    href={ROUTES.consoleDashboard}
                    onClick={() => setMenuOpen(false)}
                    className="block py-1"
                  >
                    Console
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      openAuth();
                    }}
                    className="block py-1"
                  >
                    Sign in
                  </button>
                  <Link
                    href={ROUTES.consoleDashboard}
                    onClick={() => setMenuOpen(false)}
                    className="block py-1"
                  >
                    Console
                  </Link>
                </>
              )}
              <Link href="/sell" onClick={() => setMenuOpen(false)} className="block py-1">
                Sell on GreenOwl
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
