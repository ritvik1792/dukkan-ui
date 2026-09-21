"use client";

import { ShopOpsSettings } from "@/components/seller/ShopOpsSettings";
import { Field, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { mapShop, patchShopRequest } from "@/lib/api";
import type { Shop } from "@/lib/types";

export default function SellerSettingsPage() {
  const { user, state, dispatch } = useApp();
  if (!user) return null;
  const shop =
    state.shops.find((s) => s.id === user.shopId) ??
    state.shops.find((s) => s.ownerUserId === user.id);

  if (!shop) return <p>No shop profile.</p>;

  function persist(next: Shop) {
    dispatch({ type: "upsertShop", shop: next });
    void patchShopRequest(next.id, {
      partnerDeliveryEnabled: next.partnerDeliveryEnabled,
      shopDeliveryEnabled: next.shopDeliveryEnabled,
      partnerDeliveryFee: next.partnerDeliveryFee,
      shopDeliveryFee: next.shopDeliveryFee,
      minOrderAmount: next.minOrderAmount,
      isOpen: next.isOpen,
      openTime: next.openTime,
      closeTime: next.closeTime,
    })
      .then((raw) => dispatch({ type: "upsertShop", shop: mapShop(raw) }))
      .catch(() => undefined);
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Shop settings</h1>
        <p className="mt-1 text-sm text-stone-500">
          Hours, open/closed, alerts, and delivery fees for {shop.name}.
        </p>
      </div>

      <ShopOpsSettings shop={shop} />

      <section className="rounded-2xl bg-white p-5">
        <h2 className="font-semibold">Delivery fees</h2>
        <p className="text-sm text-stone-500">
          Choose whether Dukkan partners deliver, your shop delivers, fees, and minimum order.
        </p>
        <div className="mt-4 space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={shop.partnerDeliveryEnabled}
              onChange={(e) => persist({ ...shop, partnerDeliveryEnabled: e.target.checked })}
            />
            Delivery by Dukkan partner
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={shop.shopDeliveryEnabled}
              onChange={(e) => persist({ ...shop, shopDeliveryEnabled: e.target.checked })}
            />
            Delivery by this dukkan
          </label>
          <Field label="Partner delivery fee ₹">
            <TextInput
              type="number"
              value={shop.partnerDeliveryFee}
              onBlur={(e) => persist({ ...shop, partnerDeliveryFee: Number(e.target.value) })}
              onChange={(e) =>
                dispatch({
                  type: "upsertShop",
                  shop: { ...shop, partnerDeliveryFee: Number(e.target.value) },
                })
              }
            />
          </Field>
          <Field label="Shop delivery fee ₹">
            <TextInput
              type="number"
              value={shop.shopDeliveryFee}
              onBlur={(e) => persist({ ...shop, shopDeliveryFee: Number(e.target.value) })}
              onChange={(e) =>
                dispatch({
                  type: "upsertShop",
                  shop: { ...shop, shopDeliveryFee: Number(e.target.value) },
                })
              }
            />
          </Field>
          <Field label="Minimum order amount ₹">
            <TextInput
              type="number"
              value={shop.minOrderAmount}
              onBlur={(e) => persist({ ...shop, minOrderAmount: Number(e.target.value) })}
              onChange={(e) =>
                dispatch({
                  type: "upsertShop",
                  shop: { ...shop, minOrderAmount: Number(e.target.value) },
                })
              }
            />
          </Field>
        </div>
      </section>
    </div>
  );
}
