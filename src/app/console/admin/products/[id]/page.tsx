"use client";

import { ModerationDialog } from "@/components/moderation/ModerationDialog";
import { ModerationThread } from "@/components/moderation/ModerationThread";
import { ProductArt } from "@/components/ProductArt";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { TagBadge } from "@/components/TagBadge";
import { ShopNameButton } from "@/components/shops/ShopPeek";
import { StatCard, StatusPill } from "@/components/ui/StatCard";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { formatDate, formatInr, percentOff } from "@/lib/format";
import { createId } from "@/lib/ids";
import { adminConsolePath } from "@/lib/routes";
import { latestCaseForListing } from "@/services/moderation";
import { reviewStats, starRow } from "@/services/reviews";
import type { ModerationAction, ModerationReason } from "@/lib/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

export default function AdminProductDetail() {
  const params = useParams<{ id: string }>();
  const listingId = params.id;
  const { user, state, dispatch, shopById, catalogById } = useApp();
  const { showAlert } = useAlert();
  const [pendingAction, setPendingAction] = useState<ModerationAction | null>(null);

  const listing = state.listings.find((item) => item.id === listingId);
  const catalogProductId = listing?.catalogProductId;
  const product = catalogProductId ? catalogById(catalogProductId) : undefined;
  const shop = listing ? shopById(listing.shopId) : undefined;

  const productReviews = useMemo(
    () =>
      catalogProductId
        ? state.reviews
            .filter((review) => review.catalogProductId === catalogProductId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [],
    [state.reviews, catalogProductId],
  );
  const stats = useMemo(() => reviewStats(productReviews), [productReviews]);
  const moderationCase = listing
    ? latestCaseForListing(state.moderationCases, listing.id)
    : undefined;

  if (!listing || !product) {
    return (
      <div>
        <Link href={adminConsolePath("/products")} className="text-sm underline">
          ← Back to products
        </Link>
        <p className="mt-6 text-sm text-stone-500">This product is no longer on the platform.</p>
      </div>
    );
  }

  function confirmModeration(input: { reason: ModerationReason; explanation: string }) {
    if (!user || !pendingAction || !listing) return;
    const now = new Date().toISOString();
    dispatch({
      type: "openModerationCase",
      moderationCase: {
        id: createId("mod"),
        listingId: listing.id,
        shopId: listing.shopId,
        catalogProductId: listing.catalogProductId,
        action: pendingAction,
        reason: input.reason,
        explanation: input.explanation,
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
            body: input.explanation,
            createdAt: now,
          },
        ],
      },
    });
    if (pendingAction === "hide") {
      dispatch({ type: "setListingStatus", listingId: listing.id, status: "rejected" });
    }
    showAlert({
      tone: "success",
      title: pendingAction === "hide" ? "Product hidden" : "Override logged",
      message:
        pendingAction === "hide"
          ? "The seller can dispute this or apply to republish once fixed."
          : "Edit the listing from the products table. The seller has your explanation.",
    });
    setPendingAction(null);
  }

  const discount = percentOff(listing.basePrice, listing.sellerPrice);
  const recent = productReviews.slice(0, 3);

  return (
    <div>
      <Link href={adminConsolePath("/products")} className="text-sm underline">
        ← Back to products
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {product.brand} ·{" "}
            <ShopNameButton shopId={shop?.id}>{shop?.name ?? "Unknown dukkan"}</ShopNameButton>
            {" · "}
            {listing.id}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill>
            {listing.status === "approved"
              ? "Live"
              : listing.status === "rejected"
                ? "Hidden"
                : "Pending"}
          </StatusPill>
          {listing.status === "approved" ? (
            <button
              type="button"
              onClick={() => setPendingAction("hide")}
              className="rounded-full border border-border px-4 py-1.5 text-xs"
            >
              Hide
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                dispatch({
                  type: "setListingStatus",
                  listingId: listing.id,
                  status: "approved",
                });
                showAlert({ tone: "success", title: "Product is live" });
              }}
              className="rounded-full bg-carrot px-4 py-1.5 text-xs font-semibold text-white"
            >
              Make live
            </button>
          )}
          <button
            type="button"
            onClick={() => setPendingAction("override")}
            className="rounded-full border border-border px-4 py-1.5 text-xs"
          >
            Override
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl bg-white p-4">
          <ProductArt
            hue={product.imageHue}
            label={product.imageLabel}
            imageUrl={product.imageUrl}
            className="h-48"
          />
          {product.galleryUrls?.length ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {product.galleryUrls.slice(0, 4).map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="h-14 w-full rounded-lg object-cover"
                />
              ))}
            </div>
          ) : null}
          <p className="mt-3 text-sm text-stone-600">{product.description}</p>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Selling price"
              value={formatInr(listing.sellerPrice)}
              hint={discount ? `${discount}% off ${formatInr(listing.basePrice)}` : "No discount"}
            />
            <StatCard label="Stock" value={listing.stock} hint={`MOQ ${listing.moq}`} />
            <StatCard
              label="Average rating"
              value={stats.visibleCount ? `${stats.average} ★` : "—"}
              hint={`${stats.visibleCount} visible review${stats.visibleCount === 1 ? "" : "s"}`}
            />
            <StatCard
              label="Reviews with photos"
              value={stats.withPhotos}
              hint={`${stats.awaitingReply} awaiting seller reply`}
            />
          </div>

          <div className="rounded-2xl bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400">
              Listing facts
            </h2>
            <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <Fact
                label="Dukkan"
                value={
                  <ShopNameButton shopId={shop?.id}>{shop?.name ?? "—"}</ShopNameButton>
                }
              />
              <Fact label="Unit" value={product.unit} />
              <Fact
                label="Category"
                value={
                  state.categories.find((item) => item.id === product.categoryId)?.name ?? "—"
                }
              />
              <Fact label="Base price" value={formatInr(listing.basePrice)} />
              <Fact label="Colour" value={listing.color || "—"} />
              <Fact label="Quality" value={listing.quality || "—"} />
              <Fact label="Warranty" value={listing.warranty || "No warranty"} />
              <Fact label="Catalog id" value={listing.catalogProductId} />
            </dl>
            {listing.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {listing.tags.map((tag) => (
                  <TagBadge key={tag.id} tag={tag} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400">
            Rating breakdown
          </h2>
          <p className="mt-2 text-3xl font-semibold">
            {stats.visibleCount ? stats.average : "—"}
            <span className="ml-2 text-base font-normal text-stone-400">
              {starRow(stats.average)}
            </span>
          </p>
          <p className="text-xs text-stone-500">
            {stats.count} review{stats.count === 1 ? "" : "s"} total
            {stats.hiddenCount ? ` · ${stats.hiddenCount} taken down` : ""}
            {stats.latestAt ? ` · latest ${formatDate(stats.latestAt)}` : ""}
          </p>
          <ul className="mt-4 space-y-2">
            {stats.buckets.map((bucket) => (
              <li key={bucket.rating} className="flex items-center gap-2 text-xs">
                <span className="w-8 shrink-0 text-stone-500">{bucket.rating} ★</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                  <span
                    className="block h-full rounded-full bg-ink"
                    style={{ width: `${bucket.share}%` }}
                  />
                </span>
                <span className="w-10 shrink-0 text-right text-stone-500">{bucket.count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Recent reviews</h2>
            <Link
              href={adminConsolePath(`/products/${listing.id}/reviews`)}
              className="rounded-full bg-carrot px-4 py-1.5 text-xs font-semibold text-white"
            >
              See all {stats.count} review{stats.count === 1 ? "" : "s"}
            </Link>
          </div>
          <ul className="mt-3 space-y-3">
            {recent.map((review) => (
              <li key={review.id}>
                <ReviewCard
                  review={review}
                  buyerName={state.users.find((item) => item.id === review.buyerId)?.name}
                  shopName={shopById(review.shopId)?.name}
                >
                  {review.hidden && (
                    <p className="mt-3 text-xs text-red-700">
                      Taken down. Buyers cannot see this review.
                    </p>
                  )}
                </ReviewCard>
              </li>
            ))}
            {recent.length === 0 && (
              <li className="rounded-2xl bg-white p-4 text-sm text-stone-500">
                No reviews for this product yet.
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-4">
        <h2 className="text-lg font-semibold">Moderation history</h2>
        {moderationCase ? (
          <div className="mt-3">
            <ModerationThread moderationCase={moderationCase} mode="admin" />
          </div>
        ) : (
          <p className="mt-2 text-sm text-stone-500">
            This listing has never been hidden or overridden.
          </p>
        )}
      </div>

      {pendingAction && (
        <ModerationDialog
          action={pendingAction}
          productName={product.name}
          shopName={shop?.name ?? "Dukkan"}
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmModeration}
        />
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-stone-100 py-1 last:border-0">
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
