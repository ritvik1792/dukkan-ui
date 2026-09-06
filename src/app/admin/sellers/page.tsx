"use client";

import { StatusPill } from "@/components/ui/StatCard";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { titleCase } from "@/lib/format";

export default function AdminSellers() {
  const { state, dispatch } = useApp();
  const { showAlert } = useAlert();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dukkans</h1>
      <p className="mt-1 text-sm text-stone-500">
        Activate or suspend a shop. New sellers still come through Join requests first.
      </p>
      <div className="mt-6 space-y-3">
        {state.shops.map((shop) => (
          <div
            key={shop.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4"
          >
            <div>
              <p className="font-semibold">{shop.name}</p>
              <p className="text-xs text-stone-500">{shop.address}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill>{titleCase(shop.status)}</StatusPill>
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: "setShopStatus", shopId: shop.id, status: "active" });
                  showAlert({ tone: "success", title: `${shop.name} is active` });
                }}
                className="rounded-full bg-ink px-3 py-1 text-xs text-lime"
              >
                Activate
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: "setShopStatus", shopId: shop.id, status: "suspended" });
                  showAlert({ tone: "info", title: `${shop.name} suspended` });
                }}
                className="rounded-full border px-3 py-1 text-xs"
              >
                Suspend
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
