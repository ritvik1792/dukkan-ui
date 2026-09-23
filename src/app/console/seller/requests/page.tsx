"use client";

import { useAlert } from "@/components/ui/AlertMessage";
import { Field, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import {
  fetchMerchantRequest,
  fetchMerchantRequests,
  mapProductRequest,
  respondMerchantRequest,
} from "@/lib/api";
import { formatInr } from "@/lib/format";
import { sellerConsolePath } from "@/lib/routes";
import type { ProductRequest } from "@/lib/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type InboxRow = {
  request: ProductRequest;
  shopId: string;
  listingId?: string;
  status: string;
  distanceKm?: number;
};

type ReplyStep = "decide" | "price";

function expiryLabel(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (!Number.isFinite(ms)) return expiresAt;
  if (ms <= 0) return "Expired";
  const mins = Math.ceil(ms / 60_000);
  if (mins < 60) return `${mins} min left`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hrs}h ${rem}m left` : `${hrs}h left`;
}

export default function SellerAvailabilityInbox() {
  const { catalogById, shopById } = useApp();
  const { showAlert } = useAlert();
  const [rows, setRows] = useState<InboxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [step, setStep] = useState<ReplyStep>("decide");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [busy, setBusy] = useState(false);
  const [, setTick] = useState(0);

  const refresh = useCallback(async () => {
    const payload = await fetchMerchantRequests();
    setRows(
      payload.map((row) => ({
        request: mapProductRequest(row.request),
        shopId: row.shopId,
        listingId: row.requestShop.listingId ?? undefined,
        status: row.requestShop.status,
        distanceKm:
          row.requestShop.distanceKm == null ? undefined : Number(row.requestShop.distanceKm),
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    refresh().catch(() => {
      if (!cancelled) setLoading(false);
    });
    const timer = window.setInterval(() => {
      void refresh().catch(() => undefined);
    }, 5000);
    const countdown = window.setInterval(() => setTick((n) => n + 1), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearInterval(countdown);
    };
  }, [refresh]);

  async function open(id: string) {
    setActiveId(id);
    setStep("decide");
    setPrice("");
    setQty("1");
    try {
      await fetchMerchantRequest(id);
    } catch {
      /* still allow respond from list row */
    }
  }

  async function decline() {
    if (!activeId) return;
    setBusy(true);
    try {
      await respondMerchantRequest(activeId, { decision: "REJECTED" });
      showAlert({
        tone: "success",
        title: "Declined",
        message: "Request marked as declined.",
      });
      setActiveId(null);
      setStep("decide");
      await refresh();
    } catch (err) {
      showAlert({
        tone: "warning",
        title: "Response failed",
        message: err instanceof Error ? err.message : "Try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function sendOffer() {
    if (!activeId) return;
    const row = rows.find((r) => r.request.id === activeId);
    if (!row) return;
    const unitPrice = Number(price);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      showAlert({ tone: "warning", title: "Enter a price", message: "Offer price is required." });
      return;
    }
    setBusy(true);
    try {
      await respondMerchantRequest(activeId, {
        decision: "ACCEPTED",
        unitPrice,
        availableQty: Math.max(1, Number(qty) || 1),
        listingId: row.listingId,
      });
      showAlert({
        tone: "success",
        title: "Offer sent",
        message: "Customer can select your temporary offer.",
      });
      setActiveId(null);
      setStep("decide");
      await refresh();
    } catch (err) {
      showAlert({
        tone: "warning",
        title: "Response failed",
        message: err instanceof Error ? err.message : "Try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  const openRows = rows.filter((r) => r.status === "NOTIFIED" || r.status === "VIEWED");
  const history = rows.filter((r) => r.status === "ACCEPTED" || r.status === "DECLINED");

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Availability requests</h1>
      <p className="mt-1 text-sm text-stone-500">
        New customer requests appear here. Answer yes or no; if yes, set your price and send an offer.
        Listing stock is not changed.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-stone-500">Loading inbox…</p>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Needs reply</h2>
            <ul className="mt-3 space-y-3">
              {openRows.map((row) => {
                const product = catalogById(row.request.catalogProductId);
                const shop = shopById(row.shopId);
                const selected = activeId === row.request.id;
                const productName = product?.name ?? row.request.catalogProductId;
                return (
                  <li key={row.request.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                    <button type="button" className="w-full text-left" onClick={() => void open(row.request.id)}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                        New customer request
                      </p>
                      <p className="mt-1 font-semibold">{productName}</p>
                      {row.request.queryText && row.request.queryText !== productName && (
                        <p className="mt-0.5 text-sm text-stone-600">Query: {row.request.queryText}</p>
                      )}
                      <p className="mt-2 text-xs text-stone-500">
                        {shop?.name ?? row.shopId}
                        {row.distanceKm != null ? ` · ${row.distanceKm.toFixed(1)} km` : ""}
                        {row.request.maxBudget != null
                          ? ` · Budget under ${formatInr(row.request.maxBudget)}`
                          : ""}
                        {" · "}
                        {expiryLabel(row.request.expiresAt)}
                        {" · "}
                        {row.status}
                      </p>
                    </button>
                    {selected && (
                      <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
                        <p className="text-sm font-medium">Do you have this?</p>
                        {step === "decide" ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setStep("price")}
                              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-lime disabled:opacity-50"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void decline()}
                              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm text-stone-600">What price can you offer?</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <Field label="Your price (₹)">
                                <TextInput
                                  type="number"
                                  min={1}
                                  value={price}
                                  onChange={(e) => setPrice(e.target.value)}
                                  placeholder="e.g. 249"
                                />
                              </Field>
                              <Field label="Qty available">
                                <TextInput
                                  type="number"
                                  min={1}
                                  value={qty}
                                  onChange={(e) => setQty(e.target.value)}
                                />
                              </Field>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void sendOffer()}
                                className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-lime disabled:opacity-50"
                              >
                                Send offer
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => setStep("decide")}
                                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                              >
                                Back
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
              {openRows.length === 0 && (
                <li className="rounded-2xl border border-dashed border-stone-200 p-6 text-sm text-stone-500">
                  No open availability requests.
                </li>
              )}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Recent replies</h2>
            <ul className="mt-3 space-y-2">
              {history.slice(0, 12).map((row) => {
                const product = catalogById(row.request.catalogProductId);
                return (
                  <li key={`${row.request.id}-${row.status}`} className="text-sm text-stone-600">
                    <span className="font-medium text-ink">{product?.name ?? row.request.catalogProductId}</span>
                    {" · "}
                    {row.status}
                  </li>
                );
              })}
              {history.length === 0 && <li className="text-sm text-stone-500">No replies yet.</li>}
            </ul>
          </section>
        </>
      )}

      <p className="mt-8 text-xs text-stone-400">
        Manage alert toggles in{" "}
        <Link href={sellerConsolePath("/settings")} className="underline">
          settings
        </Link>
        .
      </p>
    </div>
  );
}
