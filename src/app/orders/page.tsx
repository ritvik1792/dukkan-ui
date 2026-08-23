"use client";

import { useMemo } from "react";
import { useApp } from "@/context/AppContext";

export default function OrdersPage() {
  const { state, user, productById, shopById } = useApp();
  const orders = useMemo(
    () =>
      user.role === "admin"
        ? state.orders
        : user.role === "seller"
          ? state.orders.filter((o) => {
              const shopIds = state.shops
                .filter((s) => s.ownerUserId === user.id)
                .map((s) => s.id);
              return shopIds.includes(o.shopId);
            })
          : state.orders.filter((o) => o.buyerId === user.id),
    [state.orders, state.shops, user],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Orders</h1>
      <ul className="mt-6 space-y-4">
        {orders.map((order) => {
          const shop = shopById(order.shopId);
          return (
            <li key={order.id} className="rounded-2xl bg-white p-5">
              <div className="flex justify-between">
                <p className="font-semibold">{order.id}</p>
                <span className="rounded-full bg-lime/50 px-2 py-0.5 text-xs capitalize">
                  {order.status.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-1 text-sm text-stone-500">
                {shop?.name} · {order.deliveryMode} delivery · ₹{order.total}
              </p>
              <ul className="mt-3 text-sm">
                {order.items.map((item) => {
                  const p = productById(item.productId);
                  return (
                    <li key={item.productId}>
                      {p?.name} × {item.quantity}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
        {orders.length === 0 && (
          <p className="text-sm text-stone-500">No orders yet.</p>
        )}
      </ul>
    </div>
  );
}
