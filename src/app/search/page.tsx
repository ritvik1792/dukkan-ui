"use client";

import { CatalogProductCard } from "@/components/CatalogProductCard";
import {
  PersonHitCard,
  ProductHitCard,
  ServiceHitCard,
} from "@/components/discovery/HitCards";
import { CategoryList } from "@/components/CategoryNav";
import { HorizontalScroller } from "@/components/HorizontalScroller";
import { LocationChip } from "@/components/location/LocationChip";
import { useLocationDialog } from "@/components/location/LocationDialog";
import { ShopCard } from "@/components/ShopCard";
import { Field, Select } from "@/components/ui/Field";
import { useApp, useUniqueOffers } from "@/context/AppContext";
import { fetchSearch } from "@/lib/api";
import { distanceKm } from "@/lib/geo";
import { useMotionRouter } from "@/lib/motion";
import { isNameMatch, nameRelevance } from "@/lib/searchRank";
import type { NearbyShop, SearchFilter, SearchResults } from "@/lib/types";
import { shopsInRadius } from "@/services/catalog";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";

const TABS: { id: SearchFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "products", label: "Products" },
  { id: "shops", label: "Shops" },
  { id: "services", label: "Services" },
  { id: "people", label: "People" },
];

function SearchResultsView() {
  const params = useSearchParams();
  const router = useMotionRouter();
  const q = (params.get("q") ?? "").trim();
  const categoryId = params.get("category") ?? "";
  const filterParam = (params.get("filter") ?? "all") as SearchFilter;
  const { nearbyShops, state, origin, shopRadiusKm, locationLabel } = useApp();
  const { openLocation } = useLocationDialog();
  const [delivery, setDelivery] = useState<"all" | "partner" | "shop">("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [remote, setRemote] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  const filter = TABS.some((t) => t.id === filterParam) ? filterParam : "all";
  const isCategoryBrowse = Boolean(categoryId) && !q;
  const isTextSearch = Boolean(q);
  const category = state.categories.find((item) => item.id === categoryId);
  const categoryIsService = isCategoryBrowse && category?.kind === "SERVICE";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSearch({
      q: q || undefined,
      filter: isCategoryBrowse ? "all" : filter,
      lat: origin.lat,
      lng: origin.lng,
      category: categoryId || undefined,
    })
      .then((res) => {
        if (!cancelled) setRemote(res);
      })
      .catch(() => {
        if (!cancelled) setRemote(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, filter, categoryId, origin.lat, origin.lng, isCategoryBrowse]);

  const offers = useUniqueOffers(isTextSearch ? undefined : q, categoryId || undefined);

  const filteredOffers = useMemo(() => {
    if (categoryIsService || isTextSearch) return [];
    if (!isCategoryBrowse && !q) return [];
    return offers.filter((offer) => {
      const listings = offer.nearbyListings.filter((l) => {
        const shop = state.shops.find((s) => s.id === l.shopId);
        if (!shop) return false;
        if (verifiedOnly && !shop.verified) return false;
        if (delivery === "partner" && (!state.settings.quickDeliveryEnabled || !shop.partnerDeliveryEnabled)) return false;
        if (delivery === "shop" && !shop.shopDeliveryEnabled) return false;
        return true;
      });
      return listings.length > 0;
    });
  }, [
    offers,
    delivery,
    verifiedOnly,
    state.shops,
    state.settings.quickDeliveryEnabled,
    isCategoryBrowse,
    categoryIsService,
    isTextSearch,
    q,
  ]);

  const localShops = useMemo(() => {
    const inCategory = nearbyShops.filter(
      (shop) => !categoryId || shop.categoryIds.includes(categoryId),
    );
    if (!q) return inCategory;
    return inCategory
      .map((shop) => ({
        shop,
        score: nameRelevance(q, [
          { value: shop.name, weight: 1 },
          { value: shop.profession, weight: 0.8 },
          { value: shop.description, weight: 0.15 },
        ]),
      }))
      .filter((row) => isNameMatch(row.score))
      .sort((a, b) => b.score - a.score || a.shop.name.localeCompare(b.shop.name))
      .map((row) => row.shop);
  }, [nearbyShops, q, categoryId]);

  const apiShops: NearbyShop[] = useMemo(() => {
    if (!remote?.shops.length) return [];
    if (isTextSearch) {
      return remote.shops.map((shop) => {
        const known = nearbyShops.find((item) => item.id === shop.id);
        if (known) return known;
        return { ...shop, distanceKm: distanceKm(origin, shop.coordinates) };
      });
    }
    return shopsInRadius(remote.shops, origin, shopRadiusKm);
  }, [remote, nearbyShops, origin, shopRadiusKm, isTextSearch]);

  const shopsToShow = useMemo(() => {
    const base =
      isCategoryBrowse
        ? apiShops.length > 0
          ? apiShops
          : localShops
        : isTextSearch
          ? apiShops.length > 0 || remote
            ? apiShops
            : localShops
          : localShops;
    if (!categoryIsService) return base;
    const seen = new Set(base.map((shop) => shop.id));
    const providers: NearbyShop[] = [];
    for (const hit of remote?.services ?? []) {
      if (!hit.providerId || seen.has(hit.providerId)) continue;
      const shop =
        nearbyShops.find((item) => item.id === hit.providerId) ??
        state.shops.find((item) => item.id === hit.providerId);
      if (!shop) continue;
      const fromShop =
        "distanceKm" in shop && typeof shop.distanceKm === "number" ? shop.distanceKm : 0;
      providers.push({
        ...shop,
        distanceKm: hit.distanceKm ?? fromShop,
      });
      seen.add(shop.id);
    }
    const merged = providers.length ? [...base, ...providers] : base;
    if (!isTextSearch) return merged;
    return merged.filter((shop) => {
      if (verifiedOnly && !shop.verified) return false;
      if (delivery === "partner" && (!state.settings.quickDeliveryEnabled || !shop.partnerDeliveryEnabled)) {
        return false;
      }
      if (delivery === "shop" && !shop.shopDeliveryEnabled) return false;
      return true;
    });
  }, [
    remote,
    isCategoryBrowse,
    isTextSearch,
    filter,
    apiShops,
    localShops,
    categoryIsService,
    nearbyShops,
    state.shops,
    verifiedOnly,
    delivery,
    state.settings.quickDeliveryEnabled,
  ]);

  const localProductHits = useMemo(() => {
    if (!isTextSearch || remote || loading) return [];
    return offers
      .filter((offer) => offer.sellerCount > 0)
      .map((offer) => ({
        offer,
        score: nameRelevance(q, [
          { value: offer.product.name, weight: 1 },
          { value: offer.product.brand, weight: 0.65 },
        ]),
      }))
      .filter((row) => isNameMatch(row.score))
      .sort((a, b) => b.score - a.score || a.offer.product.name.localeCompare(b.offer.product.name))
      .map((row) => ({
        id: row.offer.product.id,
        name: row.offer.product.name,
        brand: row.offer.product.brand,
        categoryId: row.offer.product.categoryId,
        description: row.offer.product.description,
        imageUrl: row.offer.product.imageUrl,
        imageLabel: row.offer.product.imageLabel,
        imageHue: row.offer.product.imageHue,
        type: "product" as const,
      }));
  }, [isTextSearch, remote, loading, offers, q]);

  const productHits = categoryIsService ? [] : (remote?.products ?? localProductHits);
  const serviceHits = isCategoryBrowse ? [] : (remote?.services ?? []);
  const peopleHits = isCategoryBrowse ? [] : (remote?.people ?? []);

  const hasProducts = productHits.length > 0 || filteredOffers.length > 0;
  const hasShops = shopsToShow.length > 0;
  const hasServices = serviceHits.length > 0;
  const hasPeople = peopleHits.length > 0;

  const typesWithResults = useMemo(() => {
    const types: SearchFilter[] = [];
    if (hasProducts) types.push("products");
    if (hasShops) types.push("shops");
    if (hasServices) types.push("services");
    if (hasPeople) types.push("people");
    return types;
  }, [hasProducts, hasShops, hasServices, hasPeople]);

  const showTabBar = isTextSearch && !loading && typesWithResults.length > 1;

  let showProducts = false;
  let showShops = false;
  let showServices = false;
  let showPeople = false;

  if (isCategoryBrowse) {
    showShops = true;
    showProducts = !categoryIsService;
  } else if (isTextSearch) {
    if (filter === "all") {
      showProducts = hasProducts;
      showShops = hasShops;
      showServices = hasServices;
      showPeople = hasPeople;
    } else {
      showProducts = filter === "products";
      showShops = filter === "shops";
      showServices = filter === "services";
      showPeople = filter === "people";
    }
  } else {
    showShops = true;
  }

  const heading =
    q || categoryId
      ? q || state.categories.find((c) => c.id === categoryId)?.name
      : "All";

  const categoryName =
    state.categories.find((c) => c.id === categoryId)?.name ?? "this category";

  function setFilter(next: SearchFilter) {
    const usp = new URLSearchParams();
    if (q) usp.set("q", q);
    if (categoryId) usp.set("category", categoryId);
    if (next !== "all") usp.set("filter", next);
    router.push(`/search?${usp.toString()}`);
  }

  const nothingFound =
    !loading &&
    !hasProducts &&
    !hasShops &&
    !hasServices &&
    !hasPeople;

  const filteredEmpty =
    !loading &&
    isTextSearch &&
    filter !== "all" &&
    ((filter === "products" && !hasProducts) ||
      (filter === "shops" && !hasShops) ||
      (filter === "services" && !hasServices) ||
      (filter === "people" && !hasPeople));

  return (
    <div className="page-shell flex gap-6 py-6">
      <aside className="hidden w-48 shrink-0 lg:block">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Menu</p>
        <CategoryList activeId={categoryId || undefined} />
        {showProducts && hasProducts && (
          <div className="mt-6 space-y-3">
            <Field label="Delivery">
              <Select value={delivery} onChange={(e) => setDelivery(e.target.value as typeof delivery)}>
                <option value="all">Any</option>
                {state.settings.quickDeliveryEnabled && <option value="partner">Partner</option>}
                <option value="shop">Shop itself</option>
              </Select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
              />
              GST verified only
            </label>
          </div>
        )}
      </aside>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-stone-400">{heading}</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {q ? `Results for “${q}”` : heading === "All" ? "Explore near you" : heading}
        </h1>
        <div className="mt-3 max-w-xl">
          <LocationChip tone="hero" className="w-full" />
        </div>

        {showTabBar && (
          <div className="mt-4 flex flex-wrap gap-2">
            {TABS.filter(
              (tab) => tab.id === "all" || typesWithResults.includes(tab.id),
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition duration-200 ${
                  filter === tab.id ? "chip-active" : "chip-idle"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {showProducts && hasProducts && (
          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-3 lg:hidden">
            <div className="min-w-[8rem] flex-1">
              <Field label="Delivery">
                <Select value={delivery} onChange={(e) => setDelivery(e.target.value as typeof delivery)}>
                  <option value="all">Any</option>
                  {state.settings.quickDeliveryEnabled && <option value="partner">Partner</option>}
                  <option value="shop">Shop itself</option>
                </Select>
              </Field>
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
              />
              GST verified only
            </label>
          </div>
        )}

        {loading && <p className="mt-4 text-sm text-stone-500">Searching…</p>}

        {showShops && shopsToShow.length > 0 && (
          <div className="mt-6">
            {isTextSearch ? (
              <>
                <h2 className="text-lg font-semibold">Shops</h2>
                <p className="mt-1 text-sm text-stone-500">Name matches first, then shops that sell it.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {shopsToShow.map((shop) => (
                    <ShopCard key={shop.id} shop={shop} layout="grid" />
                  ))}
                </div>
              </>
            ) : (
              <HorizontalScroller title="Shops">
                {shopsToShow.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </HorizontalScroller>
            )}
          </div>
        )}

        {showProducts && hasProducts && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold">Products</h2>
            {isTextSearch && (
              <p className="mt-1 text-sm text-stone-500">Closest name match first.</p>
            )}
            {productHits.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {productHits.map((hit) => {
                  const offer = isTextSearch
                    ? offers.find((item) => item.product.id === hit.id && item.sellerCount > 0)
                    : undefined;
                  return offer ? (
                    <CatalogProductCard key={hit.id} offer={offer} />
                  ) : (
                    <ProductHitCard key={hit.id} hit={hit} />
                  );
                })}
              </div>
            )}
            {filteredOffers.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {filteredOffers
                  .filter((offer) => !productHits.some((hit) => hit.id === offer.product.id))
                  .map((offer) => (
                    <CatalogProductCard key={offer.product.id} offer={offer} />
                  ))}
              </div>
            )}
          </div>
        )}

        {showServices && serviceHits.length > 0 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {serviceHits.map((hit) => (
              <ServiceHitCard key={hit.id} hit={hit} />
            ))}
          </div>
        )}

        {showPeople && peopleHits.length > 0 && (
          <div className="mt-6 space-y-3">
            {peopleHits.map((hit) => (
              <PersonHitCard key={hit.id} hit={hit} />
            ))}
          </div>
        )}

        {isCategoryBrowse && !loading && !hasShops && !hasProducts && (
          <div className="mt-8 space-y-3 rounded-2xl bg-white p-6 text-sm text-stone-500">
            <p>
              Nothing within {shopRadiusKm} km of {locationLabel} yet
              {categoryName !== "this category" ? ` for ${categoryName}` : ""}.
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={openLocation} className="btn-primary btn-sm">
                Change location
              </button>
              <Link href="/" className="self-center underline">
                Browse home
              </Link>
            </div>
          </div>
        )}

        {!isCategoryBrowse && nothingFound && (
          <div className="mt-8 space-y-3 rounded-2xl bg-white p-6 text-sm text-stone-500">
            <p>
              {isTextSearch
                ? `No products or shops named “${q}”.`
                : `Nothing within ${shopRadiusKm} km of ${locationLabel} yet.`}
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={openLocation} className="btn-primary btn-sm">
                Change location
              </button>
              <Link href="/" className="self-center underline">
                Browse home
              </Link>
            </div>
          </div>
        )}

        {filteredEmpty && (
          <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-stone-500">
            No {filter} matched this search.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => setFilter("all")}
            >
              Show all results
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-stone-500">Loading search…</div>}>
      <SearchResultsView />
    </Suspense>
  );
}
