"use client";

import { useApp } from "@/context/AppContext";
import { CATEGORY_HUES } from "@/lib/constants";
import { formatInr, shopLocality } from "@/lib/format";
import { formatDistance } from "@/lib/geo";
import { ROUTES } from "@/lib/routes";
import type { NearbyShop } from "@/lib/types";
import { shopPromoLines } from "@/services/catalog";
import { isShopOpenNow } from "@/lib/shopOps";
import Link from "next/link";

function ShopArt({ shop }: { shop: NearbyShop }) {
  const { state } = useApp();
  const primary = shop.categoryIds[0] ?? "grocery";
  const hue = CATEGORY_HUES[primary] ?? 150;
  const emoji = state.categories.find((c) => c.id === primary)?.emoji ?? "🏪";
  if (shop.imageUrl) {
    return (
      <div className="relative h-44 overflow-hidden sm:h-48">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={shop.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className="relative h-44 overflow-hidden sm:h-48"
      style={{
        background: `linear-gradient(155deg, hsl(${hue} 48% 42%) 0%, hsl(${hue} 42% 22%) 58%, hsl(${(hue + 28) % 360} 38% 12%) 100%)`,
      }}
    >
      <div
        className="absolute -right-10 -top-12 h-44 w-44 rounded-full opacity-35"
        style={{ background: `hsl(${hue} 72% 58%)` }}
      />
      <div
        className="absolute -bottom-8 left-6 h-32 w-32 rounded-full opacity-25"
        style={{ background: `hsl(${(hue + 40) % 360} 80% 62%)` }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-40">
        {emoji}
      </div>
    </div>
  );
}

function StarMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-3 w-3">
      <path
        d="M12 3.6l2.35 4.76 5.25.76-3.8 3.7.9 5.24L12 15.58 7.3 18.06l.9-5.24-3.8-3.7 5.25-.76L12 3.6z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ShopCard({ shop }: { shop: NearbyShop }) {
  const { selectShop, state } = useApp();
  const categoryNames = shop.categoryIds
    .map((id) => state.categories.find((c) => c.id === id)?.name)
    .filter(Boolean)
    .slice(0, 2);
  const promos = shopPromoLines(shop, state.listings, state.coupons, state.promoTags);
  const headline = promos[0];
  const more = Math.max(0, promos.length - 1);

  return (
    <Link
      href={ROUTES.shopDashboard}
      onClick={() => selectShop(shop.id)}
      className="flex min-w-[16.5rem] flex-[1_0_18rem] snap-start flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] ring-1 ring-stone-200/80 transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lg sm:flex-[1_0_19rem]"
    >
      <div className="relative">
        <ShopArt shop={shop} />
        {!isShopOpenNow(shop) && (
          <span className="absolute left-3 top-3 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            Closed
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pb-3 pt-12">
          <div className="flex items-end justify-between gap-2">
            <h3 className="min-w-0 line-clamp-2 text-[17px] font-bold leading-tight text-white drop-shadow">
              {shop.name}
            </h3>
            {shop.rating > 0 && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                <StarMark />
                {shop.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1 px-3 py-2.5 text-[12px] text-stone-500">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 truncate">{categoryNames.join(" • ") || "Local dukkan"}</p>
          <p className="shrink-0 tabular-nums">
            {shop.minOrderAmount > 0 ? `${formatInr(shop.minOrderAmount)} min` : "No min"}
          </p>
        </div>
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 truncate">{shopLocality(shop.address)}</p>
          <p className="shrink-0 tabular-nums">{formatDistance(shop.distanceKm)}</p>
        </div>
      </div>

      {headline && (
        <div className="mt-auto flex items-center justify-between gap-2 bg-emerald-700 px-3 py-2 text-[11px] font-semibold text-white">
          <p className="min-w-0 truncate">{headline}</p>
          {more > 0 && <span className="shrink-0 text-white/80">+ {more} more</span>}
        </div>
      )}
    </Link>
  );
}
