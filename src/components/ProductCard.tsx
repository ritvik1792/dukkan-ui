import Link from "next/link";
import { DELIVERY_RADIUS_KM, PARTNER_ETA_MINUTES } from "@/lib/constants";
import { formatDistance } from "@/lib/geo";
import type { DeliveryMode, Product, Shop } from "@/lib/types";
import { ProductArt } from "./ProductArt";

export function ProductCard({
  product,
  shop,
  distanceKm,
  onAdd,
}: {
  product: Product;
  shop: Shop;
  distanceKm: number;
  onAdd: (mode: DeliveryMode) => void;
}) {
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const partnerOk = product.deliveryModes.includes("partner");
  const shopOk = product.deliveryModes.includes("shop");

  return (
    <article className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/product/${product.id}`} className="block">
        <ProductArt product={product} />
        <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-stone-500">
          <span className="rounded-full bg-lime/40 px-2 py-0.5 text-ink">
            {formatDistance(distanceKm)} · within {DELIVERY_RADIUS_KM} km
          </span>
          {partnerOk && (
            <span>{PARTNER_ETA_MINUTES} min</span>
          )}
        </div>
        <h3 className="mt-2 line-clamp-2 min-h-10 text-sm font-semibold text-ink">
          {product.name}
        </h3>
        <p className="mt-0.5 text-xs text-stone-500">
          {product.brand} · {product.unit}
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-ink">₹{product.price}</span>
          <span className="text-xs text-stone-400 line-through">₹{product.mrp}</span>
          {discount > 0 && (
            <span className="text-xs font-semibold text-teal-700">{discount}% off</span>
          )}
        </div>
      </Link>
      <Link
        href={`/shop/${shop.id}`}
        className="mt-2 truncate text-xs text-stone-500 hover:text-teal-800"
      >
        Sold by <span className="font-medium text-ink">{shop.name}</span>
        {shop.verified ? " · Verified" : ""}
      </Link>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {partnerOk && (
          <button
            type="button"
            onClick={() => onAdd("partner")}
            className="rounded-xl bg-ink px-2 py-2 text-[11px] font-semibold text-lime"
          >
            Partner
          </button>
        )}
        {shopOk && (
          <button
            type="button"
            onClick={() => onAdd("shop")}
            className={`rounded-xl border border-ink/15 px-2 py-2 text-[11px] font-semibold text-ink ${
              partnerOk ? "" : "col-span-2 bg-ink text-lime"
            }`}
          >
            Shop delivery
          </button>
        )}
      </div>
    </article>
  );
}
