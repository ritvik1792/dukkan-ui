"use client";

import { CatalogProductCard } from "@/components/CatalogProductCard";
import { useApp, useUniqueOffers } from "@/context/AppContext";
import Link from "next/link";
import { useMemo } from "react";

export default function AccountWishlistPage() {
  const { state, catalogById } = useApp();
  const offers = useUniqueOffers();

  const savedOffers = useMemo(() => {
    const byId = new Map(offers.map((offer) => [offer.product.id, offer]));
    return state.wishlist
      .map((id) => byId.get(id))
      .filter((offer): offer is NonNullable<typeof offer> => Boolean(offer));
  }, [offers, state.wishlist]);

  const missing = state.wishlist.filter((id) => !savedOffers.some((o) => o.product.id === id));

  return (
    <section className="rounded-2xl bg-white p-5">
      <h2 className="font-semibold">Wishlist</h2>
      <p className="mt-1 text-sm text-stone-500">
        {state.wishlist.length === 0
          ? "Tap the star on a product to save it here."
          : `${state.wishlist.length} saved item${state.wishlist.length === 1 ? "" : "s"}`}
      </p>
      {state.wishlist.length === 0 ? (
        <Link
          href="/search"
          className="mt-4 inline-block rounded-full bg-ink px-4 py-2 text-sm text-lime"
        >
          Browse products
        </Link>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            {savedOffers.map((offer) => (
              <CatalogProductCard key={offer.product.id} offer={offer} />
            ))}
          </div>
          {missing.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm text-stone-500">
              {missing.map((id) => (
                <li key={id}>{catalogById(id)?.name ?? "Saved product"} is not available nearby.</li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
