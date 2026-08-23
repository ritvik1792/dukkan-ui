"use client";

import { DELIVERY_RADIUS_KM } from "@/lib/constants";
import { useApp } from "@/context/AppContext";

export default function AdminHome() {
  const { state } = useApp();
  const pendingShops = state.shops.filter((s) => s.status === "pending").length;
  const pendingProducts = state.products.filter((p) => p.status === "pending").length;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Admin control</h1>
      <p className="mt-1 text-sm text-stone-500">
        Moderate sellers and SKUs. Discovery radius is currently{" "}
        <code className="rounded bg-white px-1">{DELIVERY_RADIUS_KM} km</code> in{" "}
        <code className="rounded bg-white px-1">src/lib/constants.ts</code>.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Tile label="Shops" value={state.shops.length} />
        <Tile label="Pending shops" value={pendingShops} />
        <Tile label="Products" value={state.products.length} />
        <Tile label="Pending SKUs" value={pendingProducts} />
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
