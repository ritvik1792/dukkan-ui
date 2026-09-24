"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { fetchMyServiceRequests } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { ServiceRequest } from "@/lib/types";
import { useEffect, useState } from "react";

export default function AccountServiceRequestsPage() {
  return (
    <RequireAuth>
      <RequestsList />
    </RequireAuth>
  );
}

function RequestsList() {
  const { shopById } = useApp();
  const [rows, setRows] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyServiceRequests()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold">Service requests</h2>
      <p className="mt-1 text-sm text-stone-500">On-demand help you asked providers for.</p>
      {loading && <p className="mt-6 text-sm text-stone-500">Loading…</p>}
      <div className="mt-6 space-y-3">
        {rows.map((row) => {
          const provider = shopById(row.providerId);
          return (
            <div key={row.id} className="rounded-2xl bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{provider?.name ?? row.providerId}</p>
                  <p className="text-sm text-stone-500">{row.customerAddress}</p>
                  {row.description && (
                    <p className="mt-2 text-sm text-stone-600">{row.description}</p>
                  )}
                  {row.preferredTime && (
                    <p className="mt-1 text-xs text-stone-500">
                      Preferred {formatDate(row.preferredTime)}
                    </p>
                  )}
                </div>
                <StatusPill>{row.status}</StatusPill>
              </div>
            </div>
          );
        })}
        {!loading && rows.length === 0 && (
          <p className="rounded-2xl bg-cream p-6 text-sm text-stone-500">No requests yet.</p>
        )}
      </div>
    </div>
  );
}
