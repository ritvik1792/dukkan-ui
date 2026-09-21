"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import {
  cancelProductRequest,
  fetchProductRequest,
  fetchProductRequestOffers,
  mapOffer,
  mapProductRequest,
  selectOfferRequest,
} from "@/lib/api";
import { formatInr } from "@/lib/format";
import { useMotionRouter } from "@/lib/motion";
import { stashOfferCheckout } from "@/lib/offerCheckout";
import type { AvailabilityOffer, ProductRequest } from "@/lib/types";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function RequestStatusPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { shopById, catalogById, dispatch } = useApp();
  const { showAlert } = useAlert();
  const router = useMotionRouter();
  const [request, setRequest] = useState<ProductRequest | null>(null);
  const [offers, setOffers] = useState<AvailabilityOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyOfferId, setBusyOfferId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    const [detail, offerRows] = await Promise.all([
      fetchProductRequest(id),
      fetchProductRequestOffers(id),
    ]);
    setRequest(mapProductRequest(detail.request));
    setOffers(offerRows.map(mapOffer));
    setLoading(false);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    refresh().catch(() => {
      if (!cancelled) setLoading(false);
    });
    const timer = window.setInterval(() => {
      void refresh().catch(() => undefined);
    }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [refresh]);

  async function select(offer: AvailabilityOffer) {
    if (!offer.listingId) {
      showAlert({ tone: "warning", title: "Offer incomplete", message: "Missing listing on offer." });
      return;
    }
    setBusyOfferId(offer.id);
    try {
      const selected = mapOffer(await selectOfferRequest(offer.id));
      stashOfferCheckout({
        requestId: selected.requestId,
        offerId: selected.id,
        listingId: selected.listingId!,
        unitPrice: selected.unitPrice,
        shopId: selected.shopId,
        quantity: 1,
      });
      dispatch({ type: "clearCart" });
      dispatch({
        type: "addToCart",
        item: { listingId: selected.listingId!, quantity: 1, deliveryMode: "partner" },
      });
      router.push(
        `/checkout?requestId=${encodeURIComponent(selected.requestId)}&offerId=${encodeURIComponent(selected.id)}`,
      );
    } catch (err) {
      showAlert({
        tone: "warning",
        title: "Could not select offer",
        message: err instanceof Error ? err.message : "Try again.",
      });
    } finally {
      setBusyOfferId(null);
    }
  }

  async function cancel() {
    if (!id) return;
    try {
      const payload = await cancelProductRequest(id);
      setRequest(mapProductRequest(payload.request));
      showAlert({ tone: "info", title: "Request cancelled", message: "Sellers will stop receiving updates." });
    } catch (err) {
      showAlert({
        tone: "warning",
        title: "Cancel failed",
        message: err instanceof Error ? err.message : "Try again.",
      });
    }
  }

  if (loading || !request) {
    return <p className="p-8 text-sm text-stone-500">Loading request…</p>;
  }

  const product = catalogById(request.catalogProductId);
  const activeOffers = offers.filter((o) => o.status === "ACTIVE" || o.status === "SELECTED");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-xs uppercase tracking-wider text-stone-500">Availability request</p>
      <h1 className="mt-1 text-2xl font-semibold">{product?.name ?? "Product"}</h1>
      <p className="mt-2 text-sm text-stone-500">
        Status <span className="font-medium text-ink">{request.status}</span>
        {" · "}
        Wave {request.waveIndex + 1}
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Offers</h2>
        <p className="text-sm text-stone-500">Polling nearby sellers. Select one to checkout.</p>
        <ul className="mt-4 space-y-3">
          {activeOffers.map((offer) => {
            const shop = shopById(offer.shopId);
            return (
              <li key={offer.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{shop?.name ?? offer.shopId}</p>
                    <p className="text-xs text-stone-500">
                      Qty {offer.availableQty}
                      {offer.message ? ` · ${offer.message}` : ""}
                    </p>
                  </div>
                  <p className="text-lg font-bold">{formatInr(offer.unitPrice)}</p>
                </div>
                <button
                  type="button"
                  disabled={busyOfferId === offer.id || request.status === "ORDERED"}
                  onClick={() => void select(offer)}
                  className="mt-3 rounded-full bg-[#ffa41c] px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
                >
                  {busyOfferId === offer.id ? "Selecting…" : "Select & checkout"}
                </button>
              </li>
            );
          })}
          {activeOffers.length === 0 && (
            <li className="rounded-2xl border border-dashed border-stone-200 p-6 text-sm text-stone-500">
              No offers yet. Keep this page open — sellers have a short window to reply.
            </li>
          )}
        </ul>
      </section>

      {request.status !== "CANCELLED" &&
        request.status !== "ORDERED" &&
        request.status !== "EXPIRED" && (
          <button type="button" onClick={() => void cancel()} className="mt-8 text-sm text-stone-500 underline">
            Cancel request
          </button>
        )}
    </div>
  );
}

export default function Page() {
  return (
    <RequireAuth>
      <RequestStatusPage />
    </RequireAuth>
  );
}
