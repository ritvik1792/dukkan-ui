"use client";

import { useApp } from "@/context/AppContext";
import { formatInr, percentOff } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import type { Listing } from "@/lib/types";
import type { UniqueOffer } from "@/services/catalog";
import { cheapestLanded } from "@/services/pricing";
import { listingCartQty, listingMaxQty } from "@/services/cart";
import Link from "next/link";
import { QtyControl } from "./QtyControl";
import { ProductArt } from "./ProductArt";
import { TagBadge } from "./TagBadge";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
      <path
        d="M12 3.6l2.35 4.76 5.25.76-3.8 3.7.9 5.24L12 15.58 7.3 18.06l.9-5.24-3.8-3.7 5.25-.76L12 3.6z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WishlistButton({
  catalogProductId,
  className = "",
}: {
  catalogProductId: string;
  className?: string;
}) {
  const { state, dispatch } = useApp();
  const saved = state.wishlist.includes(catalogProductId);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch({ type: "toggleWishlist", catalogProductId });
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors duration-200 ${
        saved ? "text-amber-500" : "text-stone-500 hover:text-amber-500"
      } ${className}`}
    >
      <span className={`flex transition-transform duration-200 ${saved ? "scale-110" : "scale-100"}`}>
        <StarIcon filled={saved} />
      </span>
    </button>
  );
}

function CartQtyStepper({ listing }: { listing: Listing }) {
  const { state, dispatch, shopById } = useApp();
  const qty = listingCartQty(state.cart, listing.id);
  const inStock = listing.stock > 0;
  const maxQty = listingMaxQty(listing);

  function deliveryMode() {
    const shop = shopById(listing.shopId);
    if (!shop) return "partner" as const;
    return cheapestLanded(listing, shop)?.mode ?? "partner";
  }

  function increase() {
    if (!inStock || qty >= maxQty) return;
    if (qty === 0) {
      dispatch({
        type: "addToCart",
        item: {
          listingId: listing.id,
          quantity: listing.moq,
          deliveryMode: deliveryMode(),
        },
      });
      return;
    }
    dispatch({ type: "setQty", listingId: listing.id, quantity: qty + 1 });
  }

  function decrease() {
    if (qty <= 0) return;
    dispatch({ type: "setQty", listingId: listing.id, quantity: qty - 1 });
  }

  if (!inStock) {
    return (
      <p className="flex h-8 w-24 shrink-0 items-center justify-center text-center text-xs font-semibold text-red-700">
        Out of stock
      </p>
    );
  }

  return (
    <QtyControl
      qty={qty}
      max={maxQty}
      onIncrease={increase}
      onDecrease={decrease}
    />
  );
}

export function CatalogProductCard({
  offer,
  preferShopId,
}: {
  offer: UniqueOffer;
  preferShopId?: string;
}) {
  const { selectProduct } = useApp();
  const listing =
    offer.nearbyListings.find((l) => l.shopId === preferShopId) ?? offer.bestListing;
  const off = listing ? percentOff(listing.basePrice, listing.sellerPrice) : 0;

  function openProduct() {
    selectProduct(offer.product.id, preferShopId);
  }

  return (
    <article className="relative flex flex-col rounded-2xl border border-stone-200 bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative">
        <Link href={ROUTES.productInfo} onClick={openProduct} className="block">
          <ProductArt hue={offer.product.imageHue} label={offer.product.imageLabel} imageUrl={offer.product.imageUrl} />
        </Link>
        <WishlistButton
          catalogProductId={offer.product.id}
          className="absolute right-2 top-2 z-10"
        />
      </div>
      <Link
        href={ROUTES.productInfo}
        onClick={openProduct}
        className="flex min-w-0 flex-1 flex-col"
      >
        <div className="mt-2 flex flex-wrap gap-1">
          {listing?.tags.slice(0, 2).map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
        <h3 className="mt-2 line-clamp-2 min-h-10 text-sm font-semibold text-ink">
          {offer.product.name}
        </h3>
        <p className="text-xs text-stone-500">
          {offer.product.brand} · {offer.product.unit}
        </p>
      </Link>
      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="text-base font-bold">{formatInr(listing?.sellerPrice ?? offer.fromPrice)}</span>
          {listing && listing.basePrice > listing.sellerPrice && (
            <span className="text-xs text-stone-400 line-through">
              {formatInr(listing.basePrice)}
            </span>
          )}
          {off > 0 && <span className="text-xs font-semibold text-teal-700">{off}% off</span>}
        </div>
        {listing && <CartQtyStepper listing={listing} />}
      </div>
      <p className="mt-1 text-xs text-stone-500">
        {offer.sellerCount} seller{offer.sellerCount === 1 ? "" : "s"} nearby
      </p>
    </article>
  );
}
