"use client";

import { StatCard } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { formatInr } from "@/lib/format";
import { adminAnalytics } from "@/services/analytics";
import { useMemo } from "react";

export default function AdminHome() {
  const { state } = useApp();
  const stats = useMemo(
    () =>
      adminAnalytics({
        shops: state.shops,
        listings: state.listings,
        orders: state.orders,
        reviews: state.reviews,
        catalog: state.catalog,
      }),
    [state],
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold">Platform analytics</h1>
      <p className="mt-1 text-sm text-stone-500">
        Products, buying locations, and dukkan performance.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Active dukkans" value={stats.shops.length} />
        <StatCard label="Listings" value={stats.listingCount} />
        <StatCard label="Reviews" value={stats.reviewCount} />
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="font-semibold">Dukkans performing</h2>
          <ul className="mt-3 space-y-2">
            {stats.shops.map((row) => (
              <li key={row.shop.id} className="flex justify-between rounded-xl bg-white px-4 py-3 text-sm">
                <span>{row.shop.name}</span>
                <span>
                  {formatInr(row.revenue)} · {row.orders} orders
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-semibold">Products bought most</h2>
          <ul className="mt-3 space-y-2">
            {stats.topProducts.map((p) => (
              <li key={p.id} className="flex justify-between rounded-xl bg-white px-4 py-3 text-sm">
                <span>{p.name}</span>
                <span>{p.qty}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="mt-8">
        <h2 className="font-semibold">Places buying most</h2>
        <ul className="mt-3 space-y-2">
          {stats.places.map((p) => (
            <li key={p.place} className="flex justify-between rounded-xl bg-white px-4 py-3 text-sm">
              <span>{p.place}</span>
              <span>{formatInr(p.spend)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
