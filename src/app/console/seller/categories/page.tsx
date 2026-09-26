"use client";

import { CategoryMultiSelect, isProductCategory, isServiceCategory } from "@/components/ui/CategoryMultiSelect";
import { useApp } from "@/context/AppContext";
import { mapShop, patchShopRequest } from "@/lib/api";
import { storefrontUrl } from "@/lib/routes";
import Link from "next/link";
import { useState } from "react";

export default function SellerCategoriesPage() {
  const { user, state, dispatch } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!user) return null;
  const shop = state.shops.find((s) => s.ownerUserId === user.id) ?? state.shops.find((s) => s.id === user.shopId);

  if (!shop) {
    return (
      <p>
        No dukkan profile yet.{" "}
        <Link href={storefrontUrl("/sell")} className="underline">
          Apply to sell
        </Link>
      </p>
    );
  }

  const productCategories = state.categories.filter(isProductCategory);
  const serviceCategories = state.categories.filter(isServiceCategory);
  const selected = shop.categoryIds;

  async function persist(nextIds: string[]) {
    if (!shop) return;
    setBusy(true);
    setError("");
    dispatch({
      type: "upsertShop",
      shop: { ...shop, categoryIds: nextIds },
    });
    try {
      const raw = await patchShopRequest(shop.id, { categoryIds: nextIds });
      dispatch({ type: "upsertShop", shop: mapShop(raw) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save categories");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Categories</h1>
      <p className="mt-1 text-sm text-stone-500">
        Multi-select product and service categories. Add services here any time; admin enables
        bookings after review.
      </p>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <section className="mt-6 space-y-3 rounded-2xl bg-white p-5">
        <h2 className="font-semibold">Products</h2>
        <CategoryMultiSelect
          categories={productCategories}
          selectedIds={selected}
          onChange={(ids) => {
            const serviceIds = selected.filter((id) => serviceCategories.some((c) => c.id === id) && !productCategories.some((c) => c.id === id));
            persist(Array.from(new Set([...ids, ...serviceIds])));
          }}
        />
      </section>
      <section className="mt-4 space-y-3 rounded-2xl bg-white p-5">
        <h2 className="font-semibold">Services</h2>
        <p className="text-sm text-stone-500">
          After you add a service category, list offerings on the Services page once admin enables
          them — or keep editing categories here.
        </p>
        <CategoryMultiSelect
          categories={serviceCategories}
          selectedIds={selected}
          onChange={(ids) => {
            const productIds = selected.filter((id) => productCategories.some((c) => c.id === id) && !serviceCategories.some((c) => c.id === id));
            persist(Array.from(new Set([...productIds, ...ids])));
          }}
        />
      </section>
      {busy && <p className="mt-3 text-xs text-stone-400">Saving…</p>}
      <p className="mt-4 text-sm">
        <Link href={storefrontUrl("/sell")} className="underline">
          Add more from the sell form
        </Link>
      </p>
    </div>
  );
}
