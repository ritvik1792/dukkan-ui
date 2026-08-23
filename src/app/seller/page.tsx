"use client";

import Link from "next/link";
import { useApp } from "@/context/AppContext";

export default function SellerHome() {
  const { user, state } = useApp();
  const myShops = state.shops.filter(
    (s) => s.ownerUserId === user.id || user.role === "admin",
  );
  const shopIds = new Set(myShops.map((s) => s.id));
  const myProducts = state.products.filter((p) => shopIds.has(p.shopId));
  const myOrders = state.orders.filter((o) => shopIds.has(o.shopId));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Seller overview</h1>
      <p className="mt-1 text-sm text-stone-500">
        Catalogue, delivery modes, and orders for your dukkan.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card label="Shops" value={myShops.length} />
        <Card label="SKUs" value={myProducts.length} />
        <Card label="Orders" value={myOrders.length} />
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {myShops.map((shop) => (
          <div key={shop.id} className="rounded-2xl bg-white p-5">
            <p className="font-semibold">{shop.name}</p>
            <p className="text-sm text-stone-500">{shop.address}</p>
            <p className="mt-2 text-xs uppercase text-stone-400">{shop.status}</p>
            <Link href={`/shop/${shop.id}`} className="mt-3 inline-block text-sm underline">
              View public page
            </Link>
          </div>
        ))}
      </div>
      <Link
        href="/seller/products/new"
        className="mt-8 inline-block rounded-full bg-ink px-5 py-2 text-sm font-semibold text-lime"
      >
        Upload a product
      </Link>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
