"use client";

import { AdCarousel } from "@/components/AdCarousel";
import { CategoryCircles } from "@/components/CategoryNav";
import { ServiceListingCard } from "@/components/discovery/HitCards";
import { HorizontalScroller } from "@/components/HorizontalScroller";
import { LogoMark } from "@/components/LogoMark";
import { ShopCard } from "@/components/ShopCard";
import { useLocationDialog } from "@/components/location/LocationDialog";
import { useApp } from "@/context/AppContext";
import { fetchPublicServices, fetchSearch } from "@/lib/api";
import { BRAND } from "@/lib/constants";
import { ROUTES } from "@/lib/routes";
import type { ServiceSearchHit } from "@/lib/types";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMotionRouter } from "@/lib/motion";

export default function HomePage() {
  const { nearbyShops, locationLabel, shopRadiusKm, state, origin } = useApp();
  const router = useMotionRouter();
  const { openLocation } = useLocationDialog();
  const [query, setQuery] = useState("");
  const [nearbyServices, setNearbyServices] = useState<ServiceSearchHit[]>([]);

  const topRated = useMemo(
    () => [...nearbyShops].sort((a, b) => b.rating - a.rating || a.distanceKm - b.distanceKm),
    [nearbyShops],
  );

  useEffect(() => {
    let cancelled = false;
    fetchSearch({ lat: origin.lat, lng: origin.lng, filter: "services" })
      .then((res) => {
        if (!cancelled) setNearbyServices(res.services.slice(0, 12));
      })
      .catch(() => {
        fetchPublicServices()
          .then((rows) => {
            if (cancelled) return;
            setNearbyServices(
              rows.slice(0, 12).map((s) => {
                const shop = state.shops.find((x) => x.id === s.providerId);
                return {
                  id: s.id,
                  name: s.name,
                  startingPrice: s.startingPrice,
                  price: s.price,
                  bookingEnabled: s.bookingEnabled,
                  requestEnabled: s.requestEnabled,
                  durationMinutes: s.durationMinutes,
                  providerId: s.providerId,
                  providerName: shop?.name ?? "Provider",
                  type: "service" as const,
                };
              }),
            );
          })
          .catch(() => undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [origin.lat, origin.lng, state.shops]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <div>
      <section className="relative flex min-h-[calc(100dvh-4.5rem)] flex-col justify-center bg-gradient-to-b from-[#ffe6f0] via-[#fceef3] to-transparent">
        <div className="page-shell flex w-full flex-1 flex-col justify-center gap-8 py-10 md:py-14">
          <div className="flex flex-col items-center gap-3 text-center">
            <LogoMark className="h-16 w-16 animate-fade-up shadow-sm sm:h-20 sm:w-20" />
            <h1 className="animate-fade-up text-4xl font-semibold tracking-tight text-ink md:text-5xl">
              {BRAND.name}
            </h1>
            <p className="max-w-xl text-base text-ink/70 md:text-lg">
              Search products, shops, and services near you.
            </p>
          </div>

          <form onSubmit={onSearch} className="animate-pop-in w-full">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for products, shops, services or people..."
                className="w-full flex-1 rounded-2xl border border-blush/80 bg-white px-5 py-4 text-base text-ink shadow-sm outline-none ring-carrot/30 placeholder:text-stone-400 focus:ring-2"
                autoFocus
              />
              <button
                type="submit"
                className="rounded-2xl bg-carrot px-8 py-4 text-sm font-semibold text-white shadow-sm hover:brightness-105 sm:shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-ink/70">
            <span>
              Near <strong className="text-ink">{locationLabel}</strong>
            </span>
            <button
              type="button"
              onClick={openLocation}
              className="rounded-full border border-ink/15 bg-white/70 px-3 py-1 text-xs font-medium text-carrot"
            >
              Change location
            </button>
          </div>
        </div>
      </section>

      <div className="page-shell space-y-10 py-8">
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { href: "/search?filter=products", label: "Products" },
            { href: "/search?filter=services", label: "Services" },
            { href: "/search?filter=shops", label: "Shops" },
            { href: "/search?filter=people", label: "People" },
            { href: ROUTES.accountBookings, label: "Bookings" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-blush bg-white/80 px-4 py-2 text-xs font-semibold text-ink hover:border-carrot/40"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <HorizontalScroller title="Categories">
          <CategoryCircles />
        </HorizontalScroller>

        <HorizontalScroller title={`Shops near ${locationLabel}`}>
          {nearbyShops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
          {nearbyShops.length === 0 && (
            <NoNearby label={locationLabel} radiusKm={shopRadiusKm} />
          )}
        </HorizontalScroller>

        {nearbyServices.length > 0 && (
          <HorizontalScroller title="Services near you">
            {nearbyServices.map((service) => (
              <ServiceListingCard key={service.id} service={service} providerName={service.providerName} />
            ))}
          </HorizontalScroller>
        )}

        <AdCarousel ads={state.advertisements} />

        {topRated.length > 0 && (
          <HorizontalScroller title="Highly rated near you">
            {topRated.map((shop) => (
              <ShopCard key={`rated-${shop.id}`} shop={shop} />
            ))}
          </HorizontalScroller>
        )}
      </div>
    </div>
  );
}

function NoNearby({ label, radiusKm }: { label: string; radiusKm: number }) {
  const { openLocation } = useLocationDialog();
  return (
    <div className="space-y-3 rounded-2xl bg-white/70 p-6 text-sm text-stone-500">
      <p>
        Nothing within {radiusKm} km of {label} yet.
      </p>
      <button
        type="button"
        onClick={openLocation}
        className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white"
      >
        Change location
      </button>
    </div>
  );
}
