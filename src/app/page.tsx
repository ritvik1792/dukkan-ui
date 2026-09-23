"use client";

import { AdCarousel } from "@/components/AdCarousel";
import { CategoryCircles } from "@/components/CategoryNav";
import { ServiceListingCard } from "@/components/discovery/HitCards";
import { HorizontalScroller } from "@/components/HorizontalScroller";
import { ShopCard } from "@/components/ShopCard";
import { useLocationDialog } from "@/components/location/LocationDialog";
import { useApp } from "@/context/AppContext";
import { fetchPublicServices, fetchSearch } from "@/lib/api";
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
    <div className="bg-white">
      <section className="bg-ink text-white">
        <div className="page-shell space-y-6 py-10 md:py-14">
          <h1 className="text-4xl font-semibold tracking-tight text-lime md:text-5xl">GreenOwl</h1>
          <p className="max-w-2xl text-xl font-medium leading-snug text-white md:text-2xl">
            Everything near you — products, shops, services & people
          </p>
          <p className="max-w-xl text-sm text-white/70">
            Search your neighborhood, book trusted providers, or shop local — all in one place.
          </p>
          <form onSubmit={onSearch} className="flex max-w-xl flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products, shops, services or people..."
              className="flex-1 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm text-ink"
            />
            <button
              type="submit"
              className="rounded-xl bg-lime px-6 py-3 text-sm font-semibold text-ink"
            >
              Search
            </button>
          </form>
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
            <span>
              Showing results near <strong className="text-white">{locationLabel}</strong>
            </span>
            <button
              type="button"
              onClick={openLocation}
              className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-lime"
            >
              Change location
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
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
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold hover:bg-white/15"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="page-shell space-y-10 py-8">
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
    <div className="space-y-3 rounded-2xl bg-stone-50 p-6 text-sm text-stone-500">
      <p>
        Nothing within {radiusKm} km of {label} yet.
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
