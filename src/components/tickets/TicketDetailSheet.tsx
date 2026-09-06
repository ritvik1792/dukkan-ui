"use client";

import { OrderDetailSheet } from "@/components/orders/OrderDetailSheet";
import { OrderIdButton, OrderLineItems, OrderPaymentFacts } from "@/components/orders/OrderFacts";
import { TicketPhotoGrid } from "@/components/tickets/TicketPhotos";
import { TicketThread } from "@/components/tickets/TicketThread";
import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { afterPaint } from "@/lib/drawer";
import { formatDate, formatInr, titleCase } from "@/lib/format";
import { normalizeOrderStatus, orderStatusLabel } from "@/lib/orders";
import type { Ticket } from "@/lib/types";
import { useEffect, useState } from "react";

export function TicketDetailSheet({
  ticket,
  shown,
  canAssign = false,
  onClose,
}: {
  ticket: Ticket;
  shown: boolean;
  canAssign?: boolean;
  onClose: () => void;
}) {
  const { state, user, shopById, listingById, catalogById } = useApp();
  const shop = shopById(ticket.shopId ?? "");
  const buyer = state.users.find((u) => u.id === ticket.buyerId);
  const listing = ticket.listingId ? listingById(ticket.listingId) : undefined;
  const product = listing ? catalogById(listing.catalogProductId) : undefined;
  const assigned = state.users.find((u) => u.id === ticket.assignedToUserId);
  const issue = ticket.messages[0];
  const order = ticket.orderId
    ? state.orders.find((item) => item.id === ticket.orderId)
    : undefined;
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderShown, setOrderShown] = useState(false);

  useEffect(() => {
    if (!orderOpen) return;
    setOrderShown(false);
    return afterPaint(() => setOrderShown(true));
  }, [orderOpen]);

  function openOrder() {
    if (!order) return;
    setOrderOpen(true);
  }

  function closeOrder() {
    setOrderShown(false);
    window.setTimeout(() => setOrderOpen(false), 320);
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close ticket"
        onClick={onClose}
        className={`drawer-scrim absolute inset-0 bg-black/40 ${shown ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        className={`drawer-panel absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-cream shadow-2xl ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-stone-200 bg-white px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-stone-400">Ticket</p>
            <h2 className="text-lg font-semibold">{ticket.subject}</h2>
            <p className="mt-1 text-xs text-stone-500">
              {ticket.id}
              {ticket.orderId ? " · " : ""}
              {ticket.orderId && (
                <OrderIdButton
                  orderId={ticket.orderId}
                  onOpen={order ? () => openOrder() : undefined}
                />
              )}
              {order?.paymentRefId ? ` · ${order.paymentRefId}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill>
              {ticket.hidden ? "taken down" : `${ticket.kind} · ${titleCase(ticket.status)}`}
            </StatusPill>
            <button type="button" className="text-sm text-stone-500" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <section className="rounded-2xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              What was the issue
            </p>
            <p className="mt-2 text-sm whitespace-pre-wrap">
              {issue?.body ?? "No details were added."}
            </p>
            {issue?.imageUrls?.length ? <TicketPhotoGrid urls={issue.imageUrls} /> : null}
            {issue && (
              <p className="mt-2 text-xs text-stone-400">
                Opened {formatDate(issue.createdAt)}
                {buyer ? ` by ${buyer.name}` : ""}
              </p>
            )}
          </section>

          <section className="rounded-2xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Review</p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-stone-400">Customer</dt>
                <dd>{buyer?.name ?? "Unknown"}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400">Dukkan</dt>
                <dd>{shop?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400">Assigned to</dt>
                <dd>{assigned?.name ?? "Unassigned"}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400">Opened</dt>
                <dd>{formatDate(ticket.createdAt)}</dd>
              </div>
              {ticket.orderId && (
                <div>
                  <dt className="text-xs text-stone-400">Order</dt>
                  <dd>
                    <OrderIdButton
                      orderId={ticket.orderId}
                      onOpen={order ? () => openOrder() : undefined}
                    />
                  </dd>
                </div>
              )}
              {product && (
                <div>
                  <dt className="text-xs text-stone-400">Product</dt>
                  <dd>{product.name}</dd>
                </div>
              )}
            </dl>
          </section>

          {order ? (
            <section className="rounded-2xl bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Linked order
                </p>
                <button
                  type="button"
                  className="text-xs underline decoration-stone-300 hover:decoration-ink"
                  onClick={openOrder}
                >
                  Open full order
                </button>
              </div>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-stone-400">Order ID</dt>
                  <dd>
                    <OrderIdButton orderId={order.id} onOpen={() => openOrder()} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-400">Status</dt>
                  <dd>{orderStatusLabel(normalizeOrderStatus(order.status))}</dd>
                </div>
                <OrderPaymentFacts order={order} />
                <div>
                  <dt className="text-xs text-stone-400">Placed</dt>
                  <dd>{formatDate(order.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-400">Total</dt>
                  <dd className="font-semibold">{formatInr(order.total)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-stone-400">Deliver to</dt>
                  <dd>{order.address}</dd>
                </div>
              </dl>
              <OrderLineItems order={order} />
            </section>
          ) : (
            <section className="rounded-2xl bg-white p-4 text-sm text-stone-500">
              No order is linked to this ticket.
            </section>
          )}

          <section className="rounded-2xl bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Chat
            </p>
            <TicketThread
              ticket={ticket}
              canAssign={canAssign}
              canReply
              variant="plain"
              onOpenOrder={order ? () => openOrder() : undefined}
            />
          </section>
        </div>
      </aside>

      {order && orderOpen && (
        <div className="relative z-[60]">
          <OrderDetailSheet
            order={order}
            mode={user?.role === "buyer" ? "buyer" : "seller"}
            shown={orderShown}
            onClose={closeOrder}
          />
        </div>
      )}
    </div>
  );
}
