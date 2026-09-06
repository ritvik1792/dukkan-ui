"use client";

import { OrderDetailSheet } from "@/components/orders/OrderDetailSheet";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { afterPaint } from "@/lib/drawer";
import type { Review } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

export function ReviewsBoard({ mode }: { mode: "seller" | "admin" }) {
  const { user, state, dispatch, catalogById, shopById } = useApp();
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [replyFilter, setReplyFilter] = useState("");
  const [shopFilter, setShopFilter] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [sheetShown, setSheetShown] = useState(false);

  const shopIds = useMemo(
    () =>
      new Set(
        state.shops
          .filter((s) => user && (mode === "admin" || s.ownerUserId === user.id || user.role === "admin"))
          .map((s) => s.id),
      ),
    [state.shops, user, mode],
  );
  const shops = useMemo(
    () => state.shops.filter((s) => shopIds.has(s.id)),
    [state.shops, shopIds],
  );

  const reviews = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.reviews.filter((review) => {
      if (mode === "seller" && !shopIds.has(review.shopId)) return false;
      if (shopFilter && review.shopId !== shopFilter) return false;
      if (ratingFilter && review.rating !== Number(ratingFilter)) return false;
      if (replyFilter === "replied" && !review.sellerReply) return false;
      if (replyFilter === "awaiting" && review.sellerReply) return false;
      if (!q) return true;
      const product = catalogById(review.catalogProductId)?.name ?? "";
      const shop = shopById(review.shopId)?.name ?? "";
      const buyer = state.users.find((u) => u.id === review.buyerId)?.name ?? "";
      const order = review.orderId
        ? state.orders.find((item) => item.id === review.orderId)
        : undefined;
      return `${review.title} ${review.body} ${review.id} ${review.orderId ?? ""} ${order?.paymentRefId ?? ""} ${product} ${shop} ${buyer}`
        .toLowerCase()
        .includes(q);
    });
  }, [
    state.reviews,
    state.orders,
    state.users,
    mode,
    shopIds,
    shopFilter,
    ratingFilter,
    replyFilter,
    search,
    catalogById,
    shopById,
  ]);

  const openOrder = state.orders.find((order) => order.id === openOrderId);

  useEffect(() => {
    if (!openOrderId) return;
    setSheetShown(false);
    return afterPaint(() => setSheetShown(true));
  }, [openOrderId]);

  function closeOrder() {
    setSheetShown(false);
    window.setTimeout(() => setOpenOrderId(null), 320);
  }

  function reply(review: Review) {
    const body = drafts[review.id]?.trim();
    if (!body) return;
    dispatch({ type: "replyReview", reviewId: review.id, body });
  }

  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-semibold">{mode === "admin" ? "Dukkan reviews" : "Reviews"}</h1>
      <p className="mt-1 text-sm text-stone-500">
        {mode === "admin"
          ? "Monitor every review. Take one down if it should not stay on the storefront."
          : "Search by product, customer, order, or comment. Open a linked order to see payment and items."}
      </p>
      <div className={`mt-4 grid gap-3 ${mode === "admin" ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-3"}`}>
        <Field label="Search">
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Product, customer, order"
          />
        </Field>
        <Field label="Rating">
          <Select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} ★
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Reply">
          <Select value={replyFilter} onChange={(e) => setReplyFilter(e.target.value)}>
            <option value="">All reviews</option>
            <option value="awaiting">Needs reply</option>
            <option value="replied">Replied</option>
          </Select>
        </Field>
        {mode === "admin" && (
          <Field label="Dukkan">
            <Select value={shopFilter} onChange={(e) => setShopFilter(e.target.value)}>
              <option value="">All shops</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      <ul className="mt-6 space-y-3">
        {reviews.map((review) => {
          const buyer = state.users.find((u) => u.id === review.buyerId);
          const shop = shopById(review.shopId);
          const order = review.orderId
            ? state.orders.find((item) => item.id === review.orderId)
            : undefined;
          const canReply = mode === "seller" && !review.sellerReply && !review.hidden;
          return (
            <li key={review.id}>
              <ReviewCard
                review={review}
                productName={catalogById(review.catalogProductId)?.name}
                shopName={shop?.name}
                buyerName={buyer?.name}
                paymentRefId={order?.paymentRefId}
                onOpenOrder={setOpenOrderId}
              >
                {mode === "seller" && review.hidden && (
                  <p className="mt-3 text-xs text-red-700">Taken down by admin. Buyers cannot see this review.</p>
                )}
                {mode === "admin" && (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    {review.hidden ? (
                      <p className="text-xs text-red-700">Taken down. Buyers cannot see this review.</p>
                    ) : (
                      <p className="text-xs text-stone-400">Live on the product page.</p>
                    )}
                    <button
                      type="button"
                      className="rounded-full border border-stone-200 px-3 py-1 text-xs"
                      onClick={() =>
                        dispatch({
                          type: "setReviewHidden",
                          reviewId: review.id,
                          hidden: !review.hidden,
                        })
                      }
                    >
                      {review.hidden ? "Restore" : "Take down"}
                    </button>
                  </div>
                )}
                {canReply ? (
                  <div className="mt-3">
                    <TextArea
                      rows={2}
                      placeholder="Reply to this review"
                      value={drafts[review.id] ?? ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [review.id]: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="mt-2 rounded-full bg-ink px-3 py-1 text-xs text-lime"
                      onClick={() => reply(review)}
                    >
                      Post reply
                    </button>
                  </div>
                ) : !review.sellerReply ? (
                  <p className="mt-2 text-xs text-stone-400">No seller reply yet.</p>
                ) : null}
              </ReviewCard>
            </li>
          );
        })}
        {reviews.length === 0 && (
          <p className="text-sm text-stone-500">No reviews match these filters.</p>
        )}
      </ul>

      {openOrder && (
        <OrderDetailSheet
          order={openOrder}
          mode={mode === "admin" || user.role === "admin" ? "seller" : "buyer"}
          shown={sheetShown}
          onClose={closeOrder}
        />
      )}
    </div>
  );
}
