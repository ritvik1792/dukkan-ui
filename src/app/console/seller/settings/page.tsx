"use client";

import { Field, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";

export default function SellerSettingsPage() {
  const { user, state, dispatch } = useApp();
  if (!user) return null;
  const shop =
    state.shops.find((s) => s.id === user.shopId) ??
    state.shops.find((s) => s.ownerUserId === user.id);

  if (!shop) return <p>No shop profile.</p>;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Delivery settings</h1>
      <p className="mt-1 text-sm text-stone-500">
        Choose whether Dukkan partners deliver, your shop delivers, fees, and minimum order.
      </p>
      <div className="mt-6 space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={shop.partnerDeliveryEnabled}
            onChange={(e) =>
              dispatch({
                type: "upsertShop",
                shop: { ...shop, partnerDeliveryEnabled: e.target.checked },
              })
            }
          />
          Delivery by Dukkan partner
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={shop.shopDeliveryEnabled}
            onChange={(e) =>
              dispatch({
                type: "upsertShop",
                shop: { ...shop, shopDeliveryEnabled: e.target.checked },
              })
            }
          />
          Delivery by this dukkan
        </label>
        <Field label="Partner delivery fee ₹">
          <TextInput
            type="number"
            value={shop.partnerDeliveryFee}
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
            onChange={(e) =>
              dispatch({
                type: "upsertShop",
                shop: { ...shop, minOrderAmount: Number(e.target.value) },
              })
            }
          />
        </Field>
      </div>
    </div>
  );
}
