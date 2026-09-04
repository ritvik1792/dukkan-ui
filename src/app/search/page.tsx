"use client";

import { CatalogProductCard } from "@/components/CatalogProductCard";
import { CategoryList } from "@/components/CategoryNav";
import { HorizontalScroller } from "@/components/HorizontalScroller";
import { ShopCard } from "@/components/ShopCard";
import { Field, Select } from "@/components/ui/Field";
import { useApp, useUniqueOffers } from "@/context/AppContext";
import { categories } from "@/data/seed";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

function SearchResults() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") ?? "";
  const categoryId = params.get("category") ?? "";
  const { nearbyShops, state } = useApp();
  const [delivery, setDelivery] = useState<"all" | "partner" | "shop">("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const offers = useUniqueOffers(q, categoryId || undefined);

  const filtered = useMemo(() => {
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

  const shops = useMemo(() => {
    const needle = q.toLowerCase();
    return nearbyShops.filter((s) => {
      if (categoryId && !s.categoryIds.includes(categoryId)) return false;
      if (!needle) return true;
      return `${s.name} ${s.description}`.toLowerCase().includes(needle);
    });
  }, [nearbyShops, q, categoryId]);

  const heading = q ? q : categoryId ? categories.find((c) => c.id === categoryId)?.name : "All";

  return (
    <div className="page-shell flex gap-6 py-6">
      <aside className="hidden w-48 shrink-0 lg:block">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
          Menu
        </p>
        <CategoryList activeId={categoryId || undefined} />
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
      </aside>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
          {heading}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">
          {q ? `Results for “${q}”` : heading === "All" ? "All nearby products" : heading}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Same product is listed once. Open it to pick a seller.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:hidden">
          <Select
            value={categoryId}
            onChange={(e) => {
              const next = e.target.value;
              const usp = new URLSearchParams();
              if (q) usp.set("q", q);
              if (next) usp.set("category", next);
              router.push(`/search?${usp.toString()}`);
            }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={delivery} onChange={(e) => setDelivery(e.target.value as typeof delivery)}>
            <option value="all">Any delivery</option>
            <option value="partner">Partner</option>
            <option value="shop">Shop itself</option>
          </Select>
        </div>

        {shops.length > 0 && (
          <div className="mt-6">
            <HorizontalScroller title="Shops">
              {shops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </HorizontalScroller>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          {filtered.map((offer) => (
            <CatalogProductCard key={offer.product.id} offer={offer} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-stone-500">
            No unique products match these filters nearby.
          </p>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-stone-500">Loading search…</div>}>
      <SearchResults />
    </Suspense>
  );
}
