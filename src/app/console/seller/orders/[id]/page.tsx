"use client";

import { OrderDetailView } from "@/components/orders/OrderDetailView";
import { sellerConsolePath } from "@/lib/routes";
import { useParams } from "next/navigation";

export default function SellerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = decodeURIComponent(params.id);

  return (
    <OrderDetailView
      orderId={orderId}
      backHref={sellerConsolePath("/orders")}
      backLabel="Back to orders"
    />
  );
}
