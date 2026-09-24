"use client";

import {
  ListingForm,
  blankListingForm,
  listingToForm,
  type ListingFormValue,
} from "@/components/seller/ListingForm";
import { TagBadge } from "@/components/TagBadge";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusPill } from "@/components/ui/StatCard";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { deleteListingRequest, mapCatalogProduct, mapListing, upsertCatalogRequest, upsertListingRequest } from "@/lib/api";
import { BRAND_FALLBACK_HUE, randomBrandHue } from "@/lib/constants";
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

type InventoryRow = {
  listing: Listing;
  productName: string;
  brand: string;
  category: string;
  unit: string;
  imageUrl?: string;
  imageHue: number;
  imageLabel: string;
  status: string;
  availability: string;
  tags: string;
  variant: string;
};

function visibilityLabel(status: Listing["status"]) {
  if (status === "approved") return "Live";
  if (status === "rejected") return "Hidden by admin";
  return "Pending";
}

export default function SellerProducts() {
  const { user, state, catalogById, dispatch } = useApp();
  const { showAlert } = useAlert();
  const [selected, setSelected] = useState<string[]>([]);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [drawerShown, setDrawerShown] = useState(false);
  const [createStep, setCreateStep] = useState<"category" | "details">("category");
  const [chosenCategory, setChosenCategory] = useState("grocery");
  const [categoryQuery, setCategoryQuery] = useState("");
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
  const categories = state.categories;

  const rows = useMemo<InventoryRow[]>(
    () =>
      products.map((listing) => {
        const product = catalogById(listing.catalogProductId);
        const category = categories.find((item) => item.id === product?.categoryId);
        const variant = [listing.color, listing.quality, listing.warranty].filter(Boolean).join(" · ");
        return {
          listing,
          productName: product?.name ?? "Unknown product",
          brand: product?.brand ?? "—",
          category: category ? `${category.emoji} ${category.name}` : "—",
          unit: product?.unit ?? "",
          imageUrl: product?.imageUrl,
          imageHue: product?.imageHue ?? BRAND_FALLBACK_HUE,
          imageLabel: product?.imageLabel ?? "",
          status: visibilityLabel(listing.status),
          availability: listing.stock > 0 ? "In stock" : "Out of stock",
          tags: listing.tags.map((tag) => tag.label).join(" "),
          variant,
        };
      }),
    [products, catalogById, categories],
  );

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
  }, [categories, categoryQuery, products, catalogById, shop]);

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

  async function saveForm(form: ListingFormValue, listing?: Listing) {
    if (!shop) return;
    const existing = listing
      ? catalogById(listing.catalogProductId)
      : findCatalogByName(state.catalog, form.name, form.brand || "Unbranded");
    const catalogPayload = {
      name: form.name,
      brand: form.brand || existing?.brand || "Unbranded",
      categoryId: form.categoryId,
      description: form.description,
      unit: form.unit,
      imageLabel: existing?.imageLabel || form.name.slice(0, 8),
      imageHue: existing?.imageHue ?? randomBrandHue(),
      imageUrl: form.mainImage || undefined,
      galleryUrls: form.gallery,
    };
    try {
      const product = mapCatalogProduct(await upsertCatalogRequest(catalogPayload, existing?.id));
      const saved = mapListing(
        await upsertListingRequest(
          {
            catalogProductId: product.id,
            shopId: listing?.shopId ?? shop.id,
            basePrice: form.basePrice,
            sellerPrice: form.sellerPrice,
            stock: form.stock,
            moq: form.moq,
            color: form.color || undefined,
            quality: form.quality || undefined,
            warranty: form.warranty || undefined,
            status: listing?.status ?? "approved",
            tags: form.tags,
          },
          listing?.id,
        ),
      );
      dispatch({ type: "upsertCatalog", product });
      dispatch({ type: "upsertListing", listing: saved });
    } catch {
      const catalogId = existing?.id ?? listing?.catalogProductId ?? createId("cat");
      dispatch({
        type: "upsertCatalog",
        product: { id: catalogId, ...catalogPayload },
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
    }
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
    ids.forEach((id) => {
      void deleteListingRequest(id).catch(() => undefined);
    });
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

  const columns: Column<InventoryRow>[] = [
    {
      id: "product",
      header: "Product",
      value: (row) => row.productName,
      filter: { kind: "text", placeholder: "Name contains…" },
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-semibold text-ink"
              style={{ background: `hsl(${row.imageHue} 32% 88%)` }}
            >
              {row.imageLabel.slice(0, 2)}
            </span>
          )}
          <div>
            <p className="font-medium">{row.productName}</p>
            <p className="text-xs text-stone-400">{row.variant || row.unit || row.brand}</p>
          </div>
        </div>
      ),
    },
    {
      id: "brand",
      header: "Brand",
      value: (row) => row.brand,
      filter: { kind: "select" },
      defaultHidden: true,
    },
    {
      id: "category",
      header: "Category",
      value: (row) => row.category,
      filter: { kind: "select" },
    },
    {
      id: "base",
      header: "Base",
      value: (row) => row.listing.basePrice,
      filter: { kind: "range" },
      align: "right",
      render: (row) => formatInr(row.listing.basePrice),
    },
    {
      id: "seller",
      header: "Seller",
      value: (row) => row.listing.sellerPrice,
      filter: { kind: "range" },
      align: "right",
      render: (row) => formatInr(row.listing.sellerPrice),
    },
    {
      id: "stock",
      header: "Stock",
      value: (row) => row.listing.stock,
      filter: { kind: "range" },
      render: (row) => {
        const inStock = row.listing.stock > 0;
        return (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={row.listing.stock}
              onChange={(event) => setStock(row.listing, Number(event.target.value))}
              className="w-16 rounded-lg border border-border px-2 py-1"
              aria-label={`Stock for ${row.productName}`}
            />
            <button
              type="button"
              aria-pressed={inStock}
              onClick={() => setInStock(row.listing, !inStock)}
              className={`rounded-full px-2 py-1 text-[11px] font-semibold transition ${
                inStock ? "bg-blush text-carrot" : "bg-stone-200 text-stone-500"
              }`}
            >
              {inStock ? "In stock" : "Out"}
            </button>
          </div>
        );
      },
    },
    {
      id: "availability",
      header: "Availability",
      value: (row) => row.availability,
      filter: { kind: "select" },
      defaultHidden: true,
    },
    {
      id: "tags",
      header: "Tags",
      value: (row) => row.tags,
      filter: { kind: "text", placeholder: "Tag contains…" },
      sortable: false,
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.listing.tags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      value: (row) => row.status,
      filter: { kind: "select" },
      render: (row) => <StatusPill>{row.status}</StatusPill>,
    },
    {
      id: "actions",
      header: "",
      value: () => "",
      sortable: false,
      searchable: false,
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            aria-label="Edit product"
            onClick={() => openEdit(row.listing.id)}
            className="rounded-lg p-1.5 text-stone-600 transition hover:bg-blush"
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            aria-label="Delete product"
            onClick={() => deleteIds([row.listing.id])}
            className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"
          >
            <TrashIcon />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="mt-1 text-sm text-stone-500">
            Search, filter, and sort your listings. New items go live immediately.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-full bg-carrot px-4 py-2 text-sm text-white transition duration-200 hover:opacity-90"
        >
          + Add product
        </button>
      </div>

      {selected.length > 0 && (
        <div className="animate-fade-up mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm text-white">
          <span className="mr-2 font-semibold">{selected.length} selected</span>
          <button
            type="button"
            className="rounded-full bg-carrot px-3 py-1.5 font-semibold text-white transition hover:opacity-90"
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

      <div className="mt-4">
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(row) => row.listing.id}
          onRowClick={(row) => openEdit(row.listing.id)}
          searchPlaceholder="Search name, brand, category, tag"
          searchText={(row) => `${row.listing.id} ${row.unit} ${row.variant}`}
          initialSort={{ columnId: "product", dir: "asc" }}
          emptyMessage="No products match these filters."
          selectable={{ selected, onChange: setSelected }}
        />
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
                    <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-cream text-xs uppercase text-stone-400">
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
                              className="cursor-pointer border-t transition hover:bg-blush"
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
                                  <span className="ml-2 rounded-full bg-blush px-2 py-0.5 text-[10px] font-semibold text-carrot">
                                    Your dukkan
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3">{row.skuCount}</td>
                              <td className="px-3 py-3 text-right text-xs font-semibold text-carrot">
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
                      onSubmit={(form) => void saveForm(form)}
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
                    onSubmit={(form) => void saveForm(form, editing)}
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
          <div className="flex items-center justify-between rounded-2xl bg-cream px-4 py-3">
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
                enabled ? "bg-carrot" : "bg-stone-300"
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
              {state.categories.map((c) => (
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
            className="rounded-full bg-carrot px-4 py-2 text-sm text-white"
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
