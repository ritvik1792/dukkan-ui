"use client";

import { DeliveryPicker } from "@/components/DeliveryPicker";
import { WishlistButton } from "@/components/CatalogProductCard";
import { ProductArt } from "@/components/ProductArt";
import { QtyControl } from "@/components/QtyControl";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { WriteReviewForm } from "@/components/reviews/WriteReviewForm";
import { TagBadge } from "@/components/TagBadge";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { createProductRequest, mapProductRequest } from "@/lib/api";
import { uniqueMediaUrls } from "@/lib/mediaUrls";
import { formatInr, formatRelativeAgo, percentOff } from "@/lib/format";
import { visibleListingTags } from "@/lib/tags";
import { formatDistance } from "@/lib/geo";
import { requestPath, ROUTES } from "@/lib/routes";
import type { CatalogProduct, DeliveryMode, Listing, Review } from "@/lib/types";
import { listingCartQty, listingMaxQty } from "@/services/cart";
import { cheapestLanded, deliveryFeeFor, shopDeliveryModes } from "@/services/pricing";
import { fetchProduct } from "@/services/storefront";
import { normalizeOrderStatus } from "@/lib/orders";
import Link from "next/link";
import { useMotionRouter } from "@/lib/motion";
import { useEffect, useMemo, useState } from "react";

