"use client";

import { AdCarousel } from "@/components/AdCarousel";
import { CategoryCircles } from "@/components/CategoryNav";
import { HorizontalScroller } from "@/components/HorizontalScroller";
import { ShopCard } from "@/components/ShopCard";
import { useApp } from "@/context/AppContext";
import { useMemo } from "react";

export default function HomePage() {
  const { nearbyShops, neighborhood, shopRadiusKm, state } = useApp();

  const topRated = useMemo(
    () => [...nearbyShops].sort((a, b) => b.rating - a.rating || a.distanceKm - b.distanceKm),
    [nearbyShops],
  );

  return (
    <div className="bg-white">
      <div className="page-shell space-y-10 py-8">
        <HorizontalScroller title="What's nearby">
          <CategoryCircles />
        </HorizontalScroller>

        <HorizontalScroller title={`Discover best shops near ${neighborhood.name}`}>
          {nearbyShops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
          {nearbyShops.length === 0 && (
            <p className="rounded-2xl bg-stone-50 p-6 text-sm text-stone-500">
              No dukkans within {shopRadiusKm} km of {neighborhood.name}.
            </p>
          )}
        </HorizontalScroller>

        <AdCarousel ads={state.advertisements} />

        {topRated.length > 0 && (
          <HorizontalScroller title="Highly rated dukkans">
            {topRated.map((shop) => (
              <ShopCard key={`rated-${shop.id}`} shop={shop} />
            ))}
          </HorizontalScroller>
        )}
      </div>
    </div>
  );
}
