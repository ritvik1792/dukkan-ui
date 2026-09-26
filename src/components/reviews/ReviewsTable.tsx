"use client";

import { OrderDetailSheet } from "@/components/orders/OrderDetailSheet";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ShopNameButton } from "@/components/shops/ShopPeek";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { TextArea } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { mapReview, patchReviewRequest, replyReviewRequest } from "@/lib/api";
import { afterPaint } from "@/lib/drawer";
import { formatDate } from "@/lib/format";
import type { Review } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export type ReviewRow = {
  review: Review;
  productName: string;
  shopName: string;
  buyerName: string;
  paymentRefId: string;
  replyState: string;
  status: string;
};

export function ReviewsTable({
  reviews,
  mode,
  hiddenColumns = [],
  emptyMessage = "No reviews match these filters.",
}: {
  reviews: Review[];
  mode: "seller" | "admin";
  /** Column ids to drop, e.g. the product column on a single-product page. */
  hiddenColumns?: string[];
  emptyMessage?: string;
}) {
  const { state, dispatch, catalogById, shopById } = useApp();
  const searchParams = useSearchParams();
  const reviewFromUrl = searchParams.get("review");
  const [openId, setOpenId] = useState<string | null>(reviewFromUrl);
  const [drawerShown, setDrawerShown] = useState(false);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [orderShown, setOrderShown] = useState(false);
  const [draft, setDraft] = useState("");

  const rows = useMemo<ReviewRow[]>(
    () =>
      reviews.map((review) => {
        const order = review.orderId
          ? state.orders.find((item) => item.id === review.orderId)
          : undefined;
        return {
          review,
          productName: catalogById(review.catalogProductId)?.name ?? "—",
          shopName: shopById(review.shopId)?.name ?? "—",
          buyerName: state.users.find((item) => item.id === review.buyerId)?.name ?? "—",
          paymentRefId: order?.paymentRefId ?? "",
          replyState: review.sellerReply ? "Replied" : "Needs reply",
          status: review.hidden ? "Taken down" : "Live",
        };
      }),
    [reviews, state.orders, state.users, catalogById, shopById],
  );

  useEffect(() => {
    if (reviewFromUrl) setOpenId(reviewFromUrl);
  }, [reviewFromUrl]);

  const open = rows.find((row) => row.review.id === openId);
  const openOrder = state.orders.find((order) => order.id === openOrderId);

  useEffect(() => {
    if (!openId) return;
    setDraft("");
    setDrawerShown(false);
    return afterPaint(() => setDrawerShown(true));
  }, [openId]);

  useEffect(() => {
    if (!openOrderId) return;
    setOrderShown(false);
    return afterPaint(() => setOrderShown(true));
  }, [openOrderId]);

  function closeDrawer() {
    setDrawerShown(false);
    window.setTimeout(() => setOpenId(null), 320);
  }

  function closeOrder() {
    setOrderShown(false);
    window.setTimeout(() => setOpenOrderId(null), 320);
  }

  function toggleHidden(review: Review) {
    const hidden = !review.hidden;
    dispatch({ type: "setReviewHidden", reviewId: review.id, hidden });
    void patchReviewRequest(review.id, { hidden })
      .then((updated) => dispatch({ type: "replaceReview", review: mapReview(updated) }))
      .catch(() => undefined);
  }

  async function sendReply(review: Review) {
    const body = draft.trim();
    if (!body) return;
    try {
      const updated = await replyReviewRequest(review.id, body);
      dispatch({ type: "replaceReview", review: mapReview(updated) });
    } catch {
      dispatch({ type: "replyReview", reviewId: review.id, body });
    }
    setDraft("");
  }

  const allColumns: Column<ReviewRow>[] = [
    {
      id: "review",
      header: "Review",
      value: (row) => row.review.title || row.review.body,
      filter: { kind: "text", placeholder: "Title or body contains…" },
      render: (row) => (
        <div className="max-w-xs">
          <p className="truncate font-medium">{row.review.title || "Review"}</p>
          <p className="truncate text-xs text-stone-400">{row.review.body}</p>
        </div>
      ),
    },
    {
      id: "rating",
      header: "Rating",
      value: (row) => row.review.rating,
      filter: { kind: "select", options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} ★` })) },
      align: "right",
      render: (row) => `${row.review.rating} ★`,
    },
    {
      id: "product",
      header: "Product",
      value: (row) => row.productName,
      filter: { kind: "select" },
    },
    {
      id: "shop",
      header: "Dukkan",
      value: (row) => row.shopName,
      filter: { kind: "select" },
      render: (row) => (
        <ShopNameButton shopId={row.review.shopId}>{row.shopName}</ShopNameButton>
      ),
    },
    {
      id: "buyer",
      header: "Customer",
      value: (row) => row.buyerName,
      filter: { kind: "select" },
    },
    {
      id: "order",
      header: "Order",
      value: (row) => row.review.orderId ?? "",
      filter: { kind: "text", placeholder: "Order id" },
      defaultHidden: true,
      render: (row) => row.review.orderId ?? "—",
    },
    {
      id: "photos",
      header: "Photos",
      value: (row) => row.review.imageUrls?.length ?? 0,
      filter: { kind: "range" },
      align: "right",
      defaultHidden: true,
    },
    {
      id: "reply",
      header: "Reply",
      value: (row) => row.replyState,
      filter: { kind: "select" },
      render: (row) => (
        <span className={row.review.sellerReply ? "text-xs" : "text-xs text-ember"}>
          {row.replyState}
        </span>
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
      id: "created",
      header: "Posted",
      value: (row) => row.review.createdAt,
      render: (row) => (
        <span className="text-xs text-stone-500">{formatDate(row.review.createdAt)}</span>
      ),
    },
  ];
  const columns = allColumns.filter((column) => !hiddenColumns.includes(column.id));

  return (
    <div>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.review.id}
        onRowClick={(row) => setOpenId(row.review.id)}
        searchPlaceholder="Search title, body, product, customer, order"
        searchText={(row) => `${row.review.body} ${row.review.id} ${row.paymentRefId}`}
        initialSort={{ columnId: "created", dir: "desc" }}
        emptyMessage={emptyMessage}
      />

      {open && (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Close review"
            onClick={closeDrawer}
            className={`drawer-scrim absolute inset-0 bg-black/40 ${drawerShown ? "opacity-100" : "opacity-0"}`}
          />
          <aside
            className={`drawer-panel absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-cream shadow-2xl ${
              drawerShown ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-start justify-between gap-3 border-b border-border bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">Review</h2>
                <p className="text-xs text-stone-500">
                  {open.productName} · {open.shopName}
                </p>
              </div>
              <button type="button" className="text-sm text-stone-500" onClick={closeDrawer}>
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <ReviewCard
                review={open.review}
                productName={open.productName}
                shopName={open.shopName}
                buyerName={open.buyerName}
                onOpenOrder={setOpenOrderId}
              >
                {mode === "admin" && (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className={`text-xs ${open.review.hidden ? "text-red-700" : "text-stone-400"}`}>
                      {open.review.hidden
                        ? "Taken down. Buyers cannot see this review."
                        : "Live on the product page."}
                    </p>
                    <button
                      type="button"
                      className="rounded-full border border-border px-3 py-1 text-xs"
                      onClick={() => toggleHidden(open.review)}
                    >
                      {open.review.hidden ? "Restore" : "Take down"}
                    </button>
                  </div>
                )}
                {mode === "seller" && open.review.hidden && (
                  <p className="mt-4 text-xs text-red-700">
                    Taken down by admin. Buyers cannot see this review.
                  </p>
                )}
                {mode === "seller" && !open.review.sellerReply && !open.review.hidden && (
                  <div className="mt-4">
                    <TextArea
                      rows={3}
                      placeholder="Reply to this review"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                    />
                    <button
                      type="button"
                      disabled={!draft.trim()}
                      className="mt-2 rounded-full bg-carrot px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                      onClick={() => void sendReply(open.review)}
                    >
                      Post reply
                    </button>
                  </div>
                )}
              </ReviewCard>
            </div>
          </aside>
        </div>
      )}

      {openOrder && (
        <OrderDetailSheet
          order={openOrder}
          mode={mode === "admin" ? "seller" : "buyer"}
          shown={orderShown}
          onClose={closeOrder}
        />
      )}
    </div>
  );
}
