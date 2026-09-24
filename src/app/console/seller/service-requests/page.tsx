"use client";

import { StatusPill } from "@/components/ui/StatCard";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { fetchSellerServiceRequests, patchServiceRequestStatus } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { ServiceRequest, ServiceRequestStatus } from "@/lib/types";
import { useEffect, useState } from "react";

export default function SellerServiceRequestsPage() {
  const { user } = useApp();
  const { showAlert } = useAlert();
  const [rows, setRows] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    fetchSellerServiceRequests()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  async function transition(id: string, status: ServiceRequestStatus) {
    try {
      await patchServiceRequestStatus(id, status);
      showAlert({ tone: "success", title: `Request ${status.toLowerCase()}` });
      reload();
    } catch (err) {
      showAlert({
        tone: "error",
        title: err instanceof Error ? err.message : "Update failed",
      });
    }
  }

  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Service requests</h1>
      <p className="mt-1 text-sm text-stone-500">Accept or reject on-demand customer requests.</p>
      {loading && <p className="mt-4 text-sm text-stone-500">Loading…</p>}
      <div className="mt-6 space-y-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4"
          >
            <div>
              <p className="font-semibold">{row.customerAddress}</p>
              {row.description && <p className="mt-1 text-sm text-stone-600">{row.description}</p>}
              {row.preferredTime && (
                <p className="mt-1 text-xs text-stone-500">Preferred {formatDate(row.preferredTime)}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill>{row.status}</StatusPill>
              {row.status === "REQUESTED" && (
                <>
                  <button
                    type="button"
                    onClick={() => transition(row.id, "ACCEPTED")}
                    className="rounded-full bg-carrot px-3 py-1 text-xs text-white"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => transition(row.id, "REJECTED")}
                    className="rounded-full border px-3 py-1 text-xs"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {!loading && rows.length === 0 && (
          <p className="rounded-2xl bg-cream p-6 text-sm text-stone-500">No service requests yet.</p>
        )}
      </div>
    </div>
  );
}
