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

export default function SellerAvailabilityInbox() {
  const { catalogById, shopById } = useApp();
  const { showAlert } = useAlert();
  const [rows, setRows] = useState<InboxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [busy, setBusy] = useState(false);

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
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [refresh]);

  async function open(id: string) {
    setActiveId(id);
    setPrice("");
    setQty("1");
    try {
      await fetchMerchantRequest(id);
    } catch {
      /* still allow respond from list row */
    }
  }

  async function respond(decision: "ACCEPTED" | "REJECTED") {
    if (!activeId) return;
    const row = rows.find((r) => r.request.id === activeId);
    if (!row) return;
    if (decision === "ACCEPTED") {
      const unitPrice = Number(price);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        showAlert({ tone: "warning", title: "Enter a price", message: "Offer price is required." });
        return;
      }
    }
    setBusy(true);
    try {
      await respondMerchantRequest(activeId, {
        decision,
        unitPrice: decision === "ACCEPTED" ? Number(price) : undefined,
        availableQty: decision === "ACCEPTED" ? Math.max(1, Number(qty) || 1) : undefined,
        listingId: row.listingId,
      });
      showAlert({
        tone: "success",
        title: decision === "ACCEPTED" ? "Offer sent" : "Declined",
        message:
          decision === "ACCEPTED"
            ? "Customer can select your temporary offer."
            : "Request marked as declined.",
      });
      setActiveId(null);
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
        Reply yes with a temporary price, or no. Stock on your listing is not changed.
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
                return (
                  <li key={row.request.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                    <button type="button" className="w-full text-left" onClick={() => void open(row.request.id)}>
                      <p className="font-semibold">{product?.name ?? row.request.catalogProductId}</p>
                      <p className="text-xs text-stone-500">
                        {shop?.name ?? row.shopId}
                        {row.distanceKm != null ? ` · ${row.distanceKm.toFixed(1)} km` : ""}
                        {" · "}
                        {row.status}
                      </p>
                    </button>
                    {selected && (
                      <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
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
                            onClick={() => void respond("ACCEPTED")}
                            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-lime disabled:opacity-50"
                          >
                            Yes — send offer
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void respond("REJECTED")}
                            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                          >
                            No
                          </button>
                        </div>
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
