"use client";

import { OrderDetailView } from "@/components/orders/OrderDetailView";
import { adminConsolePath } from "@/lib/routes";
import { useParams } from "next/navigation";

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = decodeURIComponent(params.id);

  return (
    <OrderDetailView
      orderId={orderId}
      backHref={adminConsolePath("/tickets")}
      backLabel="Back to support"
    />
  );
}
