"use client";

import { useApp } from "@/context/AppContext";
import { formatDistance } from "@/lib/geo";
import { formatInr } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import type {
  PersonSearchHit,
  ProductSearchHit,
  ServiceSearchHit,
} from "@/lib/types";
import Link from "next/link";
import { ProductArt } from "@/components/ProductArt";
import { BRAND_FALLBACK_HUE } from "@/lib/constants";

export function ProductHitCard({ hit }: { hit: ProductSearchHit }) {
  const { selectProduct } = useApp();
  const hue = hit.imageHue ?? BRAND_FALLBACK_HUE;
  return (
    <Link
      href={`/product/${hit.id}`}
      onClick={() => selectProduct(hit.id)}
      className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-border/80 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-square">
        {hit.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hit.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <ProductArt label={hit.imageLabel ?? hit.name.slice(0, 2)} hue={hue} />
        )}
      </div>
      <div className="space-y-0.5 p-3">
        <p className="text-[11px] uppercase tracking-wide text-stone-400">{hit.brand}</p>
        <p className="line-clamp-2 text-sm font-semibold text-ink">{hit.name}</p>
      </div>
    </Link>
  );
}

export function ServiceHitCard({ hit }: { hit: ServiceSearchHit }) {
  const { selectShop } = useApp();
  const price = hit.startingPrice ?? hit.price;
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-border/80">
      <div className="relative h-36 bg-gradient-to-br from-champagne via-rose-gold/30 to-muted-rose/40">
        {hit.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hit.imageUrl} alt="" className="h-full w-full object-cover opacity-90" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-ink/25">✦</div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 p-3 pt-8">
          <p className="font-semibold text-white">{hit.name}</p>
          <p className="text-xs text-white/75">{hit.providerName}</p>
        </div>
      </div>
      <div className="space-y-2 p-3 text-sm text-muted">
        {price != null && <p className="font-semibold text-ink">From {formatInr(price)}</p>}
        {hit.durationMinutes != null && (
          <p className="text-xs text-muted">{hit.durationMinutes} min</p>
        )}
        {hit.distanceKm != null && (
          <p className="text-xs text-muted">{formatDistance(hit.distanceKm)} away</p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href={ROUTES.shopDashboard}
            onClick={() => selectShop(hit.providerId)}
            className="rounded-full border px-3 py-1 text-xs font-medium"
          >
            Provider
          </Link>
          {hit.bookingEnabled && (
            <Link
              href={`/services/book?serviceId=${encodeURIComponent(hit.id)}`}
              className="rounded-full bg-carrot px-3 py-1 text-xs font-semibold text-white"
            >
              Book
            </Link>
          )}
          {hit.requestEnabled && (
            <Link
              href={`/services/request?serviceId=${encodeURIComponent(hit.id)}`}
              className="rounded-full bg-carrot px-3 py-1 text-xs font-semibold text-white"
            >
              Request
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function PersonHitCard({ hit }: { hit: PersonSearchHit }) {
  const { selectShop } = useApp();
  const price = hit.startingPrice;
  return (
    <Link
      href={ROUTES.shopDashboard}
      onClick={() => selectShop(hit.id)}
      className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-border/80 transition hover:bg-champagne/80"
    >
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-champagne to-rose-gold/70 text-2xl text-ink">
        {hit.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hit.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          "👤"
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{hit.name}</p>
        {hit.profession && <p className="text-sm text-muted">{hit.profession}</p>}
        {hit.serviceNames.length > 0 && (
          <p className="mt-1 line-clamp-1 text-xs text-muted">{hit.serviceNames.join(" · ")}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
          {hit.rating != null && hit.rating > 0 && <span>{hit.rating.toFixed(1)} ★</span>}
          {price != null && <span>From {formatInr(price)}</span>}
          {hit.distanceKm != null && <span>{formatDistance(hit.distanceKm)}</span>}
        </div>
      </div>
    </Link>
  );
}

export function ServiceListingCard({
  service,
  providerName,
}: {
  service: ServiceSearchHit | { id: string; name: string; startingPrice?: number; price?: number; bookingEnabled: boolean; requestEnabled: boolean; durationMinutes?: number };
  providerName?: string;
}) {
  const price = "startingPrice" in service ? (service.startingPrice ?? service.price) : undefined;
  return (
    <div className="min-w-[14rem] flex-[1_0_15rem] snap-start rounded-2xl bg-white p-4 ring-1 ring-border/80">
      <p className="font-semibold text-ink">{service.name}</p>
      {providerName && <p className="text-xs text-stone-500">{providerName}</p>}
      {price != null && <p className="mt-2 text-sm font-medium">From {formatInr(price)}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {service.bookingEnabled && (
          <Link
            href={`/services/book?serviceId=${encodeURIComponent(service.id)}`}
            className="rounded-full bg-carrot px-3 py-1 text-xs font-semibold text-white"
          >
            Book
          </Link>
        )}
        {service.requestEnabled && (
          <Link
            href={`/services/request?serviceId=${encodeURIComponent(service.id)}`}
            className="rounded-full border px-3 py-1 text-xs font-medium"
          >
            Request
          </Link>
        )}
      </div>
    </div>
  );
}
