"use client";

import { useApp } from "@/context/AppContext";
import Link from "next/link";

export function Footer() {
  const { state } = useApp();
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white">
      <div className="page-shell grid gap-8 py-10 text-sm text-stone-600 md:grid-cols-4">
        <div>
          <p className="text-base font-semibold text-ink">Dukkan</p>
          <p className="mt-2 max-w-xs">
            Nearby shops like IndiaMART, product pages like Amazon, and quick delivery like
            Zepto. Change how far to look in{" "}
            <Link href="/account" className="underline">
              Settings
            </Link>{" "}
            (ops default {state.settings.deliveryRadiusKm} km).
          </p>
        </div>
        <div>
          <p className="font-semibold text-ink">Buyers</p>
          <ul className="mt-2 space-y-1">
            <li>
              <Link href="/search">Search products</Link>
            </li>
            <li>
              <Link href="/wishlist">Wishlist</Link>
            </li>
            <li>
              <Link href="/account">Settings</Link>
            </li>
            <li>
              <Link href="/account/orders">Orders</Link>
            </li>
            <li>
              <Link href="/login">Login</Link>
            </li>
            <li>
              <Link href="/signup">Sign up</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-ink">Sellers</p>
          <ul className="mt-2 space-y-1">
            <li>
              <Link href="/sell">Join as a dukkan</Link>
            </li>
            <li>
              <Link href="/seller">Seller hub</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-ink">Backend later</p>
          <p className="mt-2">
            Spring Boot APIs will persist catalogue, reviews, tickets, and orders. This build
            uses the same service shapes on mock data.
          </p>
        </div>
      </div>
    </footer>
  );
}
