"use client";

import { ListingForm, type ListingFormValue } from "@/components/seller/ListingForm";
import { useApp } from "@/context/AppContext";
import { findCatalogByName } from "@/services/catalog";
import { createId } from "@/lib/ids";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const { user, state, dispatch } = useApp();
  const router = useRouter();
  if (!user) return null;
  const shop =
    state.shops.find((s) => s.id === user.shopId) ??
    state.shops.find((s) => s.ownerUserId === user.id);

  function save(form: ListingFormValue) {
    if (!shop) return;
    const existing = findCatalogByName(state.catalog, form.name, form.brand || "Unbranded");
    const catalogId = existing?.id ?? createId("cat");
    if (!existing) {
      dispatch({
        type: "upsertCatalog",
        product: {
          id: catalogId,
          name: form.name,
          brand: form.brand || "Unbranded",
          categoryId: form.categoryId,
          description: form.description,
          unit: form.unit,
          imageLabel: form.name.slice(0, 8),
          imageHue: Math.floor(Math.random() * 360),
        },
      });
    }
    dispatch({
      type: "upsertListing",
      listing: {
        id: createId("l"),
        catalogProductId: catalogId,
        shopId: shop.id,
        basePrice: form.basePrice,
        sellerPrice: form.sellerPrice,
        stock: form.stock,
        moq: form.moq,
        color: form.color || undefined,
        quality: form.quality || undefined,
        tags: form.tags,
        status: "pending",
      },
    });
    router.push("/seller/products");
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Add product</h1>
      <p className="mt-1 text-sm text-stone-500">
        If the same name and brand already exist, buyers still see one product and can choose
        you as a seller.
      </p>
      <div className="mt-6">
        <ListingForm submitLabel="Submit for approval" onSubmit={save} />
      </div>
    </div>
  );
}
