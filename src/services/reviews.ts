import type { Review } from "@/lib/types";

export type RatingBucket = { rating: number; count: number; share: number };

export type ReviewStats = {
  count: number;
  visibleCount: number;
  hiddenCount: number;
  average: number;
  withPhotos: number;
  awaitingReply: number;
  buckets: RatingBucket[];
  latestAt?: string;
};

/** Rolls a set of reviews into the numbers the admin product page shows. */
export function reviewStats(reviews: Review[]): ReviewStats {
  const visible = reviews.filter((review) => !review.hidden);
  const total = visible.reduce((sum, review) => sum + review.rating, 0);
  const buckets = [5, 4, 3, 2, 1].map((rating) => {
    const count = visible.filter((review) => review.rating === rating).length;
    return {
      rating,
      count,
      share: visible.length ? Math.round((count / visible.length) * 100) : 0,
    };
  });
  const latestAt = reviews
    .map((review) => review.createdAt)
    .sort((a, b) => b.localeCompare(a))[0];

  return {
    count: reviews.length,
    visibleCount: visible.length,
    hiddenCount: reviews.length - visible.length,
    average: visible.length ? Math.round((total / visible.length) * 10) / 10 : 0,
    withPhotos: reviews.filter((review) => (review.imageUrls?.length ?? 0) > 0).length,
    awaitingReply: reviews.filter((review) => !review.sellerReply && !review.hidden).length,
    buckets,
    latestAt,
  };
}

/** "★★★★☆" for a rating, rounded to the nearest whole star. */
export function starRow(rating: number, max = 5) {
  const filled = Math.round(rating);
  return "★".repeat(Math.min(filled, max)) + "☆".repeat(Math.max(0, max - filled));
}

export function reviewsForProduct(reviews: Review[], catalogProductId: string) {
  return reviews.filter((review) => review.catalogProductId === catalogProductId);
}

export function reviewsForListing(reviews: Review[], listingId: string) {
  return reviews.filter((review) => review.listingId === listingId);
}
