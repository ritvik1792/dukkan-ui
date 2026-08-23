import Link from "next/link";
import { formatDistance } from "@/lib/geo";
import type { Shop } from "@/lib/types";

export function ShopCard({
  shop,
  distanceKm,
  productCount,
}: {
  shop: Shop;
  distanceKm: number;
  productCount: number;
}) {
  return (
    <Link
      href={`/shop/${shop.id}`}
      className="flex min-w-[260px] snap-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm hover:border-teal-700/30"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ink text-lg font-bold text-lime">
        {shop.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-ink">{shop.name}</h3>
          {shop.verified && (
            <span className="rounded-full bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold text-teal-800">
              GST
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-stone-500">
          {shop.rating} ★ · {shop.reviews} · {formatDistance(distanceKm)}
        </p>
        <p className="mt-1 truncate text-xs text-stone-500">
          {productCount} products · {shop.deliveryModes.join(" + ")}
        </p>
      </div>
    </Link>
  );
}
