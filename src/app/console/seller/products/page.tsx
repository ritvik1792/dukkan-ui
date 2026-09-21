"use client";

import {
  ListingForm,
  blankListingForm,
  listingToForm,
  type ListingFormValue,
} from "@/components/seller/ListingForm";
import { TagBadge } from "@/components/TagBadge";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { categories } from "@/data/seed";
import { formatInr } from "@/lib/format";
import { createId } from "@/lib/ids";
import type { Listing, ProductTag } from "@/lib/types";
import { afterPaint } from "@/lib/drawer";
import { eligiblePromoTags, snapshotTag } from "@/lib/tags";
import { findCatalogByName } from "@/services/catalog";
import { useEffect, useMemo, useState } from "react";

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
      <path
        d="M4 17.5V20h2.5L18.8 7.7l-2.5-2.5L4 17.5zM20.7 7a1 1 0 0 0 0-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-1.1 1.1 3.7 3.7 1.1-1.1z"
        fill="currentColor"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
      <path
        d="M7 7h10l-.8 12.2A2 2 0 0 1 14.2 21H9.8a2 2 0 0 1-2-1.8L7 7zm3-3h4l1 2H9l1-2zM5 7h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Panel = { mode: "create" } | { mode: "edit"; listingId: string };

export default function SellerProducts() {
  const { user, state, catalogById, dispatch } = useApp();
  const { showAlert } = useAlert();
  const [selected, setSelected] = useState<string[]>([]);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [drawerShown, setDrawerShown] = useState(false);
  const [createStep, setCreateStep] = useState<"category" | "details">("category");
  const [chosenCategory, setChosenCategory] = useState("grocery");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in" | "out">("all");
  const [bulkOpen, setBulkOpen] = useState(false);

  const shopIds = useMemo(
    () =>
      new Set(
        state.shops
          .filter((s) => user && (s.ownerUserId === user.id || user.role === "admin"))
          .map((s) => s.id),
      ),
    [state.shops, user],
  );
  const products = state.listings.filter((l) => shopIds.has(l.shopId));
  const shop =
    state.shops.find((s) => s.id === user?.shopId) ??
    state.shops.find((s) => s.ownerUserId === user?.id);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((listing) => {
      const product = catalogById(listing.catalogProductId);
      if (categoryFilter && product?.categoryId !== categoryFilter) return false;
      if (statusFilter && listing.status !== statusFilter) return false;
      if (stockFilter === "in" && listing.stock <= 0) return false;
      if (stockFilter === "out" && listing.stock > 0) return false;
      if (!q) return true;
      const hay = `${product?.name ?? ""} ${product?.brand ?? ""} ${listing.tags.map((t) => t.label).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [products, catalogById, categoryFilter, statusFilter, stockFilter, search]);

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.includes(p.id));
  const editing =
    panel?.mode === "edit" ? products.find((l) => l.id === panel.listingId) : undefined;
  const editingProduct = editing ? catalogById(editing.catalogProductId) : undefined;

  const categoryRows = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    return categories
      .map((category) => ({
        ...category,
        skuCount: products.filter(
          (listing) => catalogById(listing.catalogProductId)?.categoryId === category.id,
        ).length,
        inShop: Boolean(shop?.categoryIds.includes(category.id)),
      }))
      .filter((row) => {
        if (!q) return true;
        return `${row.name} ${row.id}`.toLowerCase().includes(q);
      });
  }, [categoryQuery, products, catalogById, shop]);

  useEffect(() => {
    if (!panel) return;
    setDrawerShown(false);
    return afterPaint(() => setDrawerShown(true));
  }, [panel]);

  if (!user) return null;

  function openCreate() {
    setChosenCategory("grocery");
    setCategoryQuery("");
    setCreateStep("category");
    setPanel({ mode: "create" });
  }

  function openEdit(listingId: string) {
    setCreateStep("details");
    setPanel({ mode: "edit", listingId });
  }

  function closePanel() {
    setDrawerShown(false);
    window.setTimeout(() => setPanel(null), 320);
  }

  function toggleSelect(id: string) {
    setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  function saveForm(form: ListingFormValue, listing?: Listing) {
    if (!shop) return;
    const existing = listing
      ? catalogById(listing.catalogProductId)
      : findCatalogByName(state.catalog, form.name, form.brand || "Unbranded");
    const catalogId = existing?.id ?? listing?.catalogProductId ?? createId("cat");
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
        id: listing?.id ?? createId("l"),
        catalogProductId: catalogId,
        shopId: listing?.shopId ?? shop.id,
        basePrice: form.basePrice,
        sellerPrice: form.sellerPrice,
        stock: form.stock,
        moq: form.moq,
        color: form.color || undefined,
        quality: form.quality || undefined,
        warranty: form.warranty || undefined,
        tags: form.tags,
        status: listing?.status ?? "approved",
      },
    });
    showAlert({
      tone: "success",
      title: listing ? "Product saved" : "Product published",
      message: listing ? undefined : "Live for buyers as soon as your dukkan is active.",
    });
    closePanel();
  }

  function deleteIds(ids: string[]) {
    if (ids.length === 0) return;
    const ok = window.confirm(
      ids.length === 1 ? "Delete this product?" : `Delete ${ids.length} products?`,
    );
    if (!ok) return;
    dispatch({ type: "deleteListings", listingIds: ids });
    setSelected((cur) => cur.filter((id) => !ids.includes(id)));
    if (panel?.mode === "edit" && ids.includes(panel.listingId)) closePanel();
    showAlert({ tone: "success", title: ids.length === 1 ? "Product deleted" : "Products deleted" });
  }

  function setStock(listing: Listing, stock: number) {
    dispatch({
      type: "upsertListing",
      listing: { ...listing, stock: Math.max(0, Math.round(stock)) },
    });
  }

  function setInStock(listing: Listing, on: boolean) {
    setStock(listing, on ? (listing.stock > 0 ? listing.stock : 1) : 0);
  }

  const wizardOnDetails = panel?.mode === "edit" || createStep === "details";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="mt-1 text-sm text-stone-500">
            Search, filter, then add a product. New listings go live immediately.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-full bg-ink px-4 py-2 text-sm text-lime transition duration-200 hover:opacity-90"
        >
          + Add product
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Search">
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, brand, tag"
          />
        </Field>
        <Field label="Category">
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="approved">Live</option>
            <option value="rejected">Hidden by admin</option>
            <option value="pending">Pending</option>
          </Select>
        </Field>
        <Field label="Stock">
          <Select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
          >
            <option value="all">All</option>
            <option value="in">In stock</option>
            <option value="out">Out of stock</option>
          </Select>
        </Field>
      </div>

      {selected.length > 0 && (
        <div className="animate-fade-up mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm text-white">
          <span className="mr-2 font-semibold">{selected.length} selected</span>
          <button
            type="button"
            className="rounded-full bg-lime px-3 py-1.5 font-semibold text-ink transition hover:opacity-90"
            onClick={() => setBulkOpen(true)}
          >
            Edit
          </button>
          <button
            type="button"
            className="rounded-full bg-red-500 px-3 py-1.5 text-white transition hover:bg-red-600"
            onClick={() => deleteIds(selected)}
          >
            Delete
          </button>
        </div>
      )}

      <div className="animate-fade-up mt-6 overflow-x-auto rounded-2xl bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-stone-400">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() =>
                    setSelected(allSelected ? [] : filtered.map((p) => p.id))
                  }
                  aria-label="Select all visible products"
                />
              </th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Base</th>
              <th className="px-4 py-3">Seller</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => {
              const p = catalogById(l.catalogProductId);
              const inStock = l.stock > 0;
              const category = categories.find((c) => c.id === p?.categoryId);
              return (
                <tr key={l.id} className="border-b last:border-0 transition-colors duration-150 hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(l.id)}
                      onChange={() => toggleSelect(l.id)}
                      aria-label={`Select ${p?.name ?? "product"}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-semibold text-ink"
                          style={{
                            background: `hsl(${p?.imageHue ?? 140} 70% 88%)`,
                          }}
                        >
                          {p?.imageLabel?.slice(0, 2)}
                        </span>
                      )}
                      <div>
                        <button
                          type="button"
                          className="text-left font-medium hover:underline"
                          onClick={() => openEdit(l.id)}
                        >
                          {p?.name}
                        </button>
                        <p className="text-xs text-stone-400">
                          {l.color || l.quality || l.warranty
                            ? [l.color, l.quality, l.warranty].filter(Boolean).join(" · ")
                            : p?.unit}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {category ? `${category.emoji} ${category.name}` : "—"}
                  </td>
                  <td className="px-4 py-3">{formatInr(l.basePrice)}</td>
                  <td className="px-4 py-3">{formatInr(l.sellerPrice)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={l.stock}
                        onChange={(e) => setStock(l, Number(e.target.value))}
                        className="w-16 rounded-lg border border-stone-200 px-2 py-1"
                        aria-label={`Stock for ${p?.name ?? "product"}`}
                      />
                      <button
                        type="button"
                        aria-pressed={inStock}
                        onClick={() => setInStock(l, !inStock)}
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold transition ${
                          inStock ? "bg-teal-100 text-teal-800" : "bg-stone-200 text-stone-500"
                        }`}
                      >
                        {inStock ? "In stock" : "Out"}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {l.tags.map((t) => (
                        <TagBadge key={t.id} tag={t} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {l.status === "approved"
                      ? "Live"
                      : l.status === "rejected"
                        ? "Hidden by admin"
                        : "Pending"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Edit product"
                        onClick={() => openEdit(l.id)}
                        className="rounded-lg p-1.5 text-stone-600 transition hover:bg-stone-100"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete product"
                        onClick={() => deleteIds([l.id])}
                        className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-stone-500">
                  No products match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {panel && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close panel"
            onClick={closePanel}
            className={`drawer-scrim absolute inset-0 bg-black/40 ${drawerShown ? "opacity-100" : "opacity-0"}`}
          />
          <aside
            className={`drawer-panel absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-2xl ${
              drawerShown ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {panel.mode === "create" ? "Add product" : "Edit product"}
                </h2>
                <p className="text-xs text-stone-500">
                  {panel.mode === "create" && createStep === "category"
                    ? "Pick a category, then product details slide in."
                    : "Add pictures, prices, stock, and submit."}
                </p>
              </div>
              <button type="button" className="text-sm text-stone-500" onClick={closePanel}>
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              {panel.mode === "create" ? (
                <div
                  className="wizard-track flex h-full w-[200%]"
                  style={{ transform: wizardOnDetails ? "translateX(-50%)" : "translateX(0)" }}
                >
                  <div className="h-full w-1/2 overflow-y-auto p-5">
                    <Field label="Search categories">
                      <TextInput
                        value={categoryQuery}
                        onChange={(e) => setCategoryQuery(e.target.value)}
                        placeholder="Grocery, electronics…"
                      />
                    </Field>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-stone-50 text-xs uppercase text-stone-400">
                          <tr>
                            <th className="px-3 py-2">Category</th>
                            <th className="px-3 py-2">SKUs</th>
                            <th className="px-3 py-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryRows.map((row) => (
                            <tr
                              key={row.id}
                              className="cursor-pointer border-t transition hover:bg-lime/40"
                              onClick={() => {
                                setChosenCategory(row.id);
                                setCreateStep("details");
                              }}
                            >
                              <td className="px-3 py-3">
                                <span className="font-medium">
                                  {row.emoji} {row.name}
                                </span>
                                {row.inShop && (
                                  <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800">
                                    Your dukkan
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3">{row.skuCount}</td>
                              <td className="px-3 py-3 text-right text-xs font-semibold text-teal-800">
                                Select
                              </td>
                            </tr>
                          ))}
                          {categoryRows.length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-3 py-6 text-center text-stone-500">
                                No categories match.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="h-full w-1/2 overflow-y-auto p-5">
                    <button
                      type="button"
                      className="mb-4 text-sm text-stone-500"
                      onClick={() => setCreateStep("category")}
                    >
                      ← Change category
                    </button>
                    <p className="mb-3 text-sm font-semibold">
                      {categories.find((c) => c.id === chosenCategory)?.emoji}{" "}
                      {categories.find((c) => c.id === chosenCategory)?.name}
                    </p>
                    <ListingForm
                      key="create-form"
                      compact
                      hideCategory
                      lockedCategoryId={chosenCategory}
                      shopId={shop?.id}
                      initial={blankListingForm(chosenCategory)}
                      submitLabel="Save product"
                      onSubmit={(form) => saveForm(form)}
                    />
                  </div>
                </div>
              ) : !editing || !editingProduct ? (
                <p className="p-5 text-sm text-stone-500">Product not found.</p>
              ) : (
                <div className="h-full overflow-y-auto p-5">
                  <ListingForm
                    key={editing.id}
                    compact
                    shopId={editing.shopId}
                    initial={listingToForm(editing, editingProduct)}
                    submitLabel="Save"
                    onSubmit={(form) => saveForm(form, editing)}
                  />
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {bulkOpen && (
        <BulkEditModal
          count={selected.length}
          onClose={() => setBulkOpen(false)}
          onApply={(patch) => {
            const chosen = products.filter((l) => selected.includes(l.id));
            for (const listing of chosen) {
              const product = catalogById(listing.catalogProductId);
              let stock = listing.stock;
              if (!patch.enabled) stock = 0;
              else if (patch.stock != null) stock = patch.stock;
              else if (listing.stock <= 0) stock = 1;
              const tags = [...listing.tags];
              const extra = patch.tag;
              if (extra && !tags.some((item) => item.id === extra.id)) tags.push(extra);
              dispatch({
                type: "upsertListing",
                listing: { ...listing, stock, tags },
              });
              if (product && patch.categoryId) {
                dispatch({
                  type: "upsertCatalog",
                  product: { ...product, categoryId: patch.categoryId },
                });
              }
            }
            setBulkOpen(false);
            showAlert({ tone: "success", title: "Bulk update applied" });
          }}
        />
      )}
    </div>
  );
}

type BulkPatch = {
  categoryId?: string;
  tag?: ProductTag;
  stock?: number;
  enabled: boolean;
};

function BulkEditModal({
  count,
  onClose,
  onApply,
}: {
  count: number;
  onClose: () => void;
  onApply: (patch: BulkPatch) => void;
}) {
  const { user, state } = useApp();
  const [categoryId, setCategoryId] = useState("");
  const [tagId, setTagId] = useState("");
  const [stock, setStock] = useState("");
  const [enabled, setEnabled] = useState(true);
  const shop =
    state.shops.find((item) => item.id === user?.shopId) ??
    state.shops.find((item) => item.ownerUserId === user?.id);
  const eligible = eligiblePromoTags(state.promoTags, shop?.id);

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="animate-fade-up w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Bulk edit</h2>
            <p className="text-sm text-stone-500">
              Enable or disable {count} products. Other fields are optional.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-sm">
            Close
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">{enabled ? "Enabled" : "Disabled"}</p>
              <p className="text-xs text-stone-500">
                {enabled ? "Products stay in stock and can be sold." : "Products are marked out of stock."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled((on) => !on)}
              className={`relative h-8 w-14 rounded-full transition duration-200 ${
                enabled ? "bg-teal-600" : "bg-stone-300"
              }`}
            >
              <span
                className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition duration-200 ${
                  enabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <Field label="Category">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Keep current</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Attach tag" hint="optional">
            <Select value={tagId} onChange={(e) => setTagId(e.target.value)}>
              <option value="">Keep current</option>
              {eligible.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.label} · {tag.kind}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Stock" hint="leave empty to skip">
            <TextInput
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="e.g. 12"
              disabled={!enabled}
            />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            className="rounded-full bg-ink px-4 py-2 text-sm text-lime"
            onClick={() =>
              onApply({
                categoryId: categoryId || undefined,
                tag: tagId
                  ? (() => {
                      const tag = eligible.find((item) => item.id === tagId);
                      return tag ? snapshotTag(tag) : undefined;
                    })()
                  : undefined,
                stock: stock === "" ? undefined : Math.max(0, Number(stock)),
                enabled,
              })
            }
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
