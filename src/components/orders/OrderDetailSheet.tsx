"use client";

import { OrderDetail } from "@/components/orders/OrderDetail";
import type { Order } from "@/lib/types";

export function OrderDetailSheet({
  order,
  mode,
  shown,
  onClose,
}: {
  order: Order;
  mode: "seller" | "buyer";
  shown: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close order details"
        onClick={onClose}
        className={`drawer-scrim absolute inset-0 bg-black/40 ${shown ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        className={`drawer-panel absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-cream shadow-2xl ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <OrderDetail order={order} mode={mode} onClose={onClose} />
      </aside>
    </div>
  );
}
