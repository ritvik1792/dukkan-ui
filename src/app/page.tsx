"use client";

import { AdCarousel } from "@/components/AdCarousel";
import { CategoryCircles } from "@/components/CategoryNav";
import { HorizontalScroller } from "@/components/HorizontalScroller";
import { ShopCard } from "@/components/ShopCard";
import { useLocationDialog } from "@/components/location/LocationDialog";
import { useApp } from "@/context/AppContext";
import { useMemo } from "react";

export default function HomePage() {
  const { nearbyShops, locationLabel, shopRadiusKm, state } = useApp();

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

        <HorizontalScroller title={`Discover best shops near ${locationLabel}`}>
          {nearbyShops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
          {nearbyShops.length === 0 && (
            <NoShopsNearby label={locationLabel} radiusKm={shopRadiusKm} />
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

function NoShopsNearby({ label, radiusKm }: { label: string; radiusKm: number }) {
  const { openLocation } = useLocationDialog();
  return (
    <div className="space-y-3 rounded-2xl bg-stone-50 p-6 text-sm text-stone-500">
      <p>
        No dukkans within {radiusKm} km of {label}.
      </p>
      <button
        type="button"
        onClick={openLocation}
        className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-lime"
      >
        Change location
      </button>
    </div>
  );
}
