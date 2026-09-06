"use client";

import { OrderDetailSheet } from "@/components/orders/OrderDetailSheet";
import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { partners } from "@/data/seed";
import { formatDate, formatInr, paymentMethodLabel } from "@/lib/format";
import { normalizeOrderStatus, orderStatusLabel } from "@/lib/orders";
import { afterPaint } from "@/lib/drawer";
import { useEffect, useMemo, useState } from "react";

export default function AccountOrdersPage() {
  const { state, user, shopById, catalogById } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerShown, setDrawerShown] = useState(false);
  const orders = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin") return state.orders;
    if (user.role === "seller") {
      const shopIds = state.shops.filter((s) => s.ownerUserId === user.id).map((s) => s.id);
      return state.orders.filter((o) => shopIds.includes(o.shopId) || o.buyerId === user.id);
    }
    return state.orders.filter((o) => o.buyerId === user.id);
  }, [state.orders, state.shops, user]);
  const selected = orders.find((o) => o.id === selectedId);
  const ownsSelected = Boolean(
    user &&
      selected &&
      state.shops.some(
        (s) => s.id === selected.shopId && (s.ownerUserId === user.id || user.role === "admin"),
      ),
  );

  useEffect(() => {
    if (!selectedId) return;
    setDrawerShown(false);
    return afterPaint(() => setDrawerShown(true));
  }, [selectedId]);

  function closeSheet() {
    setDrawerShown(false);
    window.setTimeout(() => setSelectedId(null), 320);
  }

  return (
    <>
      <ul className="space-y-4">
        {orders.map((order) => {
          const shop = shopById(order.shopId);
          const partner = partners.find((p) => p.id === order.partnerId);
          const status = normalizeOrderStatus(order.status);
          return (
            <li key={order.id}>
              <button
                type="button"
                onClick={() => setSelectedId(order.id)}
                className="w-full rounded-2xl bg-white p-5 text-left transition hover:shadow-md"
              >
                <div className="flex justify-between gap-2">
                  <p className="font-semibold">{order.id}</p>
                  <StatusPill>{orderStatusLabel(status)}</StatusPill>
                </div>
                <p className="mt-1 text-sm text-stone-500">
                  {shop?.name} · {order.deliveryMode} · {formatInr(order.total)}
                  {order.paymentMethod ? ` · ${paymentMethodLabel(order.paymentMethod)}` : ""}
                  {order.paymentRefId ? ` · ${order.paymentRefId}` : ""} ·{" "}
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
              </button>
            </li>
          );
        })}
        {orders.length === 0 && <p className="text-sm text-stone-500">No orders yet.</p>}
      </ul>
      {selected && (
        <OrderDetailSheet
          order={selected}
          mode={ownsSelected ? "seller" : "buyer"}
          shown={drawerShown}
          onClose={closeSheet}
        />
      )}
    </>
  );
}
