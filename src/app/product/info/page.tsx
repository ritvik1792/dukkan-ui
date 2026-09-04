"use client";

import { DeliveryPicker } from "@/components/DeliveryPicker";
import { WishlistButton } from "@/components/CatalogProductCard";
import { ProductArt } from "@/components/ProductArt";
import { TagBadge } from "@/components/TagBadge";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { formatInr, percentOff } from "@/lib/format";
import { formatDistance } from "@/lib/geo";
import { ROUTES } from "@/lib/routes";
import type { CatalogProduct, DeliveryMode, Listing, Review } from "@/lib/types";
import { cheapestLanded, deliveryFeeFor, shopDeliveryModes } from "@/services/pricing";
import { fetchProduct } from "@/services/storefront";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ProductInfoPage() {
  const { state, nearbyShops, shopById, dispatch, selectShop } = useApp();
  const { showAlert } = useAlert();
  const router = useRouter();
  const productId = state.viewProductId;
  const preferShopId = state.viewPreferShopId;

  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingId, setListingId] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<DeliveryMode>("partner");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!state.hydrated) return;
    if (!productId) {
      setProduct(null);
      setListings([]);
      setReviews([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchProduct(productId, {
      shops: state.shops,
      catalog: state.catalog,
      listings: state.listings,
      reviews: state.reviews,
    }).then((payload) => {
      if (cancelled) return;
      setProduct(payload?.product ?? null);
      setListings(payload?.listings ?? []);
      setReviews(payload?.reviews ?? []);
      setListingId(undefined);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [state.hydrated, productId, state.shops, state.catalog, state.listings, state.reviews]);

  const nearbyIds = useMemo(
    () => new Set(nearbyShops.map((s) => s.id)),
    [nearbyShops],
  );

  const offers = useMemo(() => {
    return listings
      .flatMap((listing) => {
        const shop = shopById(listing.shopId);
        if (!shop || !nearbyIds.has(listing.shopId)) return [];
        const best = cheapestLanded(listing, shop);
        return [{ listing, shop, best }];
      })
      .sort((a, b) => (a.best?.total ?? Infinity) - (b.best?.total ?? Infinity));
  }, [listings, nearbyIds, shopById]);

  const defaultOffer = offers.find((o) => o.shop.id === preferShopId) ?? offers[0];
  const selected = offers.find((o) => o.listing.id === listingId) ?? defaultOffer;

  if (!state.hydrated || loading) {
    return <p className="p-8 text-sm text-stone-500">Loading product…</p>;
  }

  if (!productId || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">No product selected</h1>
        <p className="mt-2 text-sm text-stone-500">
          Open a product from search or a dukkan. This page always stays at {ROUTES.productInfo}{" "}
          and loads the item you clicked.
        </p>
        <Link href="/search" className="mt-6 inline-block text-sm underline">
          Browse products
        </Link>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <p className="mt-2 text-sm text-stone-500">
          No nearby sellers for this product. Switch location or browse shops.
        </p>
      </div>
    );
  }

  const { listing, shop } = selected;
  const productName = product.name;
  const fee = deliveryFeeFor(shop, mode);
  const off = percentOff(listing.basePrice, listing.sellerPrice);
  const modes = shopDeliveryModes(shop);
  const activeMode = modes.includes(mode) ? mode : modes[0];
  const avg =
    reviews.length === 0
      ? 0
      : reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  function chooseSeller(next: Listing) {
    setListingId(next.id);
    const shopNext = shopById(next.shopId);
    if (shopNext) {
      const best = cheapestLanded(next, shopNext);
      if (best) setMode(best.mode);
    }
  }

  const inStock = listing.stock > 0;
  const maxQty = Math.max(listing.moq, Math.min(Math.max(listing.stock, 0), 10));
  const qtyOptions = inStock
    ? Array.from({ length: maxQty - listing.moq + 1 }, (_, i) => listing.moq + i)
    : [];
  const safeQty = qtyOptions.includes(qty) ? qty : (qtyOptions[0] ?? listing.moq);

  function addToCart() {
    dispatch({
      type: "addToCart",
      item: {
        listingId: listing.id,
        quantity: safeQty,
        deliveryMode: activeMode,
      },
    });
    showAlert({
      tone: "success",
      title: "Added to cart successfully",
      message: `${safeQty} × ${productName}`,
      action: { href: "/cart", label: "View cart" },
    });
  }

  function buyNow() {
    dispatch({
      type: "addToCart",
      item: {
        listingId: listing.id,
        quantity: safeQty,
        deliveryMode: activeMode,
      },
    });
    router.push("/checkout");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1fr_280px]">
        <div className="relative">
          <ProductArt
            hue={product.imageHue}
            label={product.imageLabel}
            className="h-80 lg:min-h-80 lg:h-full"
          />
          <WishlistButton catalogProductId={product.id} className="absolute right-3 top-3 z-10" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-stone-500">
            {product.brand} · {product.unit}
          </p>
          <h1 className="mt-1 text-3xl font-semibold">{product.name}</h1>
          <p className="mt-2 text-sm text-stone-600">{product.description}</p>
          <p className="mt-3 text-sm">
            {avg ? `${avg.toFixed(1)} ★` : "No rating"} · {reviews.length} reviews
          </p>
          <div className="mt-4 flex flex-wrap gap-1">
            {listing.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatInr(listing.sellerPrice)}</span>
            <span className="text-stone-400 line-through">{formatInr(listing.basePrice)}</span>
            {off > 0 && (
              <span className="text-sm font-semibold text-teal-800">{off}% off</span>
            )}
          </div>
          <p className="mt-1 text-sm text-stone-500">
            + {formatInr(fee)} delivery · landed {formatInr(listing.sellerPrice + fee)}
          </p>
          <p className={`mt-3 text-sm font-semibold ${inStock ? "text-teal-800" : "text-red-700"}`}>
            {inStock
              ? listing.stock <= 5
                ? `Only ${listing.stock} left in stock`
                : "In stock"
              : "Out of stock"}
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Delivery typically {state.settings.partnerEtaMinutes} min · Sold by {shop.name}
          </p>
          {(listing.color || listing.quality) && (
            <p className="mt-2 text-sm text-stone-500">
              {listing.color ? `Colour: ${listing.color}` : ""}
              {listing.color && listing.quality ? " · " : ""}
              {listing.quality ? `Quality: ${listing.quality}` : ""}
            </p>
          )}

          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold">How should it arrive?</p>
            <DeliveryPicker shop={shop} value={activeMode} onChange={setMode} />
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <label className="block text-sm">
            Quantity
            <select
              value={safeQty}
              disabled={!inStock}
              onChange={(e) => setQty(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-cream px-3 py-2"
            >
              {qtyOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <p className="mt-3 flex items-baseline justify-between text-sm">
            <span className="text-stone-500">Total incl. delivery</span>
            <span className="text-lg font-bold">
              {formatInr(listing.sellerPrice * safeQty + fee)}
            </span>
          </p>

          <button
            type="button"
            disabled={!inStock}
            onClick={addToCart}
            className="mt-4 w-full rounded-full bg-[#ffd814] px-4 py-3 text-sm font-semibold text-ink hover:bg-[#f7ca00] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add to cart
          </button>
          <button
            type="button"
            disabled={!inStock}
            onClick={buyNow}
            className="mt-2 w-full rounded-full bg-[#ffa41c] px-4 py-3 text-sm font-semibold text-ink hover:bg-[#fa8900] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Buy now
          </button>
          <Link
            href="/cart"
            className="mt-3 block text-center text-xs text-stone-500 underline"
          >
            Go to cart
          </Link>
        </aside>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Choose a seller</h2>
        <p className="text-sm text-stone-500">
          Default is the lowest seller price plus delivery.
        </p>
        <div className="mt-4 space-y-3">
          {offers.map(({ listing: l, shop: s, best }) => (
            <button
              key={l.id}
              type="button"
              onClick={() => chooseSeller(l)}
              className={`w-full rounded-2xl border p-4 text-left ${
                l.id === listing.id ? "border-ink bg-white" : "border-stone-200 bg-white/60"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-stone-500">
                    {s.rating} ★ · {formatDistance(nearbyShops.find((n) => n.id === s.id)?.distanceKm ?? 0)}
                    {s.verified ? " · GST verified" : ""}
                    {l.color ? ` · ${l.color}` : ""}
                    {l.quality ? ` · ${l.quality}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatInr(l.sellerPrice)}</p>
                  <p className="text-xs text-stone-500">
                    + {formatInr(best?.fee ?? 0)} {best?.mode} · landed{" "}
                    {formatInr(best?.total ?? l.sellerPrice)}
                  </p>
                </div>
              </div>
              <Link
                href={ROUTES.shopDashboard}
                className="mt-2 inline-block text-xs underline"
                onClick={(e) => {
                  e.stopPropagation();
                  selectShop(s.id);
                }}
              >
                View dukkan
              </Link>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Reviews</h2>
        <ul className="mt-4 space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-2xl bg-white p-4">
              <p className="font-semibold">
                {review.rating} ★ · {review.title}
              </p>
              <p className="mt-1 text-sm text-stone-600">{review.body}</p>
              {review.sellerReply && (
                <p className="mt-2 rounded-xl bg-cream px-3 py-2 text-sm">
                  <span className="font-medium">Seller: </span>
                  {review.sellerReply.body}
                </p>
              )}
            </li>
          ))}
          {reviews.length === 0 && (
            <p className="text-sm text-stone-500">No reviews yet.</p>
          )}
        </ul>
      </section>
    </div>
  );
}
