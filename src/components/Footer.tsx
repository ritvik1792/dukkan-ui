"use client";

import { useAuthDialog } from "@/components/auth/AuthDialog";
import { useApp } from "@/context/AppContext";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";

export function Footer() {
  const { state, isAuthenticated } = useApp();
  const { openAuth } = useAuthDialog();
  return (
    <footer className="site-footer mt-auto border-t border-stone-200 bg-white">
      <div className="page-shell grid gap-8 py-10 text-sm text-stone-600 md:grid-cols-4">
        <div>
          <p className="text-base font-semibold text-ink">pinkCarrot</p>
          <p className="mt-2 max-w-xs">
            Local discovery for products, shops, services, and people — plus booking and
            delivery when you need it. Change how far to look in{" "}
            <Link href="/account" className="underline">
              Profile
            </Link>{" "}
            (ops default {state.settings.deliveryRadiusKm} km).
          </p>
        </div>
        <div>
          <p className="font-semibold text-ink">Buyers</p>
          <ul className="mt-2 space-y-1">
            <li>
              <Link href="/search" className="hover:text-ink">
                Search products
              </Link>
            </li>
            <li>
              <Link href="/account/wishlist" className="hover:text-ink">
                Wishlist
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:text-ink">
                Profile
              </Link>
            </li>
            <li>
              <Link href="/account/orders" className="hover:text-ink">
                Orders
              </Link>
            </li>
            {!isAuthenticated && (
              <li>
                <button type="button" onClick={() => openAuth()} className="hover:text-ink">
                  Sign in
                </button>
              </li>
            )}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-ink">Sellers</p>
          <ul className="mt-2 space-y-1">
            <li>
              <Link href="/sell" className="hover:text-ink">
                Join as a provider
              </Link>
            </li>
            <li>
              <Link href={ROUTES.consoleDashboard} className="hover:text-ink">
                Provider console
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-ink">API</p>
          <p className="mt-2">
            {state.apiStatus === "online" && (
              <>
                Connected to Spring Boot / Postgres
                {state.apiShopCount != null ? ` · ${state.apiShopCount} shops` : ""}.
              </>
            )}
            {state.apiStatus === "offline" &&
              "API offline — showing local catalogue until the backend is reachable."}
            {state.apiStatus === "connecting" && "Connecting to the API…"}
          </p>
        </div>
      </div>
    </footer>
  );
}
