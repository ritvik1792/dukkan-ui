"use client";

import { ProductArt } from "@/components/ProductArt";
import { useApp } from "@/context/AppContext";
import { formatInr, itemWarranty } from "@/lib/format";
import { uniqueMediaUrls } from "@/lib/mediaUrls";
import type { Order } from "@/lib/types";
import Link from "next/link";

export function OrderIdButton({
  orderId,
  onOpen,
  href,
  openInNewWindow = false,
  className = "font-medium underline decoration-stone-300 hover:decoration-ink",
}: {
  orderId: string;
  onOpen?: (orderId: string) => void;
  href?: string;
  openInNewWindow?: boolean;
  className?: string;
}) {
  if (href) {
    return (
      <Link
        href={href}
        target={openInNewWindow ? "_blank" : undefined}
        rel={openInNewWindow ? "noopener noreferrer" : undefined}
        className={className}
      >
        {orderId}
      </Link>
    );
  }
  if (!onOpen) return <span className={className}>{orderId}</span>;
  return (
    <button type="button" className={className} onClick={() => onOpen(orderId)}>
      {orderId}
    </button>
  );
}

export function OrderPaymentFacts({ order }: { order: Order }) {
  if (!order.discount) return null;
  return (
    <div>
      <dt className="text-xs text-stone-400">Promo savings</dt>
      <dd>
        {formatInr(order.discount)}
        {order.couponCode ? ` · ${order.couponCode}` : ""}
      </dd>
    </div>
  );
}

export function OrderLineItems({ order }: { order: Order }) {
  const { catalogById, listingById } = useApp();

  return (
    <ul className="mt-3 space-y-3">
      {order.items.map((item) => {
        const product = catalogById(item.catalogProductId);
        const listing = listingById(item.listingId);
        const photos = uniqueMediaUrls(product?.galleryUrls ?? [], product?.imageUrl);
        return (
          <li key={item.listingId} className="flex gap-3">
            <ProductArt
              hue={product?.imageHue ?? 40}
              label={product?.imageLabel ?? "Item"}
              imageUrl={product?.imageUrl}
              className="h-16 w-16 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {product?.name ?? "Item"} × {item.quantity}
              </p>
              <p className="text-xs text-stone-500">
                Warranty: {itemWarranty(item.warranty, listing?.warranty)}
                {listing?.color ? ` · ${listing.color}` : ""}
              </p>
              {photos.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {photos.slice(0, 4).map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={src.slice(0, 48)}
                      src={src}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
            <span className="shrink-0 text-sm">{formatInr(item.unitPrice * item.quantity)}</span>
          </li>
        );
      })}
    </ul>
  );
}
