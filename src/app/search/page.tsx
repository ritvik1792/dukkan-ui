"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { ShopCard } from "@/components/ShopCard";
import { useApp } from "@/context/AppContext";
import type { DeliveryMode } from "@/lib/types";
import { Suspense } from "react";

function SearchResults() {
  const params = useSearchParams();
  const q = (params.get("q") ?? "").toLowerCase();
  const { nearbyProducts, nearbyShops, dispatch } = useApp();

  const products = useMemo(
    () =>
      nearbyProducts.filter((p) =>
        `${p.name} ${p.brand} ${p.category} ${p.shop.name}`.toLowerCase().includes(q),
      ),
    [nearbyProducts, q],
  );
  const shops = useMemo(
    () =>
      nearbyShops.filter((s) =>
        `${s.name} ${s.category} ${s.description}`.toLowerCase().includes(q),
      ),
    [nearbyShops, q],
  );

  function add(productId: string, mode: DeliveryMode) {
    dispatch({ type: "addToCart", item: { productId, quantity: 1, deliveryMode: mode } });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold">
        {q ? `Results for “${q}”` : "All nearby listings"}
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        {products.length} products · {shops.length} shops
      </p>

      {shops.length > 0 && (
        <div className="mt-6 flex gap-3 overflow-x-auto">
          {shops.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              distanceKm={shop.distanceKm}
              productCount={nearbyProducts.filter((p) => p.shopId === shop.id).length}
            />
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            shop={product.shop}
            distanceKm={product.distanceKm}
            onAdd={(mode) => add(product.id, mode)}
          />
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-stone-500">Loading search…</div>}>
      <SearchResults />
    </Suspense>
  );
}
