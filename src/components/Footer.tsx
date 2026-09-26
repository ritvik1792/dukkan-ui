"use client";

import { useAuthDialog } from "@/components/auth/AuthDialog";
import { useApp } from "@/context/AppContext";
import { BRAND } from "@/lib/constants";
import { isStaffRole, ROUTES } from "@/lib/routes";
import Link from "next/link";

export function Footer() {
  const { isAuthenticated, user } = useApp();
  const { openAuth } = useAuthDialog();
  return (
    <footer className="site-footer mt-auto border-t border-border bg-cream">
      <div className="page-shell grid gap-8 py-10 text-sm text-muted md:grid-cols-3">
        <div>
          <p className="text-base font-semibold text-ink">{BRAND.name}</p>
          <p className="mt-2 max-w-xs">
            Local discovery for products, shops, services, and people — plus booking and
            delivery when you need it. Change how far to look in{" "}
            <Link href="/account" className="underline">
              Profile
            </Link>
            .
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
            {isStaffRole(user?.role) && (
              <li>
                <Link href={ROUTES.consoleDashboard} className="hover:text-ink">
                  Provider console
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </footer>
  );
}
