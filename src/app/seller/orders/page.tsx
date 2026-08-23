"use client";

import { useApp } from "@/context/AppContext";
import type { OrderStatus } from "@/lib/types";

const nextStatus: Record<string, OrderStatus | undefined> = {
  placed: "accepted",
  accepted: "out_for_delivery",
  out_for_delivery: "delivered",
};

export default function SellerOrders() {
  const { user, state, dispatch, shopById, productById } = useApp();
  const shopIds = new Set(
    state.shops
      .filter((s) => s.ownerUserId === user.id || user.role === "admin")
      .map((s) => s.id),
  );
  const orders = state.orders.filter((o) => shopIds.has(o.shopId));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Shop orders</h1>
      <ul className="mt-6 space-y-3">
        {orders.map((order) => (
          <li key={order.id} className="rounded-2xl bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{order.id}</p>
                <p className="text-xs text-stone-500">
                  {shopById(order.shopId)?.name} · {order.deliveryMode} · ₹{order.total}
                </p>
              </div>
              {nextStatus[order.status] && (
                <button
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: "setOrderStatus",
                      orderId: order.id,
                      status: nextStatus[order.status]!,
                    })
                  }
                  className="rounded-full bg-ink px-3 py-1 text-xs text-lime"
                >
                  Mark {nextStatus[order.status]?.replaceAll("_", " ")}
                </button>
              )}
            </div>
            <ul className="mt-2 text-sm">
              {order.items.map((item) => (
                <li key={item.productId}>
                  {productById(item.productId)?.name} × {item.quantity}
                </li>
              ))}
            </ul>
          </li>
        ))}
        {orders.length === 0 && <p className="text-sm text-stone-500">No orders.</p>}
      </ul>
    </div>
  );
}
