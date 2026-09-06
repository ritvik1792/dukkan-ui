"use client";

import {
  ListingForm,
  listingToForm,
  type ListingFormValue,
} from "@/components/seller/ListingForm";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/StatCard";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { formatInr } from "@/lib/format";
import { afterPaint } from "@/lib/drawer";
import { findCatalogByName } from "@/services/catalog";
import { createId } from "@/lib/ids";
import type { ApprovalStatus } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

function visibilityLabel(status: ApprovalStatus) {
  if (status === "approved") return "Live";
  if (status === "rejected") return "Hidden";
  return "Pending";
}

export default function AdminProducts() {
  const { state, dispatch, shopById, catalogById } = useApp();
  const { showAlert } = useAlert();
  const [search, setSearch] = useState("");
  const [shopFilter, setShopFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [sheetShown, setSheetShown] = useState(false);

  const listings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.listings.filter((listing) => {
      if (shopFilter && listing.shopId !== shopFilter) return false;
      if (statusFilter && listing.status !== statusFilter) return false;
      if (!q) return true;
      const product = catalogById(listing.catalogProductId);
      const shop = shopById(listing.shopId);
      return `${product?.name ?? ""} ${product?.brand ?? ""} ${shop?.name ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [state.listings, search, shopFilter, statusFilter, catalogById, shopById]);

  const editing = state.listings.find((l) => l.id === editId);
  const editingProduct = editing ? catalogById(editing.catalogProductId) : undefined;

  useEffect(() => {
    if (!editId) return;
    setSheetShown(false);
    return afterPaint(() => setSheetShown(true));
  }, [editId]);

  function closeSheet() {
    setSheetShown(false);
    window.setTimeout(() => setEditId(null), 320);
  }

  function setVisibility(listingId: string, status: ApprovalStatus) {
    dispatch({ type: "setListingStatus", listingId, status });
    showAlert({
      tone: "success",
      title: status === "approved" ? "Product is live" : "Product hidden",
      message:
        status === "approved"
          ? "Buyers can see this listing again."
          : "Removed from the storefront. The seller can still see it.",
    });
  }

  function saveOverride(form: ListingFormValue) {
    if (!editing) return;
    const existing =
      findCatalogByName(state.catalog, form.name, form.brand || "Unbranded") ??
      catalogById(editing.catalogProductId);
    const catalogId = existing?.id ?? createId("cat");
    dispatch({
      type: "upsertCatalog",
      product: {
        id: catalogId,
        name: form.name,
        brand: form.brand || existing?.brand || "Unbranded",
        categoryId: form.categoryId,
        description: form.description,
        unit: form.unit,
        imageLabel: existing?.imageLabel || form.name.slice(0, 8),
        imageHue: existing?.imageHue ?? Math.floor(Math.random() * 360),
        imageUrl: form.mainImage || undefined,
        galleryUrls: form.gallery,
      },
    });
    dispatch({
      type: "upsertListing",
      listing: {
        ...editing,
        catalogProductId: catalogId,
        basePrice: form.basePrice,
        sellerPrice: form.sellerPrice,
        stock: form.stock,
        moq: form.moq,
        color: form.color || undefined,
        quality: form.quality || undefined,
        warranty: form.warranty || undefined,
        tags: form.tags,
      },
    });
    showAlert({ tone: "success", title: "Product overridden" });
    closeSheet();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Products</h1>
      <p className="mt-1 text-sm text-stone-500">
        Shops publish without approval. Override a listing if you need to edit, hide, or restore
        it.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Field label="Search">
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Product, brand, dukkan"
          />
        </Field>
        <Field label="Dukkan">
          <Select value={shopFilter} onChange={(e) => setShopFilter(e.target.value)}>
            <option value="">All dukkans</option>
            {state.shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Visibility">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="approved">Live</option>
            <option value="rejected">Hidden</option>
            <option value="pending">Pending</option>
          </Select>
        </Field>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-stone-400">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Dukkan</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Visibility</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => {
              const product = catalogById(listing.catalogProductId);
              const shop = shopById(listing.shopId);
              return (
                <tr key={listing.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{product?.name}</p>
                    <p className="text-xs text-stone-400">{product?.brand}</p>
                  </td>
                  <td className="px-4 py-3">{shop?.name}</td>
                  <td className="px-4 py-3">{formatInr(listing.sellerPrice)}</td>
                  <td className="px-4 py-3">{listing.stock}</td>
                  <td className="px-4 py-3">
                    <StatusPill>{visibilityLabel(listing.status)}</StatusPill>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditId(listing.id)}
                        className="rounded-full border px-3 py-1 text-xs"
                      >
                        Override
                      </button>
                      {listing.status === "approved" ? (
                        <button
                          type="button"
                          onClick={() => setVisibility(listing.id, "rejected")}
                          className="rounded-full border px-3 py-1 text-xs"
                        >
                          Hide
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setVisibility(listing.id, "approved")}
                          className="rounded-full bg-ink px-3 py-1 text-xs text-lime"
                        >
                          Make live
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {listings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                  No products match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && editingProduct && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close override"
            onClick={closeSheet}
            className={`drawer-scrim absolute inset-0 bg-black/40 ${sheetShown ? "opacity-100" : "opacity-0"}`}
          />
          <aside
            className={`drawer-panel absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-2xl ${
              sheetShown ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">Override product</h2>
                <p className="text-xs text-stone-500">
                  Changes replace the seller listing. Buyers see this immediately.
                </p>
              </div>
              <button type="button" className="text-sm text-stone-500" onClick={closeSheet}>
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <ListingForm
                key={editing.id}
                compact
                shopId={editing.shopId}
                initial={listingToForm(editing, editingProduct)}
                submitLabel="Save override"
                onSubmit={saveOverride}
              />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
