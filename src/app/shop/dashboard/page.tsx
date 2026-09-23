"use client";

import { CatalogProductCard } from "@/components/CatalogProductCard";
import { Field, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import { fetchProviderProfile } from "@/lib/api";
import { formatInr } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { formatDistance } from "@/lib/geo";
import type { ProviderService, Shop } from "@/lib/types";
import type { UniqueOffer } from "@/services/catalog";
import { shopDeliveryModes } from "@/services/pricing";
import { isShopOpenNow, shopHoursLabel } from "@/lib/shopOps";
import { fetchShop, fetchShopCatalog } from "@/services/storefront";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ShopDashboardPage() {
  const { state, nearbyShops, locationLabel } = useApp();
  const shopId = state.viewShopId;
  const [shop, setShop] = useState<Shop | null>(null);
  const [offers, setOffers] = useState<UniqueOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState("");
  const [q, setQ] = useState("");
  const [services, setServices] = useState<ProviderService[]>([]);

  useEffect(() => {
    if (!state.hydrated) return;
    if (!shopId) {
      setShop(null);
      setOffers([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const db = {
      shops: state.shops,
      catalog: state.catalog,
      listings: state.listings,
      reviews: state.reviews,
    };

    Promise.all([
      fetchShop(shopId, db),
      fetchShopCatalog(shopId, db, { query: q, categoryId: categoryId || undefined }),
      fetchProviderProfile(shopId).catch(() => null),
    ]).then(([nextShop, nextOffers, profile]) => {
      if (cancelled) return;
      setShop(profile?.provider ?? nextShop);
      setServices(profile?.services.filter((s) => s.status === "ACTIVE") ?? []);
      setOffers(nextOffers);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [state.hydrated, shopId, state.shops, state.catalog, state.listings, state.reviews, q, categoryId]);

  if (!state.hydrated || loading) {
    return <p className="p-8 text-sm text-stone-500">Loading provider…</p>;
  }

  if (!shopId || !shop) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">No provider selected</h1>
        <p className="mt-2 text-sm text-stone-500">
          Open a shop or service provider from home or search. This page stays at{" "}
          {ROUTES.shopDashboard} and loads the profile you clicked.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm underline">
          Browse nearby
        </Link>
      </div>
    );
  }

  const nearby = nearbyShops.find((s) => s.id === shop.id);
  const modes = shopDeliveryModes(shop);
  const showProducts = shop.productsAllowed !== false;
  const showServices = services.length > 0 || shop.servicesAllowed;
  const providerLabel =
    shop.providerType === "INDIVIDUAL"
      ? "Professional"
      : shop.servicesAllowed
        ? "Provider"
        : "Shop";

  return (
    <div className="page-shell flex gap-6 py-8">
      <aside className="hidden w-48 shrink-0 lg:block">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
          Filter
        </p>
        <button
          type="button"
          onClick={() => setCategoryId("")}
          className={`mb-1 block w-full rounded-xl px-3 py-2 text-left text-sm ${
            !categoryId ? "bg-ink text-lime" : "hover:bg-stone-100"
          }`}
        >
          All
        </button>
        {shop.categoryIds.map((id) => {
          const c = state.categories.find((x) => x.id === id);
          if (!c) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setCategoryId(id)}
              className={`mb-1 block w-full rounded-xl px-3 py-2 text-left text-sm ${
                categoryId === id ? "bg-ink text-lime" : "hover:bg-stone-100"
              }`}
            >
              {c.emoji} {c.name}
            </button>
          );
        })}
      </aside>

      <div className="min-w-0 flex-1">
        <div className="rounded-3xl bg-ink p-6 text-white md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-lime">{providerLabel}</p>
          <h1 className="mt-2 text-3xl font-semibold">{shop.name}</h1>
          {shop.profession && (
            <p className="mt-1 text-sm text-lime/90">{shop.profession}</p>
          )}
          <p className="mt-2 max-w-2xl text-sm text-white/70">{shop.description}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-white/10 px-3 py-1">
              {shop.rating} ★ · {shop.reviews} reviews
            </span>
            {nearby && (
              <span className="rounded-full bg-white/10 px-3 py-1">
                {formatDistance(nearby.distanceKm)} from {locationLabel}
              </span>
            )}
            {shop.gstin && (
              <span className="rounded-full bg-white/10 px-3 py-1">GST {shop.gstin}</span>
            )}
            {showProducts && modes.length > 0 && (
              <span className="rounded-full bg-lime px-3 py-1 text-ink">
                {modes.map((m) => (m === "partner" ? "Partner" : "Shop delivery")).join(" + ")}
              </span>
            )}
            {shop.serviceArea && (
              <span className="rounded-full bg-white/10 px-3 py-1">Serves {shop.serviceArea}</span>
            )}
            <span className={`rounded-full px-3 py-1 ${isShopOpenNow(shop) ? "bg-white/10" : "bg-white text-ink"}`}>
              {isShopOpenNow(shop) ? `Open · ${shopHoursLabel(shop)}` : "Closed"}
            </span>
          </div>
          <p className="mt-4 text-sm text-white/60">{shop.address}</p>
          <p className="mt-1 text-xs text-white/50">
            Min order {shop.minOrderAmount ? `₹${shop.minOrderAmount}` : "none"}
          </p>
        </div>

        {showServices && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold">Services</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {services.map((service) => {
                const price = service.startingPrice ?? service.price;
                return (
                  <div
                    key={service.id}
                    className="rounded-2xl bg-white p-4 ring-1 ring-stone-200/80"
                  >
                    <p className="font-semibold text-ink">{service.name}</p>
                    {service.description && (
                      <p className="mt-1 text-sm text-stone-500 line-clamp-2">{service.description}</p>
                    )}
                    {price != null && (
                      <p className="mt-2 text-sm font-medium">From {formatInr(price)}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {service.bookingEnabled && shop.bookingsAllowed && (
                        <Link
                          href={`${ROUTES.serviceBook}?serviceId=${encodeURIComponent(service.id)}`}
                          className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-lime"
                        >
                          Book
                        </Link>
                      )}
                      {service.requestEnabled && shop.serviceRequestsAllowed && (
                        <Link
                          href={`${ROUTES.serviceRequest}?serviceId=${encodeURIComponent(service.id)}`}
                          className="rounded-full border px-3 py-1 text-xs font-medium"
                        >
                          Request
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {services.length === 0 && (
              <p className="mt-3 text-sm text-stone-500">No services listed yet.</p>
            )}
          </div>
        )}

        {showProducts && (
          <>
            <div className="mt-8 flex flex-wrap items-end gap-3">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-stone-400">
                  {q || categoryId || "All"}
                </p>
                <h2 className="text-xl font-semibold">Products</h2>
              </div>
              <Field label="Search in shop">
                <TextInput
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Filter products"
                />
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              {offers.map((offer) => (
                <CatalogProductCard
                  key={offer.product.id}
                  offer={offer}
                  preferShopId={shop.id}
                />
              ))}
            </div>
            {offers.length === 0 && (
              <p className="mt-6 text-sm text-stone-500">No products match this filter.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
