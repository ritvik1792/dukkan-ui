"use client";

import Link from "next/link";
import { DeliveryPicker } from "@/components/DeliveryPicker";
import { ProductArt } from "@/components/ProductArt";
import { useApp } from "@/context/AppContext";

export default function CartPage() {
  const { state, productById, shopById, cartTotal, dispatch } = useApp();

  if (state.cart.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-stone-500">
          Add nearby products with partner or shop delivery.
        </p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-ink px-5 py-2 text-sm text-lime">
          Browse Dukkan
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Cart</h1>
      <ul className="mt-6 space-y-4">
        {state.cart.map((item) => {
          const product = productById(item.productId);
          const shop = product ? shopById(product.shopId) : undefined;
          if (!product || !shop) return null;
          return (
            <li
              key={`${item.productId}-${item.deliveryMode}`}
              className="flex flex-col gap-4 rounded-2xl bg-white p-4 md:flex-row"
            >
              <ProductArt product={product} className="h-24 w-full md:w-32" />
              <div className="flex-1">
                <p className="font-semibold">{product.name}</p>
                <p className="text-xs text-stone-500">{shop.name}</p>
                <p className="mt-1 font-bold">₹{product.price * item.quantity}</p>
                <label className="mt-2 inline-block text-sm">
                  Qty
                  <input
                    type="number"
                    min={0}
                    value={item.quantity}
                    onChange={(e) =>
                      dispatch({
                        type: "setQty",
                        productId: product.id,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="ml-2 w-16 rounded-lg border px-2 py-1"
                  />
                </label>
                <div className="mt-3">
                  <DeliveryPicker
                    modes={product.deliveryModes}
                    value={item.deliveryMode}
                    onChange={(mode) =>
                      dispatch({
                        type: "setCartDelivery",
                        productId: product.id,
                        deliveryMode: mode,
                      })
                    }
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-8 flex items-center justify-between rounded-2xl bg-ink p-5 text-white">
        <div>
          <p className="text-sm text-white/70">Payable</p>
          <p className="text-2xl font-semibold">₹{cartTotal}</p>
        </div>
        <Link href="/checkout" className="rounded-full bg-lime px-5 py-2 font-semibold text-ink">
          Checkout
        </Link>
      </div>
    </div>
  );
}
