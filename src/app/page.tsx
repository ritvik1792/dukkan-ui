"use client";

import { AdCarousel } from "@/components/AdCarousel";
import { CategoryBrowse } from "@/components/CategoryNav";
import { ServiceListingCard } from "@/components/discovery/HitCards";
import { HorizontalScroller } from "@/components/HorizontalScroller";
import { ShopCard } from "@/components/ShopCard";
import { useLocationDialog } from "@/components/location/LocationDialog";
import { SearchSuggest } from "@/components/search/SearchSuggest";
import { useApp } from "@/context/AppContext";
import { useIsHydrated } from "@/lib/hydration";
import { fetchPublicServices, fetchSearch } from "@/lib/api";
import { BRAND } from "@/lib/constants";
import { ROUTES } from "@/lib/routes";
import type { ServiceSearchHit } from "@/lib/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function HomePage() {
  const { nearbyShops, locationLabel, shopRadiusKm, state, origin } = useApp();
  const { openLocation } = useLocationDialog();
  const hydrated = useIsHydrated();
  const displayLocation = hydrated ? locationLabel : "Connaught Place";
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

  const shortcuts = [
    { href: "/search?filter=shops", label: "🏪 All Shops" },
    { href: "/search?filter=products", label: "🛍️ Products" },
    { href: "/search?filter=services", label: "✨ Services" },
    { href: ROUTES.accountBookings, label: "📅 My Bookings" },
    { href: "/search?filter=people", label: "👥 Providers" },
  ];

  return (
    <div>
      {/* ── Swiggy-style Hero Banner & 3 Core Pillars (Dukkan, Delivery, Service) ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-600 via-rose-600 to-rose-700 pb-10 pt-7 text-white shadow-md sm:pb-12 sm:pt-9">
        {/* Subtle decorative background glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-rose-400/20 blur-3xl" />

        <div className="page-shell relative space-y-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-sm sm:text-4xl lg:text-[42px]">
              Order food &amp; groceries. Discover local shops. <span className="text-rose-100">Dukkan it!</span>
            </h1>
            <p className="mt-2 text-xs font-medium text-rose-100 sm:text-base">
              Everything in your neighborhood — direct from local stores, instant delivery &amp; expert services
            </p>
          </div>

          {/* Unified Location & Search Bar */}
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-col gap-2 rounded-2xl bg-white/10 p-2 backdrop-blur-md sm:flex-row sm:items-center sm:rounded-full sm:bg-white sm:p-1.5 sm:shadow-lg sm:ring-1 sm:ring-black/5">
              <button
                type="button"
                onClick={openLocation}
                className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-left text-xs font-semibold text-ink transition hover:bg-rose-50 sm:rounded-full sm:bg-transparent sm:py-2.5 sm:text-sm"
              >
                <span className="text-rose-600">📍</span>
                <span className="max-w-[160px] truncate sm:max-w-[200px]">{displayLocation}</span>
                <span className="text-[10px] text-muted">▾</span>
              </button>

              <div className="hidden h-6 w-px bg-stone-200 sm:block" />

              <div className="flex-1">
                <SearchSuggest
                  variant="hero"
                  showSubmit
                  autoFocus={false}
                  placeholder="Search for shop, item or service…"
                  className="w-full text-ink"
                />
              </div>
            </div>

            {/* Quick shortcuts */}
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              {shortcuts.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/95 backdrop-blur-sm transition hover:bg-white hover:text-rose-600"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* The 3 Core Pillars (Dukkan, Delivery, Service) */}
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-3.5 pt-2 sm:grid-cols-3 sm:gap-4">
            {/* Pillar 1: DUKKAN */}
            <Link
              href="/search?filter=shops"
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-5 text-ink shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6"
            >
              <div>
                <span className="inline-block rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-rose-600">
                  UPTO 50% OFF
                </span>
                <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-ink sm:text-2xl">
                  DUKKAN
                </h2>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  From Local Shops
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Explore top neighborhood sellers &amp; stores
                </p>
              </div>
              <div className="mt-5 flex items-end justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white shadow-sm transition group-hover:bg-rose-700 group-hover:scale-105">
                  →
                </div>
                <div className="text-4xl sm:text-5xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
                  🏪
                </div>
              </div>
            </Link>

            {/* Pillar 2: DELIVERY */}
            <Link
              href="/search?filter=products"
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-5 text-ink shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6"
            >
              <div>
                <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700">
                  FAST DELIVERY
                </span>
                <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-ink sm:text-2xl">
                  DELIVERY
                </h2>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Instant Grocery &amp; Food
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Daily essentials &amp; meals brought to your door
                </p>
              </div>
              <div className="mt-5 flex items-end justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white shadow-sm transition group-hover:bg-rose-700 group-hover:scale-105">
                  →
                </div>
                <div className="text-4xl sm:text-5xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
                  🛍️
                </div>
              </div>
            </Link>

            {/* Pillar 3: SERVICE */}
            <Link
              href="/search?filter=services"
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-5 text-ink shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6"
            >
              <div>
                <span className="inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-amber-800">
                  UPTO 40% OFF
                </span>
                <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-ink sm:text-2xl">
                  SERVICES
                </h2>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Dine Out &amp; Bookings
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Book tables, salon sessions &amp; vetted pros
                </p>
              </div>
              <div className="mt-5 flex items-end justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white shadow-sm transition group-hover:bg-rose-700 group-hover:scale-105">
                  →
                </div>
                <div className="text-4xl sm:text-5xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
                  🍽️
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <div className="page-shell space-y-8 bg-surface py-6 md:py-8">
        <CategoryBrowse />

        <HorizontalScroller title={`Shops near ${displayLocation}`}>
          {nearbyShops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
          {nearbyShops.length === 0 && (
            <NoNearby label={displayLocation} radiusKm={shopRadiusKm} />
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
    <div className="space-y-3 rounded-2xl bg-champagne p-6 text-sm text-muted">
      <p>
        Nothing within {radiusKm} km of {label} yet.
      </p>
      <button
        type="button"
        onClick={openLocation}
        className="btn-primary btn-sm"
      >
        Change location
      </button>
    </div>
  );
}
