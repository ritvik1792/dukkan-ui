"use client";

import { Field, Select } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { partners } from "@/data/seed";
import { formatInr, titleCase } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: "accepted",
  accepted: "assigned",
  assigned: "out_for_delivery",
  out_for_delivery: "delivered",
};

export default function SellerOrders() {
  const { user, state, dispatch, shopById, catalogById } = useApp();
  if (!user) return null;
  const shopIds = new Set(
    state.shops
      .filter((s) => s.ownerUserId === user.id || user.role === "admin")
      .map((s) => s.id),
  );
  const orders = state.orders.filter((o) => shopIds.has(o.shopId));
  const relatedTickets = (orderId: string) =>
    state.tickets.filter((t) => t.orderId === orderId);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Orders</h1>
      <ul className="mt-6 space-y-3">
        {orders.map((order) => {
          const shop = shopById(order.shopId);
          const partnerManaged = order.deliveryMode === "partner";
          return (
            <li key={order.id} className="rounded-2xl bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{order.id}</p>
                  <p className="text-xs text-stone-500">
                    {shop?.name} · {order.deliveryMode} · {formatInr(order.total)}
                  </p>
                </div>
                <StatusPill>{titleCase(order.status)}</StatusPill>
              </div>
              <ul className="mt-2 text-sm">
                {order.items.map((item) => (
                  <li key={item.listingId}>
                    {catalogById(item.catalogProductId)?.name} × {item.quantity}
                  </li>
                ))}
              </ul>
              {partnerManaged ? (
                <div className="mt-3 max-w-xs">
                  <Field label="Assign partner">
                    <Select
                      value={order.partnerId ?? ""}
                      onChange={(e) =>
                        dispatch({
                          type: "assignPartner",
                          orderId: order.id,
                          partnerId: e.target.value,
                        })
                      }
                    >
                      <option value="">Choose rider</option>
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.vehicle}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              ) : (
                <p className="mt-3 text-sm text-stone-500">
                  Shop delivery — assign your own rider. No Dukkan partner on this order.
                </p>
              )}
              {nextStatus[order.status] && (
                <button
                  type="button"
                  className="mt-3 rounded-full bg-ink px-3 py-1 text-xs text-lime"
                  onClick={() =>
                    dispatch({
                      type: "setOrderStatus",
                      orderId: order.id,
                      status: nextStatus[order.status]!,
                    })
                  }
                >
                  Mark {titleCase(nextStatus[order.status]!)}
                </button>
              )}
              {relatedTickets(order.id).map((t) => (
                <p key={t.id} className="mt-2 text-xs text-amber-800">
                  Ticket {t.id}: {t.subject} ({t.status})
                </p>
              ))}
            </li>
          );
        })}
        {orders.length === 0 && <p className="text-sm text-stone-500">No orders.</p>}
      </ul>
    </div>
  );
}
