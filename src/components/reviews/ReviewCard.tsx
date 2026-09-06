"use client";

import { OrderIdButton } from "@/components/orders/OrderFacts";
import { FileButton } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { formatDate } from "@/lib/format";
import { fileToDataUrl } from "@/lib/images";
import type { Review } from "@/lib/types";
import type { ReactNode } from "react";
import { ReviewPhotos } from "./ReviewPhotos";

export function ReviewCard({
  review,
  productName,
  shopName,
  buyerName,
  paymentRefId,
  canAddPhotos = false,
  onOpenOrder,
  children,
}: {
  review: Review;
  productName?: string;
  shopName?: string;
  buyerName?: string;
  paymentRefId?: string;
  canAddPhotos?: boolean;
  onOpenOrder?: (orderId: string) => void;
  children?: ReactNode;
}) {
  const { dispatch } = useApp();

  async function onAddPhotos(files: FileList | null) {
    if (!files?.length) return;
    const urls: string[] = [];
    for (const file of Array.from(files).slice(0, 6)) {
      urls.push(await fileToDataUrl(file));
    }
    dispatch({ type: "addReviewPhotos", reviewId: review.id, imageUrls: urls });
  }

  return (
    <article className="rounded-2xl bg-white p-4">
      <p className="font-semibold">
        {review.rating} ★ · {review.title || productName || "Review"}
      </p>
      {productName && review.title && (
        <p className="text-xs text-stone-500">{productName}</p>
      )}
      {shopName && <p className="text-xs text-stone-500">{shopName}</p>}
      <p className="mt-1 text-sm text-stone-600">{review.body}</p>
      {(buyerName || review.orderId || paymentRefId) && (
        <p className="mt-2 text-xs text-stone-400">
          {buyerName ? `${buyerName} · ` : ""}
          {formatDate(review.createdAt)}
          {review.orderId ? " · " : ""}
          {review.orderId && (
            <OrderIdButton
              orderId={review.orderId}
              onOpen={onOpenOrder}
              className="underline decoration-stone-300 hover:decoration-ink"
            />
          )}
          {paymentRefId ? ` · ${paymentRefId}` : ""}
        </p>
      )}
      <ReviewPhotos urls={review.imageUrls} />
      {canAddPhotos && (review.imageUrls?.length ?? 0) < 8 && (
        <div className="mt-3">
          <FileButton
            accept="image/*"
            multiple
            buttonLabel="Add pictures"
            showFileName={false}
            onChange={(e) => void onAddPhotos(e.target.files)}
          />
        </div>
      )}
      {review.sellerReply && (
        <p className="mt-2 rounded-xl bg-cream px-3 py-2 text-sm">
          <span className="font-medium">Seller: </span>
          {review.sellerReply.body}
        </p>
      )}
      {children}
    </article>
  );
}
