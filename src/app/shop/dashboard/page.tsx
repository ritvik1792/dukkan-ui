"use client";

import { CatalogProductCard } from "@/components/CatalogProductCard";
import { Field, TextInput } from "@/components/ui/Field";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { useIsHydrated } from "@/lib/hydration";
import { fetchProviderProfile } from "@/lib/api";
import { formatInr } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { formatDistance } from "@/lib/geo";
import type { ProviderService, Shop } from "@/lib/types";
import { uniqueCatalogOffers, type UniqueOffer } from "@/services/catalog";
import { shopDeliveryModes } from "@/services/pricing";
import { isShopOpenNow, shopHoursLabel } from "@/lib/shopOps";
import { fetchShop, fetchShopCatalog } from "@/services/storefront";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

type ActiveTab = "all" | "products" | "services" | "offers";

function ShopDashboardContent() {
  const params = useSearchParams();
  const queryShopId = params.get("id") || params.get("shopId");
  const { state, nearbyShops, locationLabel, selectShop } = useApp();
  const { showAlert } = useAlert();
  const shopId = queryShopId || state.viewShopId || state.shops[0]?.id;
  const [profileShop, setProfileShop] = useState<Shop | null>(null);
  const [offers, setOffers] = useState<UniqueOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState("");
  const [q, setQ] = useState("");
  const [services, setServices] = useState<ProviderService[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");

  useEffect(() => {
    if (queryShopId && queryShopId !== state.viewShopId) {
      selectShop(queryShopId);
    }
  }, [queryShopId, state.viewShopId, selectShop]);

  useEffect(() => {
    if (!shopId) {
      setProfileShop(null);
      setOffers([]);
      setLoading(false);
      return;
    }

    // Immediately load from local store so page is never blocked
    const localShop = state.shops.find((s) => s.id === shopId) ?? state.shops[0] ?? null;
    if (localShop) {
      setProfileShop(localShop);
    }
    const localOffers = uniqueCatalogOffers({
      catalog: state.catalog,
      listings: state.listings.filter((l) => l.shopId === (localShop?.id ?? shopId)),
      nearbyShopIds: new Set([localShop?.id ?? shopId]),
      shops: state.shops,
      query: q || undefined,
      categoryId: categoryId || undefined,
    });
    setOffers(localOffers);
    setLoading(false);

    let cancelled = false;
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
      if (profile?.provider || nextShop) {
        setProfileShop(profile?.provider ?? nextShop ?? localShop);
      }
      if (profile?.services) {
        setServices(profile.services.filter((s) => s.status === "ACTIVE"));
      }
      if (nextOffers && nextOffers.length > 0) {
        setOffers(nextOffers);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [shopId, state.shops, state.catalog, state.listings, state.reviews, q, categoryId]);

  const isHydrated = useIsHydrated();
  const shop = profileShop ?? (shopId ? state.shops.find((s) => s.id === shopId) : null) ?? state.shops[0] ?? null;

  const ownerPhone = useMemo(() => {
    if (!shop) return undefined;
    return state.users.find((u) => u.id === shop.ownerUserId)?.phone;
  }, [shop, state.users]);

  const shopCoupons = useMemo(() => {
    if (!shop) return [];
    return state.coupons.filter(
      (c) => c.active && (!c.shopId || c.shopId === shop.id),
    );
  }, [shop, state.coupons]);

  const copyCode = (code: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      showAlert({ tone: "success", title: `Coupon code ${code} copied!` });
    }
  };

  if (!shop && loading) {
    return (
      <div className="page-shell py-16 text-center text-muted">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
        <p className="mt-3 text-sm">Loading provider profile…</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-ink">No provider selected</h1>
        <p className="mt-2 text-sm text-muted">
          Open a shop or service provider from home or search to explore their menu &amp; bookings.
        </p>
        <Link href="/" className="btn-primary btn-sm mt-5">
          Browse nearby
        </Link>
      </div>
    );
  }

  const nearby = nearbyShops.find((s) => s.id === shop.id);
  const modes = shopDeliveryModes(shop);
  const showProducts = shop.productsAllowed !== false;
  const showServices = services.length > 0 || shop.servicesAllowed;
  const primaryService = services.find((s) => s.bookingEnabled);

  const categoryNames = shop.categoryIds
    .map((id) => state.categories.find((c) => c.id === id)?.name)
    .filter(Boolean);

  const openStatus = isShopOpenNow(shop);

  return (
    <div className="page-shell space-y-6 py-6 sm:py-8">
      {/* ── Breadcrumb & Top Tabs (Swiggy Style: Dineout / Menu / Photos) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Link href="/" className="hover:text-rose-600">Home</Link>
          <span>/</span>
          <Link href="/search?filter=shops" className="hover:text-rose-600">Shops</Link>
          <span>/</span>
          <span className="font-semibold text-ink truncate max-w-[200px]">{shop.name}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === "all" ? "bg-rose-600 text-white shadow-sm" : "text-muted hover:bg-zinc-100"
            }`}
          >
            Overview
          </button>
          {showProducts && (
            <button
              type="button"
              onClick={() => setActiveTab("products")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === "products" ? "bg-rose-600 text-white shadow-sm" : "text-muted hover:bg-zinc-100"
              }`}
            >
              Menu &amp; Products
            </button>
          )}
          {showServices && (
            <button
              type="button"
              onClick={() => setActiveTab("services")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === "services" ? "bg-rose-600 text-white shadow-sm" : "text-muted hover:bg-zinc-100"
              }`}
            >
              Services &amp; Bookings
            </button>
          )}
          {shopCoupons.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("offers")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === "offers" ? "bg-rose-600 text-white shadow-sm" : "text-muted hover:bg-zinc-100"
              }`}
            >
              Offers ({shopCoupons.length})
            </button>
          )}
        </div>
      </div>

      {/* ── Swiggy Dineout Style Hero Card ── */}
      <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Shop Visual */}
          <div className="relative h-60 bg-gradient-to-br from-rose-100 via-rose-50 to-zinc-100 md:col-span-5 md:h-auto">
            {shop.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shop.imageUrl}
                alt={shop.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-7xl opacity-40">
                🏪
              </div>
            )}
            <div className="absolute bottom-3 left-3 flex gap-2">
              <span className="rounded-lg bg-black/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                📸 Verified Provider
              </span>
            </div>
          </div>

          {/* Shop Header Details */}
          <div className="flex flex-col justify-between p-6 md:col-span-7 sm:p-8">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
                    {shop.name}
                  </h1>
                  <p className="mt-1 text-xs text-muted sm:text-sm">
                    {nearby ? `${formatDistance(nearby.distanceKm)} from ${locationLabel} • ` : ""}
                    {categoryNames.join(", ") || "Local Goods & Services"}
                  </p>
                </div>

                {shop.rating > 0 && (
                  <div className="flex flex-col items-end">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                      ★ {shop.rating.toFixed(1)}
                    </span>
                    <span className="mt-0.5 text-[10px] text-muted">
                      {shop.reviews} reviews
                    </span>
                  </div>
                )}
              </div>

              {shop.description && (
                <p className="mt-3 line-clamp-2 text-xs text-muted sm:text-sm">
                  {shop.description}
                </p>
              )}

              {/* Status pills & action buttons */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                    openStatus ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${openStatus ? "bg-emerald-500" : "bg-zinc-400"}`} />
                  {openStatus ? `Open · ${shopHoursLabel(shop)}` : "Closed right now"}
                </span>

                {shop.minOrderAmount > 0 && (
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-ink">
                    Min order {formatInr(shop.minOrderAmount)}
                  </span>
                )}

                {modes.length > 0 && (
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                    🚚 {modes.map((m) => (m === "partner" ? "Partner delivery" : "Self delivery")).join(" + ")}
                  </span>
                )}

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name} ${shop.address}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-ink transition hover:bg-zinc-50"
                >
                  📍 Directions
                </a>

                {ownerPhone && (
                  <a
                    href={`tel:${ownerPhone}`}
                    className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-ink transition hover:bg-zinc-50"
                  >
                    📞 Call
                  </a>
                )}
              </div>
            </div>

            {/* Prominent Booking / Order CTA */}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-5">
              {primaryService && (
                <Link
                  href={`${ROUTES.serviceBook}?serviceId=${encodeURIComponent(primaryService.id)}`}
                  className="btn-primary btn-md flex-1 text-center font-bold sm:flex-initial"
                >
                  📅 Book a Table / Appointment
                </Link>
              )}
              {showProducts && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("products");
                    const el = document.getElementById("shop-products-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="btn-secondary btn-md"
                >
                  🛍️ Browse Products ({offers.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Offers for you (Swiggy Style Deal Cards) ── */}
      {shopCoupons.length > 0 && (activeTab === "all" || activeTab === "offers") && (
        <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-ink sm:text-lg">
              Offers for you
            </h2>
            <span className="text-xs font-semibold text-emerald-700">
              {shopCoupons.length} available
            </span>
          </div>

          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {shopCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className="flex min-w-[16rem] shrink-0 flex-col justify-between rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/40 p-4 transition hover:bg-emerald-50"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      EXCLUSIVE
                    </span>
                    <button
                      type="button"
                      onClick={() => copyCode(coupon.code)}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-ink">
                    Flat {coupon.discountPercent}% Off
                  </h3>
                  <p className="mt-0.5 text-xs text-muted">
                    {coupon.minOrderAmount > 0
                      ? `On orders above ${formatInr(coupon.minOrderAmount)}`
                      : "No minimum purchase required"}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-emerald-200/60 pt-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-800">
                    {coupon.code}
                  </span>
                  <span className="text-[10px] text-muted">Tap to copy</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Services Section ── */}
      {showServices && (activeTab === "all" || activeTab === "services") && (
        <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">Services &amp; Appointments</h2>
              <p className="text-xs text-muted">Book tables or sessions with instant slot confirmation</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((service) => {
              const price = service.startingPrice ?? service.price;
              return (
                <div
                  key={service.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-white p-4 transition hover:border-rose-200 hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-ink">{service.name}</p>
                      {price != null && (
                        <p className="shrink-0 text-sm font-bold text-rose-600">
                          {formatInr(price)}
                        </p>
                      )}
                    </div>
                    {service.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted">
                        {service.description}
                      </p>
                    )}
                    {service.durationMinutes && (
                      <p className="mt-1 text-[11px] text-stone-400">
                        ⏱️ {service.durationMinutes} mins duration
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-3">
                    {service.bookingEnabled && shop.bookingsAllowed && (
                      <Link
                        href={`${ROUTES.serviceBook}?serviceId=${encodeURIComponent(service.id)}`}
                        className="rounded-full bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700"
                      >
                        Book slot
                      </Link>
                    )}
                    {service.requestEnabled && shop.serviceRequestsAllowed && (
                      <Link
                        href={`${ROUTES.serviceRequest}?serviceId=${encodeURIComponent(service.id)}`}
                        className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-ink transition hover:bg-zinc-50"
                      >
                        Send request
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {services.length === 0 && (
            <p className="text-xs text-muted">No services listed yet.</p>
          )}
        </section>
      )}

      {/* ── Products & Menu Section ── */}
      {showProducts && (activeTab === "all" || activeTab === "products") && (
        <section id="shop-products-section" className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">Products &amp; Menu</h2>
              <p className="text-xs text-muted">
                {offers.length} {offers.length === 1 ? "item" : "items"} available for order
              </p>
            </div>

            <div className="w-full sm:w-64">
              <Field label="">
                <TextInput
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search products in this shop…"
                />
              </Field>
            </div>
          </div>

          {/* Category Filter Pills */}
          {shop.categoryIds.length > 1 && (
            <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCategoryId("")}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  !categoryId ? "chip-active" : "chip-idle"
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
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      categoryId === id ? "chip-active" : "chip-idle"
                    }`}
                  >
                    {c.emoji} {c.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Products Grid */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {offers.map((offer) => (
              <CatalogProductCard
                key={offer.product.id}
                offer={offer}
                preferShopId={shop.id}
              />
            ))}
          </div>

          {offers.length === 0 && (
            <p className="mt-8 text-center text-sm text-muted">
              No products found matching &ldquo;{q}&rdquo;.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

export default function ShopDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell py-16 text-center text-muted">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
          <p className="mt-3 text-sm">Loading provider profile…</p>
        </div>
      }
    >
      <ShopDashboardContent />
    </Suspense>
  );
}
