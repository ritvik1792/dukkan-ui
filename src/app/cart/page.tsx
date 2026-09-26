"use client";

import { DeliveryPicker } from "@/components/DeliveryPicker";
import { ProductArt } from "@/components/ProductArt";
import { QtyControl } from "@/components/QtyControl";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { formatInr, percentOff } from "@/lib/format";
import type { DeliveryMode } from "@/lib/types";
import { cartShipments, cartSummary, deliveryCountLabel, listingMaxQty } from "@/services/cart";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { useMemo } from "react";

export default function CartPage() {
  const { state, listingById, catalogById, shopById, dispatch, selectShop, selectProduct } = useApp();
  const { showAlert } = useAlert();

  const shipments = useMemo(
    () =>
      cartShipments({
        cart: state.cart,
        listingById,
        shopById,
        catalogById,
        quickDeliveryEnabled: state.settings.quickDeliveryEnabled,
      }),
    [state.cart, listingById, shopById, catalogById, state.settings.quickDeliveryEnabled],
  );
  const summary = cartSummary(shipments);

  if (state.cart.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-stone-500">Search a product, then pick a nearby seller.</p>
        <Link
          href="/search"
          className="mt-6 inline-block rounded-full bg-carrot px-5 py-2 text-sm text-white hover:opacity-90"
        >
          Browse products
        </Link>
      </div>
    );
  }

  function setQuantity(listingId: string, quantity: number) {
    dispatch({ type: "setQty", listingId, quantity });
  }

  function removeLine(listingId: string, name: string) {
    dispatch({ type: "setQty", listingId, quantity: 0 });
    showAlert({
      tone: "info",
      title: "Removed from cart",
      message: name,
    });
  }

  function setShipmentDelivery(listingIds: string[], deliveryMode: DeliveryMode, shopName: string) {
    for (const listingId of listingIds) {
      dispatch({ type: "setCartDelivery", listingId, deliveryMode });
    }
    showAlert({
      tone: "success",
      title: deliveryMode === "partner" ? "Dukkan partner delivery" : "Shop delivery",
      message: `Applied to everything from ${shopName}`,
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="rounded-2xl border border-border bg-white px-5 py-4">
            <h1 className="text-2xl font-semibold">Shopping Cart</h1>
            <p className="mt-1 text-sm text-stone-600">
              Your {summary.itemCount} item{summary.itemCount === 1 ? "" : "s"} come from{" "}
              {shipments.length} seller{shipments.length === 1 ? "" : "s"}, so this order arrives in{" "}
              <span className="font-semibold text-ink">
                {deliveryCountLabel(summary.deliveryCount)}
              </span>
              . Each seller is delivered separately and charged its own delivery fee.
            </p>
          </div>

          <div className="mt-4 space-y-4">
            {shipments.map((shipment, index) => {
              const listingIds = shipment.lines.map((line) => line.listing.id);
              return (
                <section
                  key={shipment.shop.id}
                  className="overflow-hidden rounded-2xl border border-border bg-white"
                >
                  <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-cream px-5 py-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                        Delivery {index + 1} of {shipments.length}
                      </p>
                      <p className="mt-0.5 font-semibold">
                        Sold by{" "}
                        <Link
                          href={ROUTES.shopDashboard}
                          className="underline"
                          onClick={() => selectShop(shipment.shop.id)}
                        >
                          {shipment.shop.name}
                        </Link>
                      </p>
                      <p className="text-xs text-stone-500">
                        {shipment.itemCount} item{shipment.itemCount === 1 ? "" : "s"} ·{" "}
                        {shipment.shop.rating} ★{shipment.shop.verified ? " · GST verified" : ""}
                      </p>
                    </div>
                    <p className="text-sm text-stone-600">
                      Delivery fee{" "}
                      <span className="font-semibold text-ink">
                        {formatInr(shipment.deliveryFee)}
                      </span>{" "}
                      · charged once
                    </p>
                  </header>

                  <ul className="divide-y divide-border">
                    {shipment.lines.map(({ item, listing, product, lineTotal }) => {
                      const off = percentOff(listing.basePrice, listing.sellerPrice);
                      const href = ROUTES.productInfo;
                      const openProduct = () =>
                        selectProduct(product.id, shipment.shop.id);
                      return (
                        <li key={`${listing.id}-${item.deliveryMode}`} className="flex flex-col gap-3 p-4 sm:flex-row sm:gap-4 sm:p-5">
                          <Link href={href} onClick={openProduct} className="w-full shrink-0 sm:w-24 md:w-32">
                            <ProductArt
                              hue={product.imageHue}
                              label={product.imageLabel}
                              imageUrl={product.imageUrl}
                              className="h-40 w-full sm:h-24"
                            />
                          </Link>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <Link href={href} onClick={openProduct} className="font-semibold hover:underline">
                                  {product.name}
                                </Link>
                                <p className="text-xs text-stone-500">
                                  {product.brand} · {product.unit}
                                  {listing.color ? ` · ${listing.color}` : ""}
                                </p>
                                <p
                                  className={`mt-1 text-xs font-semibold ${
                                    listing.stock > 0 ? "text-carrot" : "text-red-700"
                                  }`}
                                >
                                  {listing.stock > 0 ? "In stock" : "Out of stock"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{formatInr(lineTotal)}</p>
                                {off > 0 && (
                                  <p className="text-xs text-stone-500">
                                    <span className="line-through">
                                      {formatInr(listing.basePrice)}
                                    </span>{" "}
                                    <span className="font-semibold text-carrot">{off}% off</span>
                                  </p>
                                )}
                                <p className="text-xs text-stone-500">
                                  {formatInr(listing.sellerPrice)} each
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              <QtyControl
                                qty={item.quantity}
                                max={Math.min(listing.stock, listingMaxQty(listing))}
                                onIncrease={() => setQuantity(listing.id, item.quantity + 1)}
                                onDecrease={() =>
                                  item.quantity <= listing.moq
                                    ? removeLine(listing.id, product.name)
                                    : setQuantity(listing.id, item.quantity - 1)
                                }
                                variant="stepper"
                                decreaseLabel={`Decrease quantity of ${product.name}`}
                                increaseLabel={`Increase quantity of ${product.name}`}
                              />
                              <button
                                type="button"
                                onClick={() => removeLine(listing.id, product.name)}
                                className="text-sm text-stone-600 underline"
                              >
                                Delete
                              </button>
                              <Link href={href} onClick={openProduct} className="text-sm text-stone-600 underline">
                                View product
                              </Link>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="border-t border-border px-5 py-4">
                    <p className="mb-2 text-sm font-semibold">
                      How should {shipment.shop.name} deliver?
                    </p>
                    <DeliveryPicker
                      shop={shipment.shop}
                      value={shipment.deliveryMode}
                      onChange={(mode) =>
                        setShipmentDelivery(listingIds, mode, shipment.shop.name)
                      }
                    />
                    <p className="mt-3 text-sm text-stone-600">
                      Delivery {index + 1} total{" "}
                      <span className="font-semibold text-ink">{formatInr(shipment.total)}</span>
                    </p>
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <aside className="h-fit space-y-3 rounded-2xl border border-border bg-white p-5 lg:sticky lg:top-24">
          <p className="text-sm text-stone-600">
            This order ships as {deliveryCountLabel(summary.deliveryCount)}.
          </p>
          <div className="space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-600">
                Subtotal ({summary.itemCount} item{summary.itemCount === 1 ? "" : "s"})
              </span>
              <span className="font-semibold">{formatInr(summary.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">
                Delivery ({deliveryCountLabel(summary.deliveryCount)})
              </span>
              <span className="font-semibold">{formatInr(summary.deliveryTotal)}</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between border-t border-border pt-3">
            <span className="font-semibold">Order total</span>
            <span className="text-xl font-bold">{formatInr(summary.total)}</span>
          </div>
          <Link
            href="/checkout"
            className="btn-primary btn-block btn-lg"
          >
            Proceed to Buy
          </Link>
          <Link
            href="/search"
            className="block text-center text-xs text-stone-500 underline"
          >
            Keep shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
