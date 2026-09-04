"use client";

import { useApp } from "@/context/AppContext";

export default function AdminReviews() {
  const { state, shopById, catalogById } = useApp();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dukkan reviews</h1>
      <ul className="mt-6 space-y-3">
        {state.reviews.map((review) => (
          <li key={review.id} className="rounded-2xl bg-white p-4">
            <p className="font-semibold">
              {review.rating} ★ · {catalogById(review.catalogProductId)?.name}
            </p>
            <p className="text-xs text-stone-500">{shopById(review.shopId)?.name}</p>
            <p className="mt-2 text-sm">{review.body}</p>
            {review.sellerReply && (
              <p className="mt-2 text-sm text-stone-600">Seller: {review.sellerReply.body}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
