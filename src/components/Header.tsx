"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useApp } from "@/context/AppContext";
import { DELIVERY_RADIUS_KM } from "@/lib/constants";
import { neighborhoods } from "@/lib/mock-data";
import { LogoMark } from "./LogoMark";

export function Header() {
  const { user, neighborhood, cartCount, dispatch, switchRole } = useApp();
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark />
            <div className="leading-tight">
              <div className="text-lg font-bold tracking-tight">Dukkan</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-lime">
                Near you
              </div>
            </div>
          </Link>

          <label className="ml-2 hidden min-w-0 flex-1 md:block">
            <span className="sr-only">Delivery location</span>
            <select
              value={neighborhood.id}
              onChange={(e) =>
                dispatch({ type: "setNeighborhood", neighborhoodId: e.target.value })
              }
              className="w-full max-w-xs rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm"
            >
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.id} className="text-ink">
                  {n.name}, {n.area} · {DELIVERY_RADIUS_KM} km
                </option>
              ))}
            </select>
          </label>

          <form onSubmit={onSearch} className="hidden flex-[1.4] md:block">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search atta, milk, bolts, shops…"
              className="w-full rounded-xl border border-white/10 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-stone-400"
            />
          </form>

          <nav className="ml-auto flex items-center gap-2 text-sm">
            {user.role === "seller" && (
              <Link
                href="/seller"
                className={`rounded-xl px-3 py-2 ${pathname.startsWith("/seller") ? "bg-white/15" : "hover:bg-white/10"}`}
              >
                Seller
              </Link>
            )}
            {user.role === "admin" && (
              <Link
                href="/admin"
                className={`rounded-xl px-3 py-2 ${pathname.startsWith("/admin") ? "bg-white/15" : "hover:bg-white/10"}`}
              >
                Admin
              </Link>
            )}
            <Link href="/orders" className="hidden rounded-xl px-3 py-2 hover:bg-white/10 sm:block">
              Orders
            </Link>
            <Link
              href="/cart"
              className="relative rounded-xl bg-lime px-3 py-2 font-semibold text-ink"
            >
              Cart
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] text-ink">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link href="/login" className="hidden rounded-xl px-3 py-2 hover:bg-white/10 sm:block">
              {user.name.split(" ")[0]}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:hidden">
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

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/70">
          <p>
            Showing shops within <span className="text-lime">{DELIVERY_RADIUS_KM} km</span> of{" "}
            {neighborhood.name}
          </p>
          <div className="flex items-center gap-1">
            <span className="mr-1">Demo role:</span>
            {(["buyer", "seller", "admin"] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => switchRole(role)}
                className={`rounded-full px-2 py-0.5 capitalize ${
                  user.role === role ? "bg-lime text-ink" : "bg-white/10"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
