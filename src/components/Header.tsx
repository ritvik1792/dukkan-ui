"use client";

import { AccountMenu } from "@/components/AccountMenu";
import { CategoryList } from "@/components/CategoryNav";
import { LogoMark } from "@/components/LogoMark";
import { useAuthDialog } from "@/components/auth/AuthDialog";
import { useApp } from "@/context/AppContext";
import { neighborhoods } from "@/data/seed";
import { useMotionRouter } from "@/lib/motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export function Header() {
  const { user, neighborhood, cartCount, dispatch, state } = useApp();
  const { openAuth } = useAuthDialog();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuShown, setMenuShown] = useState(false);
  const [menuRender, setMenuRender] = useState(false);
  const router = useMotionRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (menuOpen) {
      setMenuRender(true);
      const id = requestAnimationFrame(() => setMenuShown(true));
      return () => cancelAnimationFrame(id);
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
            <div className="text-lg font-bold tracking-tight">Dukkan</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-lime">Near you</div>
          </div>
        </Link>

        <label className="hidden min-w-0 md:block">
          <span className="sr-only">Delivery location</span>
          <select
            value={neighborhood.id}
            onChange={(e) =>
              dispatch({ type: "setNeighborhood", neighborhoodId: e.target.value })
            }
            className="max-w-[220px] rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm"
          >
            {neighborhoods.map((n) => (
              <option key={n.id} value={n.id} className="text-ink">
                {n.name}, {n.area}
              </option>
            ))}
          </select>
        </label>

        <form onSubmit={onSearch} className="hidden flex-1 md:block">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            className="w-full rounded-xl border border-white/10 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-stone-400"
          />
        </form>

        <nav className="ml-auto flex items-center gap-1 text-sm">
          {user?.role === "seller" && (
            <Link
              href="/seller"
              className={`hidden rounded-xl px-3 py-2 sm:block ${pathname.startsWith("/seller") ? "bg-white/15" : "hover:bg-white/10"}`}
            >
              Seller
            </Link>
          )}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className={`hidden rounded-xl px-3 py-2 sm:block ${pathname.startsWith("/admin") ? "bg-white/15" : "hover:bg-white/10"}`}
            >
              Admin
            </Link>
          )}
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
        <select
          value={neighborhood.id}
          onChange={(e) =>
            dispatch({ type: "setNeighborhood", neighborhoodId: e.target.value })
          }
          className="rounded-xl border border-white/15 bg-white/10 px-2 py-2 text-xs"
        >
          {neighborhoods.map((n) => (
            <option key={n.id} value={n.id} className="text-ink">
              {n.name}
            </option>
          ))}
        </select>
        <form onSubmit={onSearch} className="flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
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
                  <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="block py-1">
                    Wishlist
                  </Link>
                  <Link href="/account/orders" onClick={() => setMenuOpen(false)} className="block py-1">
                    Orders
                  </Link>
                  <Link href="/account/tickets" onClick={() => setMenuOpen(false)} className="block py-1">
                    Support
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/account" onClick={() => setMenuOpen(false)} className="block py-1">
                    Profile
                  </Link>
                  <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="block py-1">
                    Wishlist
                  </Link>
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
                </>
              )}
              <Link href="/sell" onClick={() => setMenuOpen(false)} className="block py-1">
                Sell on Dukkan
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
