"use client";

import { ShopNameButton, useShopPeek } from "@/components/shops/ShopPeek";
import { StatusPill } from "@/components/ui/StatCard";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { titleCase } from "@/lib/format";

export default function AdminSellers() {
  const { state, dispatch } = useApp();
  const { showAlert } = useAlert();
  const peek = useShopPeek();

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
            className="flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 transition-colors duration-150 hover:bg-stone-50"
            onClick={() => peek?.openShop(shop.id)}
          >
            <div>
              <ShopNameButton shopId={shop.id} className="font-semibold underline decoration-stone-300 hover:decoration-ink">
                {shop.name}
              </ShopNameButton>
              <p className="text-xs text-stone-500">{shop.address}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2" onClick={(event) => event.stopPropagation()}>
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
