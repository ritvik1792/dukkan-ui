"use client";

import { useApp } from "@/context/AppContext";

export default function AdminSellers() {
  const { state, dispatch } = useApp();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Sellers / dukkans</h1>
      <div className="mt-6 space-y-3">
        {state.shops.map((shop) => (
          <div
            key={shop.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4"
          >
            <div>
              <p className="font-semibold">{shop.name}</p>
              <p className="text-xs text-stone-500">
                {shop.address} · {shop.status} · {shop.deliveryModes.join(", ")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  dispatch({ type: "setShopStatus", shopId: shop.id, status: "active" })
                }
                className="rounded-full bg-ink px-3 py-1 text-xs text-lime"
              >
                Activate
              </button>
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "setShopStatus",
                    shopId: shop.id,
                    status: "suspended",
                  })
                }
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
