"use client";

import { OrderDetailView } from "@/components/orders/OrderDetailView";
import { useParams } from "next/navigation";

export default function AccountOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = decodeURIComponent(params.id);

  return (
    <OrderDetailView
      orderId={orderId}
      backHref="/account/orders"
      backLabel="Back to orders"
      mode="buyer"
    />
  );
}
