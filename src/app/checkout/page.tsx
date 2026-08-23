"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/context/AppContext";

export default function CheckoutPage() {
  const { state, user, neighborhood, cartTotal, productById, dispatch } = useApp();
  const router = useRouter();
  const [address, setAddress] = useState(
    `Near ${neighborhood.name}, ${neighborhood.area}`,
  );

  if (state.cart.length === 0) {
    return <p className="p-8 text-sm">Cart is empty.</p>;
  }

  function place() {
    const first = state.cart[0];
    const product = productById(first.productId);
    if (!product) return;
    const order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      buyerId: user.id,
      shopId: product.shopId,
      items: state.cart,
      deliveryMode: first.deliveryMode,
      status: "placed" as const,
      total: cartTotal,
      createdAt: new Date().toISOString(),
      address,
    };
    dispatch({ type: "placeOrder", order });
    router.push("/orders");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <p className="mt-1 text-sm text-stone-500">
        Mock checkout — Spring Boot payments will replace this later.
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
      <p className="mt-4 text-lg font-semibold">Total ₹{cartTotal}</p>
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
