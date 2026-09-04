"use client";

import { CatalogProductCard } from "@/components/CatalogProductCard";
import { useApp, useUniqueOffers } from "@/context/AppContext";
import Link from "next/link";
import { useMemo } from "react";

export default function WishlistPage() {
  const { state, catalogById } = useApp();
  const offers = useUniqueOffers();

  const savedOffers = useMemo(() => {
    const byId = new Map(offers.map((offer) => [offer.product.id, offer]));
    return state.wishlist
      .map((id) => byId.get(id))
      .filter((offer): offer is NonNullable<typeof offer> => Boolean(offer));
  }, [offers, state.wishlist]);

  const missing = state.wishlist.filter((id) => !savedOffers.some((o) => o.product.id === id));

  if (!state.hydrated) {
    return <p className="p-8 text-sm text-stone-500">Loading…</p>;
  }

  if (state.wishlist.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Your wishlist is empty</h1>
        <p className="mt-2 text-sm text-stone-500">
          Tap the star on a product to save it here.
        </p>
        <Link
          href="/search"
          className="mt-6 inline-block rounded-full bg-ink px-5 py-2 text-sm text-lime"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Wishlist</h1>
      <p className="mt-1 text-sm text-stone-500">
        {state.wishlist.length} saved item{state.wishlist.length === 1 ? "" : "s"}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        {savedOffers.map((offer) => (
          <CatalogProductCard key={offer.product.id} offer={offer} />
        ))}
      </div>
      {missing.length > 0 && (
        <ul className="mt-6 space-y-2 text-sm text-stone-500">
          {missing.map((id) => (
            <li key={id}>{catalogById(id)?.name ?? "Saved product"} is not available nearby.</li>
          ))}
        </ul>
      )}
    </div>
  );
}
