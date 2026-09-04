"use client";

import { TextArea } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { useState } from "react";

export default function SellerReviewsPage() {
  const { user, state, dispatch, catalogById } = useApp();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  if (!user) return null;
  const shopIds = new Set(
    state.shops.filter((s) => s.ownerUserId === user.id).map((s) => s.id),
  );
  const reviews = state.reviews.filter((r) => shopIds.has(r.shopId));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Reviews</h1>
      <ul className="mt-6 space-y-3">
        {reviews.map((review) => (
          <li key={review.id} className="rounded-2xl bg-white p-4">
            <p className="font-semibold">
              {review.rating} ★ · {catalogById(review.catalogProductId)?.name}
            </p>
            <p className="mt-1 text-sm">{review.body}</p>
            {review.sellerReply ? (
              <p className="mt-2 text-sm text-stone-600">You: {review.sellerReply.body}</p>
            ) : (
              <div className="mt-3">
                <TextArea
                  rows={2}
                  placeholder="Reply to this review"
                  value={drafts[review.id] ?? ""}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [review.id]: e.target.value }))
                  }
                />
                <button
                  type="button"
                  className="mt-2 rounded-full bg-ink px-3 py-1 text-xs text-lime"
                  onClick={() => {
                    const body = drafts[review.id]?.trim();
                    if (!body) return;
                    dispatch({ type: "replyReview", reviewId: review.id, body });
                  }}
                >
                  Post reply
                </button>
              </div>
            )}
          </li>
        ))}
        {reviews.length === 0 && <p className="text-sm text-stone-500">No reviews yet.</p>}
      </ul>
    </div>
  );
}
