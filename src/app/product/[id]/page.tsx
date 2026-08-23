"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { DeliveryPicker } from "@/components/DeliveryPicker";
import { ProductArt } from "@/components/ProductArt";
import { useApp } from "@/context/AppContext";
import { DELIVERY_RADIUS_KM, PARTNER_ETA_MINUTES } from "@/lib/constants";
import { distanceKm, formatDistance } from "@/lib/geo";
import type { DeliveryMode } from "@/lib/types";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const { productById, shopById, neighborhood, dispatch } = useApp();
  const product = productById(params.id);
  const shop = product ? shopById(product.shopId) : undefined;
  const dist = shop
    ? distanceKm(neighborhood.coordinates, shop.coordinates)
    : Infinity;
  const inRange = dist <= DELIVERY_RADIUS_KM;
  const [mode, setMode] = useState<DeliveryMode>(
    product?.deliveryModes[0] ?? "partner",
  );
  const [qty, setQty] = useState(product?.moq ?? 1);

  if (!product || !shop) {
    return <p className="p-8">Product not found.</p>;
  }

  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[0.9fr_1.1fr]">
      <ProductArt product={product} className="h-80 md:h-full min-h-80" />
      <div>
        <p className="text-xs uppercase tracking-wider text-stone-500">
          {product.category} · {product.brand}
        </p>
        <h1 className="mt-1 text-3xl font-semibold">{product.name}</h1>
        <p className="mt-2 text-sm text-stone-600">{product.description}</p>
        <p className="mt-3 text-sm">
          {product.rating} ★ ({product.reviews} reviews) · MOQ {product.moq}
        </p>
        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-bold">₹{product.price}</span>
          <span className="text-stone-400 line-through">₹{product.mrp}</span>
          {discount > 0 && (
            <span className="text-sm font-semibold text-teal-800">{discount}% off</span>
          )}
          <span className="text-sm text-stone-500">/ {product.unit}</span>
        </div>

        <Link href={`/shop/${shop.id}`} className="mt-4 block rounded-2xl bg-white p-4">
          <p className="text-xs text-stone-500">Sold by dukkan</p>
          <p className="font-semibold">{shop.name}</p>
          <p className="text-sm text-stone-500">
            {shop.address} · {formatDistance(dist)} · {shop.verified ? "Verified GST" : "Unverified"}
          </p>
        </Link>

        {!inRange && (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            This shop is outside the {DELIVERY_RADIUS_KM} km radius for {neighborhood.name}.
            You can still view it; switch location to order.
          </p>
        )}

        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold">How should it arrive?</p>
          <DeliveryPicker
            modes={product.deliveryModes}
            value={mode}
            onChange={setMode}
          />
          {mode === "partner" && (
            <p className="mt-2 text-xs text-stone-500">
              Partner riders typically {PARTNER_ETA_MINUTES} minutes inside radius.
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <label className="text-sm">
            Qty
            <input
              type="number"
              min={product.moq}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="ml-2 w-20 rounded-xl border border-stone-200 px-3 py-2"
            />
          </label>
          <button
            type="button"
            disabled={!inRange || product.status !== "approved"}
            onClick={() =>
              dispatch({
                type: "addToCart",
                item: { productId: product.id, quantity: qty, deliveryMode: mode },
              })
            }
            className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-lime disabled:opacity-40"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
