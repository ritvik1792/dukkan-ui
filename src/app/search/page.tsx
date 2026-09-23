"use client";

import { CatalogProductCard } from "@/components/CatalogProductCard";
import {
  PersonHitCard,
  ProductHitCard,
  ServiceHitCard,
} from "@/components/discovery/HitCards";
import { CategoryList } from "@/components/CategoryNav";
import { HorizontalScroller } from "@/components/HorizontalScroller";
import { ShopCard } from "@/components/ShopCard";
import { Field, Select } from "@/components/ui/Field";
import { useApp, useUniqueOffers } from "@/context/AppContext";
import { fetchSearch } from "@/lib/api";
import { useMotionRouter } from "@/lib/motion";
import type { NearbyShop, SearchFilter, SearchResults } from "@/lib/types";
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
  const q = params.get("q") ?? "";
  const categoryId = params.get("category") ?? "";
  const filterParam = (params.get("filter") ?? "all") as SearchFilter;
  const { nearbyShops, state, origin } = useApp();
  const [delivery, setDelivery] = useState<"all" | "partner" | "shop">("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [remote, setRemote] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  const filter = TABS.some((t) => t.id === filterParam) ? filterParam : "all";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSearch({
      q: q || undefined,
      filter,
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
  }, [q, filter, categoryId, origin.lat, origin.lng]);

  const offers = useUniqueOffers(q, categoryId || undefined);

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const listings = offer.nearbyListings.filter((l) => {
        const shop = state.shops.find((s) => s.id === l.shopId);
        if (!shop) return false;
        if (verifiedOnly && !shop.verified) return false;
        if (delivery === "partner" && !shop.partnerDeliveryEnabled) return false;
        if (delivery === "shop" && !shop.shopDeliveryEnabled) return false;
        return true;
      });
      return listings.length > 0;
    });
  }, [offers, delivery, verifiedOnly, state.shops]);

  const localShops = useMemo(() => {
    const needle = q.toLowerCase();
    return nearbyShops.filter((s) => {
      if (categoryId && !s.categoryIds.includes(categoryId)) return false;
      if (!needle) return true;
      return `${s.name} ${s.description}`.toLowerCase().includes(needle);
    });
  }, [nearbyShops, q, categoryId]);

  const apiShops: NearbyShop[] = useMemo(() => {
    if (!remote?.shops.length) return [];
    return remote.shops.map((shop) => {
      const existing = nearbyShops.find((s) => s.id === shop.id);
      return existing ?? { ...shop, distanceKm: 0 };
    });
  }, [remote, nearbyShops]);

  const shopsToShow = remote && (q || filter === "shops" || filter === "all") ? apiShops : localShops;

  const heading =
    q || categoryId
      ? q || state.categories.find((c) => c.id === categoryId)?.name
      : "All";

  function setFilter(next: SearchFilter) {
    const usp = new URLSearchParams();
    if (q) usp.set("q", q);
    if (categoryId) usp.set("category", categoryId);
    if (next !== "all") usp.set("filter", next);
    router.push(`/search?${usp.toString()}`);
  }

  const showProducts = filter === "all" || filter === "products";
  const showShops = filter === "all" || filter === "shops";
  const showServices = filter === "all" || filter === "services";
  const showPeople = filter === "all" || filter === "people";

  const productHits = remote?.products ?? [];
  const serviceHits = remote?.services ?? [];
  const peopleHits = remote?.people ?? [];

  return (
    <div className="page-shell flex gap-6 py-6">
      <aside className="hidden w-48 shrink-0 lg:block">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Menu</p>
        <CategoryList activeId={categoryId || undefined} />
        {showProducts && (
          <div className="mt-6 space-y-3">
            <Field label="Delivery">
              <Select value={delivery} onChange={(e) => setDelivery(e.target.value as typeof delivery)}>
                <option value="all">Any</option>
                <option value="partner">Partner</option>
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

        <div className="mt-4 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                filter === tab.id ? "bg-ink text-lime" : "bg-stone-100 text-ink hover:bg-stone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && <p className="mt-4 text-sm text-stone-500">Searching…</p>}

        {showShops && shopsToShow.length > 0 && (
          <div className="mt-6">
            <HorizontalScroller title="Shops">
              {shopsToShow.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </HorizontalScroller>
          </div>
        )}

        {showProducts && (
          <>
            {productHits.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
                {productHits.map((hit) => (
                  <ProductHitCard key={hit.id} hit={hit} />
                ))}
              </div>
            )}
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
              {filteredOffers.map((offer) => (
                <CatalogProductCard key={offer.product.id} offer={offer} />
              ))}
            </div>
            {productHits.length === 0 && filteredOffers.length === 0 && !loading && (
              <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-stone-500">
                No products match these filters nearby.{" "}
                <Link href="/" className="underline">
                  Browse home
                </Link>
              </p>
            )}
          </>
        )}

        {showServices && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {serviceHits.map((hit) => (
              <ServiceHitCard key={hit.id} hit={hit} />
            ))}
            {serviceHits.length === 0 && !loading && (
              <p className="text-sm text-stone-500">No services found for this search.</p>
            )}
          </div>
        )}

        {showPeople && (
          <div className="mt-6 space-y-3">
            {peopleHits.map((hit) => (
              <PersonHitCard key={hit.id} hit={hit} />
            ))}
            {peopleHits.length === 0 && !loading && (
              <p className="text-sm text-stone-500">No people or pros matched this search.</p>
            )}
          </div>
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
