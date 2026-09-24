"use client";

import { ListingForm, type ListingFormValue } from "@/components/seller/ListingForm";
import { useApp } from "@/context/AppContext";
import { findCatalogByName } from "@/services/catalog";
import { mapCatalogProduct, mapListing, upsertCatalogRequest, upsertListingRequest } from "@/lib/api";
import { randomBrandHue } from "@/lib/constants";
import { createId } from "@/lib/ids";
import { useMotionRouter } from "@/lib/motion";
import { sellerConsolePath } from "@/lib/routes";

export default function NewProductPage() {
  const { user, state, dispatch } = useApp();
  const router = useMotionRouter();
  if (!user) return null;
  const shop =
    state.shops.find((s) => s.id === user.shopId) ??
    state.shops.find((s) => s.ownerUserId === user.id);

  async function save(form: ListingFormValue) {
    if (!shop) return;
    const existing = findCatalogByName(state.catalog, form.name, form.brand || "Unbranded");
    const catalogPayload = {
      name: form.name,
      brand: form.brand || "Unbranded",
      categoryId: form.categoryId,
      description: form.description,
      unit: form.unit,
      imageLabel: form.name.slice(0, 8),
      imageHue: existing?.imageHue ?? randomBrandHue(),
      imageUrl: form.mainImage || undefined,
      galleryUrls: form.gallery,
    };
    try {
      const product = mapCatalogProduct(
        await upsertCatalogRequest(catalogPayload, existing?.id),
      );
      const listing = mapListing(
        await upsertListingRequest({
          catalogProductId: product.id,
          shopId: shop.id,
          basePrice: form.basePrice,
          sellerPrice: form.sellerPrice,
          stock: form.stock,
          moq: form.moq,
          color: form.color || undefined,
          quality: form.quality || undefined,
          warranty: form.warranty || undefined,
          status: "approved",
          tags: form.tags,
        }),
      );
      dispatch({ type: "upsertCatalog", product });
      dispatch({ type: "upsertListing", listing });
    } catch {
      const catalogId = existing?.id ?? createId("cat");
      if (!existing) {
        dispatch({
          type: "upsertCatalog",
          product: { id: catalogId, ...catalogPayload, imageHue: catalogPayload.imageHue },
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
          warranty: form.warranty || undefined,
          tags: form.tags,
          status: "approved",
        },
      });
    }
    router.push(sellerConsolePath("/products"));
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Add product</h1>
      <p className="mt-1 text-sm text-stone-500">
        Products go live immediately. If the same name and brand already exist, buyers still
        see one product and can choose you as a seller.
      </p>
      <div className="mt-6">
        <ListingForm shopId={shop?.id} submitLabel="Save product" onSubmit={(form) => void save(form)} />
      </div>
    </div>
  );
}
