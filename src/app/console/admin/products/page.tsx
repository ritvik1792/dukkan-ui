"use client";

import { ModerationDialog } from "@/components/moderation/ModerationDialog";
import {
  ListingForm,
  listingToForm,
  type ListingFormValue,
} from "@/components/seller/ListingForm";
import { ShopNameButton } from "@/components/shops/ShopPeek";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusPill } from "@/components/ui/StatCard";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { formatInr } from "@/lib/format";
import { afterPaint } from "@/lib/drawer";
import { adminConsolePath } from "@/lib/routes";
import { findCatalogByName } from "@/services/catalog";
import { activeCaseForListing, caseStatusLabel } from "@/services/moderation";
import { reviewStats } from "@/services/reviews";
import { createId } from "@/lib/ids";
import type { Listing, ModerationAction, ModerationReason } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Row = {
  listing: Listing;
  productName: string;
  brand: string;
  category: string;
  shopName: string;
  visibility: string;
  rating: number;
  reviewCount: number;
  caseStatus: string;
};

function visibilityLabel(status: Listing["status"]) {
  if (status === "approved") return "Live";
  if (status === "rejected") return "Hidden";
  return "Pending";
}

export default function AdminProducts() {
  const { user, state, dispatch, shopById, catalogById } = useApp();
  const { showAlert } = useAlert();
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<{
    listingId: string;
    action: ModerationAction;
  } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [sheetShown, setSheetShown] = useState(false);

  const rows = useMemo<Row[]>(
    () =>
      state.listings.map((listing) => {
        const product = catalogById(listing.catalogProductId);
        const shop = shopById(listing.shopId);
        const stats = reviewStats(
          state.reviews.filter((review) => review.catalogProductId === listing.catalogProductId),
        );
        const openCase = activeCaseForListing(state.moderationCases, listing.id);
        return {
          listing,
          productName: product?.name ?? "Unknown product",
          brand: product?.brand ?? "—",
          category:
            state.categories.find((item) => item.id === product?.categoryId)?.name ?? "—",
          shopName: shop?.name ?? "—",
          visibility: visibilityLabel(listing.status),
          rating: stats.average,
          reviewCount: stats.count,
          caseStatus: openCase ? caseStatusLabel(openCase.status) : "—",
        };
      }),
    [
      state.listings,
      state.reviews,
      state.categories,
      state.moderationCases,
      catalogById,
      shopById,
    ],
  );

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

  function openCase(
    listing: Listing,
    action: ModerationAction,
    reason: ModerationReason,
    explanation: string,
  ) {
    if (!user) return;
    const now = new Date().toISOString();
    dispatch({
      type: "openModerationCase",
      moderationCase: {
        id: createId("mod"),
        listingId: listing.id,
        shopId: listing.shopId,
        catalogProductId: listing.catalogProductId,
        action,
        reason,
        explanation,
        openedByUserId: user.id,
        status: "open",
        createdAt: now,
        updatedAt: now,
        events: [
          {
            id: createId("mev"),
            kind: "opened",
            authorId: user.id,
            authorRole: "admin",
            body: explanation,
            createdAt: now,
          },
        ],
      },
    });
  }

  function confirmModeration(input: { reason: ModerationReason; explanation: string }) {
    if (!pendingAction) return;
    const listing = state.listings.find((item) => item.id === pendingAction.listingId);
    if (!listing) return;
    openCase(listing, pendingAction.action, input.reason, input.explanation);
    if (pendingAction.action === "hide") {
      dispatch({ type: "setListingStatus", listingId: listing.id, status: "rejected" });
      showAlert({
        tone: "success",
        title: "Product hidden",
        message: "The seller can dispute this or apply to republish once fixed.",
      });
    } else {
      setEditId(listing.id);
    }
    setPendingAction(null);
  }

  function makeLive(listing: Listing) {
    dispatch({ type: "setListingStatus", listingId: listing.id, status: "approved" });
    showAlert({
      tone: "success",
      title: "Product is live",
      message: "Buyers can see this listing again.",
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
    showAlert({
      tone: "success",
      title: "Product overridden",
      message: "The seller has your explanation and can dispute or reapply.",
    });
    closeSheet();
  }

  const columns: Column<Row>[] = [
    {
      id: "product",
      header: "Product",
      value: (row) => row.productName,
      filter: { kind: "text", placeholder: "Name contains…" },
      render: (row) => (
        <div>
          <p className="font-medium">{row.productName}</p>
          <p className="text-xs text-stone-400">{row.brand}</p>
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
      defaultHidden: true,
    },
    {
      id: "shop",
      header: "Dukkan",
      value: (row) => row.shopName,
      filter: { kind: "select" },
      render: (row) => (
        <ShopNameButton shopId={row.listing.shopId}>{row.shopName}</ShopNameButton>
      ),
    },
    {
      id: "price",
      header: "Price",
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
      align: "right",
    },
    {
      id: "rating",
      header: "Rating",
      value: (row) => row.rating,
      filter: { kind: "range", step: 0.1 },
      align: "right",
      render: (row) =>
        row.reviewCount ? (
          <span>
            {row.rating} ★{" "}
            <span className="text-xs text-stone-400">({row.reviewCount})</span>
          </span>
        ) : (
          <span className="text-xs text-stone-400">No reviews</span>
        ),
    },
    {
      id: "visibility",
      header: "Visibility",
      value: (row) => row.visibility,
      filter: { kind: "select" },
      render: (row) => <StatusPill>{row.visibility}</StatusPill>,
    },
    {
      id: "case",
      header: "Moderation",
      value: (row) => row.caseStatus,
      filter: { kind: "select" },
      render: (row) =>
        row.caseStatus === "—" ? (
          <span className="text-xs text-stone-400">—</span>
        ) : (
          <span className="text-xs text-amber-700">{row.caseStatus}</span>
        ),
    },
    {
      id: "actions",
      header: "",
      value: () => "",
      sortable: false,
      searchable: false,
      align: "right",
      render: (row) => (
        <div
          className="flex flex-wrap justify-end gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() =>
              setPendingAction({ listingId: row.listing.id, action: "override" })
            }
            className="rounded-full border px-3 py-1 text-xs"
          >
            Override
          </button>
          {row.listing.status === "approved" ? (
            <button
              type="button"
              onClick={() => setPendingAction({ listingId: row.listing.id, action: "hide" })}
              className="rounded-full border px-3 py-1 text-xs"
            >
              Hide
            </button>
          ) : (
            <button
              type="button"
              onClick={() => makeLive(row.listing)}
              className="rounded-full bg-ink px-3 py-1 text-xs text-lime"
            >
              Make live
            </button>
          )}
        </div>
      ),
    },
  ];

  const pending = pendingAction
    ? state.listings.find((item) => item.id === pendingAction.listingId)
    : undefined;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Products</h1>
      <p className="mt-1 text-sm text-stone-500">
        Shops publish without approval. Open a row for product details and reviews, or hide and
        override a listing with an explanation the seller can answer.
      </p>

      <div className="mt-4">
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(row) => row.listing.id}
          onRowClick={(row) => router.push(adminConsolePath(`/products/${row.listing.id}`))}
          searchPlaceholder="Search product, brand, dukkan, category"
          searchText={(row) => `${row.listing.id} ${row.listing.color ?? ""} ${row.listing.quality ?? ""}`}
          initialSort={{ columnId: "product", dir: "asc" }}
          emptyMessage="No products match these filters."
        />
      </div>

      {pending && pendingAction && (
        <ModerationDialog
          action={pendingAction.action}
          productName={catalogById(pending.catalogProductId)?.name ?? "Product"}
          shopName={shopById(pending.shopId)?.name ?? "Dukkan"}
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmModeration}
        />
      )}

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
