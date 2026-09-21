"use client";

import { OrderDetail } from "@/components/orders/OrderDetail";
import { useApp } from "@/context/AppContext";
import { useMotionRouter } from "@/lib/motion";
import Link from "next/link";

export function OrderDetailView({
  orderId,
  backHref,
  backLabel,
}: {
  orderId: string;
  backHref: string;
  backLabel: string;
}) {
  const { state, user } = useApp();
  const router = useMotionRouter();
  const order = state.orders.find((item) => item.id === orderId);
  const ownsShop = Boolean(
    user &&
      order &&
      state.shops.some(
        (shop) => shop.id === order.shopId && (shop.ownerUserId === user.id || user.role === "admin"),
      ),
  );
  const canView = Boolean(
    user && order && (user.role === "admin" || order.buyerId === user.id || ownsShop),
  );
  const mode = user?.role === "admin" || ownsShop ? "seller" : "buyer";

  if (!state.hydrated) {
    return <p className="text-sm text-stone-500">Loading…</p>;
  }

  if (!order || !canView) {
    return (
      <div>
        <Link href={backHref} className="text-sm underline">
          ← {backLabel}
        </Link>
        <p className="mt-6 text-sm text-stone-500">This order is not available.</p>
      </div>
    );
  }

  function close() {
    window.close();
    router.push(backHref);
  }

  return (
    <div className="max-w-3xl">
      <Link href={backHref} className="text-sm underline">
        ← {backLabel}
      </Link>
      <div className="mt-4">
        <OrderDetail order={order} mode={mode} onClose={close} layout="page" />
      </div>
    </div>
  );
}
