"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { formatInr } from "@/lib/format";
import { createId } from "@/lib/ids";
import { cartShipments, cartSummary, deliveryCountLabel } from "@/services/cart";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function CheckoutForm() {
  const { state, user, neighborhood, listingById, shopById, catalogById, dispatch } = useApp();
  const { showAlert } = useAlert();
  const router = useRouter();
  const [address, setAddress] = useState(`Near ${neighborhood.name}, ${neighborhood.area}`);

  const shipments = useMemo(
    () =>
      cartShipments({
        cart: state.cart,
        listingById,
        shopById,
        catalogById,
      }),
    [state.cart, listingById, shopById, catalogById],
  );
  const summary = cartSummary(shipments);

  if (state.cart.length === 0) {
    return <p className="p-8 text-sm">Cart is empty.</p>;
  }

  function place() {
    if (!user) return;
    for (const shipment of shipments) {
      dispatch({
        type: "placeOrder",
        order: {
          id: createId("ORD").toUpperCase(),
          buyerId: user.id,
          shopId: shipment.shop.id,
          items: shipment.lines.map(({ item, listing }, index) => ({
            listingId: listing.id,
            catalogProductId: listing.catalogProductId,
            quantity: item.quantity,
            unitPrice: listing.sellerPrice,
            deliveryMode: shipment.deliveryMode,
            // Delivery is charged once per seller, so only the first line carries the fee.
            deliveryFee: index === 0 ? shipment.deliveryFee : 0,
          })),
          deliveryMode: shipment.deliveryMode,
          status: "placed",
          subtotal: shipment.subtotal,
          deliveryFee: shipment.deliveryFee,
          total: shipment.total,
          createdAt: new Date().toISOString(),
          address,
        },
      });
    }
    showAlert({
      tone: "success",
      title: "Order placed",
      message: `Arriving in ${deliveryCountLabel(shipments.length)}`,
      action: { href: "/account/orders", label: "Track orders" },
    });
    router.push("/account/orders");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <p className="mt-1 text-sm text-stone-500">
        Mock checkout. Payments will move to Spring Boot later.
      </p>
      <label className="mt-6 block text-sm font-medium">
        Deliver to
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-stone-200 p-3"
          rows={3}
        />
      </label>

      <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
        <p className="font-semibold">
          Arriving in {deliveryCountLabel(summary.deliveryCount)}
        </p>
        <p className="text-sm text-stone-500">One delivery per seller.</p>
        <ul className="mt-3 space-y-2 text-sm">
          {shipments.map((shipment, index) => (
            <li key={shipment.shop.id} className="flex justify-between gap-3">
              <span className="text-stone-600">
                Delivery {index + 1} · {shipment.shop.name} · {shipment.itemCount} item
                {shipment.itemCount === 1 ? "" : "s"} · {shipment.deliveryMode}
              </span>
              <span className="font-semibold">{formatInr(shipment.total)}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-4 text-lg font-semibold">Total {formatInr(summary.total)}</p>
      <button
        type="button"
        onClick={place}
        className="mt-6 w-full rounded-full bg-ink py-3 font-semibold text-lime"
      >
        Place order
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutForm />
    </RequireAuth>
  );
}
