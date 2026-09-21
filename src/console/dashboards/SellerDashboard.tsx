"use client";

import { ShopOpsSettings } from "@/components/seller/ShopOpsSettings";
import { StatCard } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { formatInr } from "@/lib/format";
import { isShopOpenNow, shopHoursLabel } from "@/lib/shopOps";
import { sellerAnalytics } from "@/services/analytics";
import { sellerConsolePath, storefrontUrl } from "@/lib/routes";
import Link from "next/link";
import { useMemo } from "react";

export function SellerDashboard() {
  const { user, state, selectShop } = useApp();
  const stats = useMemo(() => {
    if (!user) {
      return { orderCount: 0, revenue: 0, skuCount: 0, demand: [], avgRating: 0, reviewCount: 0 };
    }
    const shopIds = new Set(
      state.shops
        .filter((s) => s.ownerUserId === user.id || user.role === "admin")
        .map((s) => s.id),
    );
    return sellerAnalytics({
      shopIds,
      listings: state.listings,
      orders: state.orders,
      reviews: state.reviews,
      catalog: state.catalog,
    });
  }, [user, state.shops, state.listings, state.orders, state.reviews, state.catalog]);
  if (!user) return null;
  const myShops = state.shops.filter(
    (s) => s.ownerUserId === user.id || s.id === user.shopId,
  );
  const application = state.applications.find((a) => a.userId === user.id);

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-semibold">Seller dashboard</h1>
      <p className="mt-1 text-sm text-stone-500">
        Demand, reviews, and catalogue health for your dukkan.
      </p>
      {application && application.status !== "approved" && (
        <Link
          href={sellerConsolePath("/application")}
          className="mt-4 block rounded-2xl bg-amber-50 p-4 text-sm text-amber-950"
        >
          Application is {application.status.replaceAll("_", " ")}. Track it here.
        </Link>
      )}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatInr(stats.revenue)} />
        <StatCard label="Orders" value={stats.orderCount} />
        <StatCard label="SKUs" value={stats.skuCount} />
        <StatCard
          label="Reviews"
          value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"}
          hint={`${stats.reviewCount} reviews`}
        />
      </div>
      <h2 className="mt-8 text-lg font-semibold">Products with demand</h2>
      <ul className="mt-3 space-y-2">
        {stats.demand.map((row) => (
          <li key={row.catalogProductId} className="flex justify-between rounded-xl bg-white px-4 py-3 text-sm">
            <span>{row.name}</span>
            <span className="font-semibold">{row.qty} sold</span>
          </li>
        ))}
        {stats.demand.length === 0 && (
          <p className="text-sm text-stone-500">No sales yet.</p>
        )}
      </ul>
      <div className="mt-8 space-y-6">
        {myShops.map((shop) => (
          <div key={shop.id} className="rounded-2xl bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{shop.name}</p>
                <p className="text-sm text-stone-500">
                  {shop.address} · {shop.status}
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  {isShopOpenNow(shop) ? "Open now" : "Closed now"} · {shopHoursLabel(shop)}
                </p>
              </div>
              <Link
                href={storefrontUrl(`/shop/${shop.id}`)}
                className="text-sm underline"
                onClick={() => selectShop(shop.id)}
              >
                Public dukkan page
              </Link>
            </div>
            <div className="mt-5 border-t border-stone-100 pt-5">
              <ShopOpsSettings shop={shop} compact />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
