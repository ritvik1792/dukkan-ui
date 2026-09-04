"use client";

import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { partners } from "@/data/seed";
import { formatDate, formatInr, titleCase } from "@/lib/format";
import { useMemo } from "react";

export default function AccountOrdersPage() {
  const { state, user, shopById, catalogById } = useApp();
  const orders = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin") return state.orders;
    if (user.role === "seller") {
      const shopIds = state.shops.filter((s) => s.ownerUserId === user.id).map((s) => s.id);
      return state.orders.filter((o) => shopIds.includes(o.shopId) || o.buyerId === user.id);
    }
    return state.orders.filter((o) => o.buyerId === user.id);
  }, [state.orders, state.shops, user]);

  return (
    <ul className="space-y-4">
      {orders.map((order) => {
        const shop = shopById(order.shopId);
        const partner = partners.find((p) => p.id === order.partnerId);
        return (
          <li key={order.id} className="rounded-2xl bg-white p-5">
            <div className="flex justify-between gap-2">
              <p className="font-semibold">{order.id}</p>
              <StatusPill>{titleCase(order.status)}</StatusPill>
            </div>
            <p className="mt-1 text-sm text-stone-500">
              {shop?.name} · {order.deliveryMode} · {formatInr(order.total)} ·{" "}
              {formatDate(order.createdAt)}
            </p>
            {partner && (
              <p className="mt-1 text-xs text-stone-500">
                Partner: {partner.name} · {partner.vehicle}
              </p>
            )}
            <ul className="mt-3 text-sm">
              {order.items.map((item) => (
                <li key={item.listingId}>
                  {catalogById(item.catalogProductId)?.name} × {item.quantity}
                </li>
              ))}
            </ul>
          </li>
        );
      })}
      {orders.length === 0 && <p className="text-sm text-stone-500">No orders yet.</p>}
    </ul>
  );
}
