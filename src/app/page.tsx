"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { ShopCard } from "@/components/ShopCard";
import { useApp } from "@/context/AppContext";
import { DELIVERY_RADIUS_KM, PARTNER_ETA_MINUTES } from "@/lib/constants";
import { categories } from "@/lib/mock-data";
import type { DeliveryMode } from "@/lib/types";

export default function HomePage() {
  const { nearbyProducts, nearbyShops, neighborhood, dispatch } = useApp();
  const [category, setCategory] = useState<string | "all">("all");

  const filtered = useMemo(
    () =>
      category === "all"
        ? nearbyProducts
        : nearbyProducts.filter((p) => p.category === category),
    [nearbyProducts, category],
  );

  function add(productId: string, mode: DeliveryMode) {
    dispatch({ type: "addToCart", item: { productId, quantity: 1, deliveryMode: mode } });
  }

  return (
    <div>
      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-[1.2fr_0.8fr] md:py-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime">
              Quick + local marketplace
            </p>
            <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight md:text-5xl">
              Shops around you. Catalogues you can trust. Delivery in minutes.
            </h1>
            <p className="mt-4 max-w-lg text-sm text-white/70 md:text-base">
              Dukkan mixes Amazon-style product pages, IndiaMART seller profiles, and
              Zepto-like hyperlocal delivery. Only listings inside{" "}
              <strong className="text-lime">{DELIVERY_RADIUS_KM} km</strong> of{" "}
              {neighborhood.name} are shown.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-ink"
              >
                Shop nearby
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/20 px-5 py-2.5 text-sm"
              >
                Sell on Dukkan
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Radius" value={`${DELIVERY_RADIUS_KM} km`} />
            <Stat label="Partner ETA" value={`${PARTNER_ETA_MINUTES} min`} />
            <Stat label="Shops in range" value={String(nearbyShops.length)} />
            <Stat label="SKUs nearby" value={String(nearbyProducts.length)} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`shrink-0 rounded-full px-4 py-2 text-sm ${
              category === "all" ? "bg-ink text-white" : "bg-white text-ink"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm ${
                category === c.id ? "bg-ink text-white" : "bg-white text-ink"
              }`}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>

        <div className="mt-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold">Dukkans near you</h2>
              <p className="text-sm text-stone-500">
                Seller cards in the IndiaMART spirit — GST, ratings, delivery modes.
              </p>
            </div>
          </div>
          <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2">
            {nearbyShops.map((shop) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                distanceKm={shop.distanceKm}
                productCount={nearbyProducts.filter((p) => p.shopId === shop.id).length}
              />
            ))}
            {nearbyShops.length === 0 && (
              <p className="rounded-2xl bg-white p-6 text-sm text-stone-500">
                No shops inside {DELIVERY_RADIUS_KM} km of {neighborhood.name}. Try another
                area from the header.
              </p>
            )}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-semibold">Products in range</h2>
          <p className="text-sm text-stone-500">
            Choose Dukkan partner riders or let the shop deliver itself.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                shop={product.shop}
                distanceKm={product.distanceKm}
                onAdd={(mode) => add(product.id, mode)}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="mt-6 rounded-2xl bg-white p-6 text-sm text-stone-500">
              Nothing in this category nearby. Switch location or category.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-lime">{value}</p>
    </div>
  );
}
