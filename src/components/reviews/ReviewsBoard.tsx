"use client";

import { ReviewsTable } from "@/components/reviews/ReviewsTable";
import { StatCard } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { reviewStats } from "@/services/reviews";
import { useMemo } from "react";

export function ReviewsBoard({ mode }: { mode: "seller" | "admin" }) {
  const { user, state } = useApp();

  const shopIds = useMemo(
    () =>
      new Set(
        state.shops
          .filter(
            (s) => user && (mode === "admin" || s.ownerUserId === user.id || user.role === "admin"),
          )
          .map((s) => s.id),
      ),
    [state.shops, user, mode],
  );

  const reviews = useMemo(
    () =>
      mode === "admin"
        ? state.reviews
        : state.reviews.filter((review) => shopIds.has(review.shopId)),
    [state.reviews, mode, shopIds],
  );
  const stats = useMemo(() => reviewStats(reviews), [reviews]);

  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-semibold">{mode === "admin" ? "Dukkan reviews" : "Reviews"}</h1>
      <p className="mt-1 text-sm text-stone-500">
        {mode === "admin"
          ? "Sort and filter every review by rating, product, dukkan, customer, or reply state. Open a row to read it or take it down."
          : "Sort and filter your reviews by rating, product, customer, or reply state. Open a row to read it and reply."}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Average rating"
          value={stats.visibleCount ? `${stats.average} ★` : "—"}
          hint={`${stats.visibleCount} live review${stats.visibleCount === 1 ? "" : "s"}`}
        />
        <StatCard label="Total reviews" value={stats.count} />
        <StatCard label="Awaiting reply" value={stats.awaitingReply} />
        <StatCard
          label={mode === "admin" ? "Taken down" : "Hidden by admin"}
          value={stats.hiddenCount}
        />
      </div>

      <div className="mt-6">
        <ReviewsTable
          reviews={reviews}
          mode={mode}
          hiddenColumns={mode === "seller" ? ["shop"] : []}
        />
      </div>
    </div>
  );
}
