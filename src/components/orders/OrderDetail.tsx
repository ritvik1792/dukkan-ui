"use client";

import { ReviewCard } from "@/components/reviews/ReviewCard";
import { WriteReviewForm } from "@/components/reviews/WriteReviewForm";
import { OrderLineItems, OrderPaymentFacts } from "@/components/orders/OrderFacts";
import { TicketThread } from "@/components/tickets/TicketThread";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/StatCard";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { fetchSellerPartners, mapOrder, patchOrderRequest } from "@/lib/api";
import { formatDate, formatInr } from "@/lib/format";
import {
  fromDatetimeLocal,
  nextOrderAdvance,
  normalizeOrderStatus,
  orderStatusLabel,
  orderTimeline,
  toDatetimeLocal,
} from "@/lib/orders";
import type { Order, Partner } from "@/lib/types";
import { useEffect, useState } from "react";

export function OrderDetail({
  order,
  mode,
  onClose,
  layout = "drawer",
}: {
  order: Order;
  mode: "seller" | "buyer";
  onClose?: () => void;
  layout?: "drawer" | "page";
}) {
  const { state, dispatch, user, shopById, catalogById } = useApp();
  const { showAlert } = useAlert();
  const shop = shopById(order.shopId);
  const buyer = state.users.find((u) => u.id === order.buyerId);
  const partner = state.partners.find((p) => p.id === order.partnerId);
  const [shopRiders, setShopRiders] = useState<Partner[]>([]);
  const status = normalizeOrderStatus(order.status);
  const delivered = status === "delivered";
  const advance = nextOrderAdvance(status);
  const timeline = orderTimeline(order);
  const tickets = state.tickets.filter((t) => t.orderId === order.id);
  const reviews = state.reviews.filter((r) => r.orderId === order.id);
  const [packingBy, setPackingBy] = useState(toDatetimeLocal(order.packingBy));
  const [readyBy, setReadyBy] = useState(toDatetimeLocal(order.readyBy));
  const [deliverBy, setDeliverBy] = useState(toDatetimeLocal(order.deliverBy));
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({});
  const drawer = layout === "drawer";

  useEffect(() => {
    setPackingBy(toDatetimeLocal(order.packingBy));
    setReadyBy(toDatetimeLocal(order.readyBy));
    setDeliverBy(toDatetimeLocal(order.deliverBy));
  }, [order.id, order.packingBy, order.readyBy, order.deliverBy]);

  useEffect(() => {
    if (mode !== "seller") return;
    let cancelled = false;
    fetchSellerPartners(order.shopId)
      .then((rows) => {
        if (!cancelled) setShopRiders(rows);
      })
      .catch(() => {
        if (!cancelled) setShopRiders(state.partners);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, order.shopId, state.partners]);

  function advanceOrder() {
    if (!advance) return;
    if (advance.status === "out_for_delivery" && order.deliveryMode === "partner" && !order.partnerId) {
      showAlert({
        tone: "warning",
        title: "Pick a rider first",
        message: "Partner orders need a rider before they can be given to delivery.",
      });
      return;
    }
    dispatch({ type: "setOrderStatus", orderId: order.id, status: advance.status });
    void patchOrderRequest(order.id, { status: advance.status })
      .then((updated) => dispatch({ type: "upsertOrder", order: mapOrder(updated) }))
      .catch(() => undefined);
  }

  function saveSchedule() {
    const next = {
      packingBy: fromDatetimeLocal(packingBy),
      readyBy: fromDatetimeLocal(readyBy),
      deliverBy: fromDatetimeLocal(deliverBy),
    };
    dispatch({
      type: "setOrderSchedule",
      orderId: order.id,
      ...next,
    });
    void patchOrderRequest(order.id, next)
      .then((updated) => dispatch({ type: "upsertOrder", order: mapOrder(updated) }))
      .catch(() => undefined);
    showAlert({ tone: "success", title: "Timelines saved" });
  }

  return (
    <>
      <div
        className={
          drawer
            ? "flex items-start justify-between gap-3 border-b border-border bg-white px-5 py-4"
            : "flex items-start justify-between gap-3"
        }
      >
        <div>
          <p className="text-xs uppercase tracking-wider text-stone-400">Order</p>
          <h2 className={drawer ? "text-lg font-semibold" : "text-2xl font-semibold"}>{order.id}</h2>
          <p className="mt-1 text-xs text-stone-500">
            {shop?.name} · {order.deliveryMode === "partner" ? "Partner" : "Shop delivery"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill>{orderStatusLabel(status)}</StatusPill>
          {onClose && (
            <button type="button" className="text-sm text-stone-500" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>

      <div className={drawer ? "min-h-0 flex-1 space-y-5 overflow-y-auto p-5" : "mt-5 space-y-5"}>
        <section className="rounded-2xl bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Details</p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {mode === "seller" && (
              <div>
                <dt className="text-xs text-stone-400">Customer</dt>
                <dd>{buyer?.name ?? order.buyerId}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-stone-400">Payment</dt>
              <dd>
                {order.paymentStatus === "paid"
                  ? "Paid"
                  : order.paymentMethod === "cod" || order.paymentStatus === "cod"
                    ? "Cash on delivery"
                    : "Pending"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-stone-400">Delivery fee</dt>
              <dd>{formatInr(order.deliveryFee)}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-400">Placed</dt>
              <dd>{formatDate(order.createdAt)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-stone-400">Deliver to</dt>
              <dd>{order.address}</dd>
            </div>
            <OrderPaymentFacts order={order} />
            <div>
              <dt className="text-xs text-stone-400">Items</dt>
              <dd>{formatInr(order.subtotal)}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-400">Total</dt>
              <dd className="font-semibold">{formatInr(order.total)}</dd>
            </div>
          </dl>
          <OrderLineItems order={order} />
        </section>

        {mode === "seller" && (
          <section className="rounded-2xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Set timelines
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Packing by">
                <TextInput
                  type="datetime-local"
                  value={packingBy}
                  onChange={(e) => setPackingBy(e.target.value)}
                />
              </Field>
              <Field label="Ready by">
                <TextInput
                  type="datetime-local"
                  value={readyBy}
                  onChange={(e) => setReadyBy(e.target.value)}
                />
              </Field>
              <Field label="Deliver by">
                <TextInput
                  type="datetime-local"
                  value={deliverBy}
                  onChange={(e) => setDeliverBy(e.target.value)}
                />
              </Field>
            </div>
            <button
              type="button"
              className="mt-3 rounded-full border border-border px-3 py-1.5 text-xs"
              onClick={saveSchedule}
            >
              Save timelines
            </button>
            {order.deliveryMode === "partner" ? (
              <div className="mt-3 max-w-xs">
                <Field label="Give to rider">
                  <Select
                    value={order.partnerId ?? ""}
                    onChange={(e) => {
                      const partnerId = e.target.value;
                      dispatch({
                        type: "assignPartner",
                        orderId: order.id,
                        partnerId,
                      });
                      void patchOrderRequest(order.id, { partnerId })
                        .then((updated) =>
                          dispatch({ type: "upsertOrder", order: mapOrder(updated) }),
                        )
                        .catch(() => undefined);
                    }}
                  >
                    <option value="">Choose rider</option>
                    {(shopRiders.length ? shopRiders : state.partners).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.vehicle}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            ) : (
              <p className="mt-3 text-sm text-stone-500">
                Shop delivery — hand this to your own rider when it is ready.
              </p>
            )}
            {advance && (
              <button
                type="button"
                className="mt-4 w-full rounded-full bg-carrot px-4 py-2.5 text-sm font-semibold text-white"
                onClick={advanceOrder}
              >
                {advance.label}
              </button>
            )}
          </section>
        )}

        {mode === "buyer" && (
          <section className="rounded-2xl bg-white p-4 text-sm">
            {partner && (
              <p>
                Rider: {partner.name} · {partner.vehicle}
              </p>
            )}
            {order.deliverBy && (
              <p className="mt-1 text-stone-500">Promised by {formatDate(order.deliverBy)}</p>
            )}
          </section>
        )}

        <section className="rounded-2xl bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Timeline</p>
          <ol className="mt-3 space-y-3">
            {timeline.map((event, index) => {
              const planned =
                event.status === "packing"
                  ? order.packingBy
                  : event.status === "ready_for_delivery"
                    ? order.readyBy
                    : event.status === "out_for_delivery" || event.status === "delivered"
                      ? order.deliverBy
                      : undefined;
              return (
                <li key={`${event.status}-${event.at}`} className="flex gap-3">
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                      index === timeline.length - 1 ? "bg-carrot" : "bg-stone-300"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">{orderStatusLabel(event.status)}</p>
                    <p className="text-xs text-stone-500">{formatDate(event.at)}</p>
                    {mode === "seller" && planned && (
                      <p className="text-xs text-stone-400">Planned {formatDate(planned)}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {(delivered || tickets.length > 0) && (
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
              {delivered ? "After delivery" : "Tickets"}
            </p>
            {tickets.length === 0 ? (
              <p className="rounded-2xl bg-white p-4 text-sm text-stone-500">
                No tickets opened on this order.
              </p>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <TicketThread
                    key={ticket.id}
                    ticket={ticket}
                    canAssign={mode === "seller"}
                    canReply={Boolean(user)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {delivered && (
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Reviews
            </p>
            {reviews.length === 0 && mode !== "buyer" && (
              <p className="rounded-2xl bg-white p-4 text-sm text-stone-500">
                No review on this order yet.
              </p>
            )}
            {mode === "buyer" &&
              user?.id === order.buyerId &&
              order.items
                .filter(
                  (item) =>
                    !reviews.some(
                      (review) =>
                        review.listingId === item.listingId ||
                        review.catalogProductId === item.catalogProductId,
                    ),
                )
                .map((item) => (
                  <div key={item.listingId} className="mb-3">
                    <WriteReviewForm
                      catalogProductId={item.catalogProductId}
                      listingId={item.listingId}
                      shopId={order.shopId}
                      orderId={order.id}
                      productName={catalogById(item.catalogProductId)?.name}
                    />
                  </div>
                ))}
            {reviews.length > 0 && (
              <ul className="space-y-3">
                {reviews.map((review) => (
                  <li key={review.id}>
                    <ReviewCard
                      review={review}
                      productName={catalogById(review.catalogProductId)?.name}
                      canAddPhotos={mode === "buyer" && user?.id === review.buyerId}
                    >
                      {!review.sellerReply && mode === "seller" ? (
                        <div className="mt-3">
                          <TextArea
                            rows={2}
                            placeholder="Reply to this review"
                            value={reviewDrafts[review.id] ?? ""}
                            onChange={(e) =>
                              setReviewDrafts((d) => ({ ...d, [review.id]: e.target.value }))
                            }
                          />
                          <button
                            type="button"
                            className="mt-2 rounded-full bg-carrot px-3 py-1.5 text-xs font-semibold text-white"
                            onClick={() => {
                              const body = reviewDrafts[review.id]?.trim();
                              if (!body) return;
                              dispatch({ type: "replyReview", reviewId: review.id, body });
                            }}
                          >
                            Post reply
                          </button>
                        </div>
                      ) : null}
                    </ReviewCard>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </>
  );
}
