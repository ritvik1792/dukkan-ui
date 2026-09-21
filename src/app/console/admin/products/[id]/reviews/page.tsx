"use client";

import { ReviewsTable } from "@/components/reviews/ReviewsTable";
import { StatCard } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { adminConsolePath } from "@/lib/routes";
import { reviewStats, starRow } from "@/services/reviews";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export default function AdminProductReviews() {
  const params = useParams<{ id: string }>();
  const { state, shopById, catalogById } = useApp();

  const listing = state.listings.find((item) => item.id === params.id);
  const product = listing ? catalogById(listing.catalogProductId) : undefined;

  const reviews = useMemo(
    () =>
      listing
        ? state.reviews.filter(
            (review) => review.catalogProductId === listing.catalogProductId,
          )
        : [],
    [state.reviews, listing],
  );
  const stats = useMemo(() => reviewStats(reviews), [reviews]);

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

  return (
    <div>
      <Link href={adminConsolePath(`/products/${listing.id}`)} className="text-sm underline">
        ← Back to {product.name}
      </Link>

      <h1 className="mt-3 text-2xl font-semibold">Reviews for {product.name}</h1>
      <p className="mt-1 text-sm text-stone-500">
        Every review across all dukkans selling this product. Sold here by{" "}
        {shopById(listing.shopId)?.name ?? "an unknown dukkan"}.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Average rating"
          value={stats.visibleCount ? `${stats.average} ★` : "—"}
          hint={starRow(stats.average)}
        />
        <StatCard
          label="Total reviews"
          value={stats.count}
          hint={`${stats.visibleCount} live · ${stats.hiddenCount} taken down`}
        />
        <StatCard label="Awaiting seller reply" value={stats.awaitingReply} />
        <StatCard label="With photos" value={stats.withPhotos} />
      </div>

      <div className="mt-6">
        <ReviewsTable
          reviews={reviews}
          mode="admin"
          hiddenColumns={["product"]}
          emptyMessage="No reviews for this product yet."
        />
      </div>
    </div>
  );
}