export default function ProductInfoPage() {
  const { state, nearbyShops, shopById, dispatch, selectShop, user } = useApp();
  const { showAlert } = useAlert();
  const router = useMotionRouter();
  const productId = state.viewProductId;
  const preferShopId = state.viewPreferShopId;

  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingId, setListingId] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<DeliveryMode>("partner");
  const [activePhoto, setActivePhoto] = useState<string | undefined>(undefined);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [maxBudget, setMaxBudget] = useState("");

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
      setActivePhoto(undefined);
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
        const best = cheapestLanded(listing, shop, state.settings.quickDeliveryEnabled);
        return [{ listing, shop, best }];
      })
      .sort((a, b) => (a.best?.total ?? Infinity) - (b.best?.total ?? Infinity));
  }, [listings, nearbyIds, shopById, state.settings.quickDeliveryEnabled]);

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
  const modes = shopDeliveryModes(shop, state.settings.quickDeliveryEnabled);
  const activeMode = modes.includes(mode) ? mode : modes[0];
  const fee = activeMode ? deliveryFeeFor(shop, activeMode) : 0;
  const off = percentOff(listing.basePrice, listing.sellerPrice);
  const avg =
    reviews.length === 0
      ? 0
      : reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  function chooseSeller(next: Listing) {
    setListingId(next.id);
    const shopNext = shopById(next.shopId);
    if (shopNext) {
      const best = cheapestLanded(next, shopNext, state.settings.quickDeliveryEnabled);
      if (best) setMode(best.mode);
    }
  }

  const inStock = listing.stock > 0;
  const maxQty = listingMaxQty(listing);
  const cartQty = listingCartQty(state.cart, listing.id);
  const displayQty = cartQty > 0 ? cartQty : listing.moq;

  function addOrIncrease() {
    if (!inStock || cartQty >= maxQty) return;
    if (cartQty === 0) {
      dispatch({
        type: "addToCart",
        item: {
          listingId: listing.id,
          quantity: listing.moq,
          deliveryMode: activeMode,
        },
      });
      showAlert({
        tone: "success",
        title: "Added to cart",
        message: `${listing.moq} × ${productName}`,
        action: { href: "/cart", label: "View cart" },
      });
      return;
    }
    dispatch({ type: "setQty", listingId: listing.id, quantity: cartQty + 1 });
  }

  function decrease() {
    if (cartQty <= 0) return;
    dispatch({ type: "setQty", listingId: listing.id, quantity: cartQty - 1 });
  }

  function buyNow() {
    if (cartQty === 0) {
      dispatch({
        type: "addToCart",
        item: {
          listingId: listing.id,
          quantity: listing.moq,
          deliveryMode: activeMode,
        },
      });
    }
    router.push("/checkout");
  }

  async function askNearbySellers(target: Listing) {
    if (!user) {
      showAlert({
        tone: "warning",
        title: "Sign in required",
        message: "Sign in as a buyer to ask nearby sellers if they have this product.",
        action: { href: "/login", label: "Sign in" },
      });
      return;
    }
    const coords = state.location?.coordinates;
    if (!coords) {
      showAlert({
        tone: "warning",
        title: "Location needed",
        message: "Set your delivery location so we can reach nearby sellers.",
      });
      return;
    }
    const budgetValue = maxBudget.trim() === "" ? undefined : Number(maxBudget);
    if (budgetValue != null && (!Number.isFinite(budgetValue) || budgetValue <= 0)) {
      showAlert({
        tone: "warning",
        title: "Invalid budget",
        message: "Enter a positive max budget, or leave it blank.",
      });
      return;
    }
    setConfirmingId(target.id);
    try {
      const payload = await createProductRequest({
        catalogProductId: product!.id,
        listingId: target.id,
        queryText: product!.name,
        buyerLat: coords.lat,
        buyerLng: coords.lng,
        maxBudget: budgetValue,
      });
      const request = mapProductRequest(payload.request);
      showAlert({
        tone: "success",
        title: "Sellers notified",
        message: "Nearby shops can answer yes or no with a price in their Availability inbox.",
        action: { href: requestPath(request.id), label: "View status" },
      });
      router.push(requestPath(request.id));
    } catch (err) {
      showAlert({
        tone: "warning",
        title: "Could not start request",
        message: err instanceof Error ? err.message : "Try again in a moment.",
      });
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <div className="page-shell mx-auto max-w-6xl py-8">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1fr_280px]">
        <div>
          <div className="relative">
            <ProductArt
              hue={product.imageHue}
              label={product.imageLabel}
              imageUrl={activePhoto ?? product.imageUrl}
              className="h-64 sm:h-80 lg:min-h-80 lg:h-full"
            />
            <WishlistButton catalogProductId={product.id} className="absolute right-3 top-3 z-10" />
          </div>
          {uniqueMediaUrls([product.imageUrl, ...(product.galleryUrls ?? [])]).length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {uniqueMediaUrls([product.imageUrl, ...(product.galleryUrls ?? [])])
                .map((src) => (
                  <button
                    key={src.slice(0, 48)}
                    type="button"
                    className={`h-16 w-16 overflow-hidden rounded-xl ring-1 transition duration-200 ${
                      (activePhoto ?? product.imageUrl) === src ? "ring-ink" : "ring-border"
                    }`}
                    onClick={() => setActivePhoto(src)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-stone-500">
            {product.brand} · {product.unit}
          </p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{product.name}</h1>
          <p className="mt-2 text-sm text-stone-600">{product.description}</p>
          <p className="mt-3 text-sm">
            {avg ? `${avg.toFixed(1)} ★` : "No rating"} · {reviews.length} reviews
          </p>
          <div className="mt-4 flex flex-wrap gap-1">
            {visibleListingTags(listing, state.promoTags).map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatInr(listing.sellerPrice)}</span>
            <span className="text-stone-400 line-through">{formatInr(listing.basePrice)}</span>
            {off > 0 && (
              <span className="text-sm font-semibold text-carrot">{off}% off</span>
            )}
          </div>
          <p className="mt-1 text-sm text-stone-500">
            + {formatInr(fee)} delivery · landed {formatInr(listing.sellerPrice + fee)}
          </p>
          <p className={`mt-3 text-sm font-semibold ${inStock ? "text-carrot" : "text-red-700"}`}>
            {inStock
              ? listing.stock <= 5
                ? `Only ${listing.stock} left in stock`
                : "In stock"
              : "Out of stock"}
          </p>
          <p className="mt-1 text-sm text-stone-500">
            {activeMode === "partner"
              ? `Delivery typically ${state.settings.partnerEtaMinutes} min · `
              : ""}
            Sold by {shop.name}
          </p>
          {(listing.color || listing.quality || listing.warranty) && (
            <p className="mt-2 text-sm text-stone-500">
              {[
                listing.color ? `Colour: ${listing.color}` : "",
                listing.quality ? `Quality: ${listing.quality}` : "",
                listing.warranty ? `Warranty: ${listing.warranty}` : "",
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold">How should it arrive?</p>
            <DeliveryPicker shop={shop} value={activeMode} onChange={setMode} />
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">Quantity</p>
          <div className="mt-2">
            <QtyControl
              qty={cartQty}
              max={maxQty}
              disabled={!inStock}
              onIncrease={addOrIncrease}
              onDecrease={decrease}
              size="wide"
              addLabel="Add to cart"
            />
          </div>

          <p className="mt-3 flex items-baseline justify-between text-sm">
            <span className="text-stone-500">Total incl. delivery</span>
            <span className="text-lg font-bold">
              {formatInr(listing.sellerPrice * displayQty + fee)}
            </span>
          </p>

          <button
            type="button"
            disabled={!inStock}
            onClick={buyNow}
            className="btn-primary btn-block btn-lg mt-4"
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
          Default is the lowest seller price plus delivery. Or ask nearby sellers — they answer yes/no
          with a price in their shop inbox.
        </p>
        <div className="mt-4 rounded-2xl border border-border bg-white p-4">
          <label className="block text-sm font-semibold" htmlFor="ask-max-budget">
            Max budget (optional)
          </label>
          <p className="mt-1 text-xs text-stone-500">
            Tell shops you want this product under ₹X. They can still offer any price.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-stone-500">₹</span>
            <input
              id="ask-max-budget"
              type="number"
              min={1}
              inputMode="numeric"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              placeholder="e.g. 499"
              className="w-40 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-ink"
            />
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {offers.map(({ listing: l, shop: s, best }) => (
            <div
              key={l.id}
              onClick={() => chooseSeller(l)}
              className={`w-full rounded-2xl border p-4 text-left ${
                l.id === listing.id ? "border-ink bg-white" : "border-border bg-white/60"
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
                    {l.warranty ? ` · ${l.warranty}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {formatRelativeAgo(l.availabilityConfirmedAt)}
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
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={confirmingId === l.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    void askNearbySellers(l);
                  }}
                  className="rounded-full bg-carrot px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {confirmingId === l.id ? "Asking sellers…" : "Ask nearby sellers"}
                </button>
                <Link
                  href={ROUTES.shopDashboard}
                  className="text-xs underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectShop(s.id);
                  }}
                >
                  View dukkan
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Reviews</h2>
        {user?.id &&
          state.orders.some(
            (order) =>
              order.buyerId === user.id &&
              normalizeOrderStatus(order.status) === "delivered" &&
              order.items.some((item) => item.catalogProductId === product.id),
          ) &&
          !reviews.some((review) => review.buyerId === user.id && review.catalogProductId === product.id) && (
            <div className="mt-4">
              <WriteReviewForm
                catalogProductId={product.id}
                listingId={listing.id}
                shopId={shop.id}
                orderId={
                  state.orders.find(
                    (order) =>
                      order.buyerId === user.id &&
                      normalizeOrderStatus(order.status) === "delivered" &&
                      order.items.some((item) => item.catalogProductId === product.id),
                  )?.id
                }
                productName={product.name}
              />
            </div>
          )}
        <ul className="mt-4 space-y-3">
          {reviews.map((review) => (
            <li key={review.id}>
              <ReviewCard
                review={review}
                canAddPhotos={user?.id === review.buyerId}
              />
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
