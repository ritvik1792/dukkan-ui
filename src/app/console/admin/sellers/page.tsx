"use client";

import { ShopNameButton, useShopPeek } from "@/components/shops/ShopPeek";
import { StatusPill } from "@/components/ui/StatCard";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { mapShop, patchShopRequest } from "@/lib/api";
import { titleCase } from "@/lib/format";
import type { Shop, ShopStatus } from "@/lib/types";

type CapabilityKey =
  | "servicesAllowed"
  | "quickDeliveryAllowed"
  | "productsAllowed"
  | "bookingsAllowed"
  | "serviceRequestsAllowed"
  | "ordersAllowed";

const CAP_TOGGLES: { key: CapabilityKey; label: string }[] = [
  { key: "servicesAllowed", label: "Services" },
  { key: "bookingsAllowed", label: "Bookings" },
  { key: "serviceRequestsAllowed", label: "Service requests" },
  { key: "productsAllowed", label: "Products" },
  { key: "ordersAllowed", label: "Orders" },
  { key: "quickDeliveryAllowed", label: "Quick delivery" },
];

export default function AdminSellers() {
  const { state, dispatch } = useApp();
  const { showAlert } = useAlert();
  const peek = useShopPeek();

  async function patch(shop: Shop, input: Parameters<typeof patchShopRequest>[1]) {
    try {
      const raw = await patchShopRequest(shop.id, input);
      const mapped = mapShop(raw);
      dispatch({ type: "upsertShop", shop: mapped });
      showAlert({ tone: "success", title: `${shop.name} updated` });
    } catch (err) {
      showAlert({
        tone: "error",
        title: err instanceof Error ? err.message : "Update failed",
      });
    }
  }

  function toggle(shop: Shop, key: CapabilityKey) {
    const current = Boolean(shop[key]);
    patch(shop, { [key]: !current });
  }

  function setStatus(shop: Shop, status: ShopStatus) {
    patch(shop, { status });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Providers & shops</h1>
      <p className="mt-1 text-sm text-stone-500">
        Enable capabilities per provider. Join requests still create pending profiles first.
      </p>
      <div className="mt-6 space-y-4">
        {state.shops.map((shop) => (
          <div
            key={shop.id}
            className="rounded-2xl bg-white p-4"
            onClick={() => peek?.openShop(shop.id)}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <ShopNameButton shopId={shop.id} className="font-semibold underline decoration-stone-300 hover:decoration-ink">
                  {shop.name}
                </ShopNameButton>
                <p className="text-xs text-stone-500">{shop.address}</p>
                {shop.profession && (
                  <p className="text-xs text-stone-500">{shop.profession}</p>
                )}
              </div>
              <StatusPill>{titleCase(shop.status)}</StatusPill>
            </div>
            <div
              className="mt-4 flex flex-wrap gap-2"
              onClick={(event) => event.stopPropagation()}
            >
              {CAP_TOGGLES.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(shop[key])}
                    onChange={() => toggle(shop, key)}
                  />
                  {label}
                </label>
              ))}
            </div>
            <div
              className="mt-3 flex flex-wrap gap-2"
              onClick={(event) => event.stopPropagation()}
            >
              {(["pending", "active", "suspended"] as ShopStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatus(shop, status)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    shop.status === status ? "bg-carrot text-white" : "border"
                  }`}
                >
                  {titleCase(status)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
