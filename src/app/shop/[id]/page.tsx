"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { useApp } from "@/context/AppContext";
import { DELIVERY_RADIUS_KM } from "@/lib/constants";
import { distanceKm, formatDistance } from "@/lib/geo";
import type { DeliveryMode } from "@/lib/types";

export default function ShopPage() {
  const params = useParams<{ id: string }>();
  const { shopById, state, neighborhood, dispatch } = useApp();
  const shop = shopById(params.id);
  if (!shop) return <p className="p-8">Shop not found.</p>;

  const dist = distanceKm(neighborhood.coordinates, shop.coordinates);
  const listings = state.products.filter(
    (p) => p.shopId === shop.id && p.status === "approved",
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="rounded-3xl bg-ink p-6 text-white md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-lime">Dukkan / seller</p>
        <h1 className="mt-2 text-3xl font-semibold">{shop.name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/70">{shop.description}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-white/10 px-3 py-1">
            {shop.rating} ★ · {shop.reviews} reviews
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1">
            {formatDistance(dist)} · radius {DELIVERY_RADIUS_KM} km
          </span>
          {shop.gstin && (
            <span className="rounded-full bg-white/10 px-3 py-1">GST {shop.gstin}</span>
          )}
          <span className="rounded-full bg-white/10 px-3 py-1">
            Est. {shop.yearStarted}
          </span>
          <span className="rounded-full bg-lime px-3 py-1 text-ink">
            {shop.deliveryModes.includes("partner") ? "Partner" : ""}
            {shop.deliveryModes.length === 2 ? " + " : ""}
            {shop.deliveryModes.includes("shop") ? "Shop delivery" : ""}
          </span>
        </div>
        <p className="mt-4 text-sm text-white/60">{shop.address}</p>
      </div>

      <h2 className="mt-8 text-xl font-semibold">Catalogue</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {listings.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            shop={shop}
            distanceKm={dist}
            onAdd={(mode: DeliveryMode) =>
              dispatch({
                type: "addToCart",
                item: { productId: product.id, quantity: 1, deliveryMode: mode },
              })
            }
          />
        ))}
      </div>
      {listings.length === 0 && (
        <p className="mt-4 text-sm text-stone-500">No approved products yet.</p>
      )}
      <p className="mt-6 text-sm">
        <Link href="/" className="underline">
          Back to nearby
        </Link>
      </p>
    </div>
  );
}
