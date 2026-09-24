"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { fetchMyBookings } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Booking } from "@/lib/types";
import { useEffect, useState } from "react";

export default function AccountBookingsPage() {
  return (
    <RequireAuth>
      <BookingsList />
    </RequireAuth>
  );
}

function BookingsList() {
  const { shopById } = useApp();
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyBookings()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold">Your bookings</h2>
      <p className="mt-1 text-sm text-stone-500">Scheduled services you requested on pinkCarrot.</p>
      {loading && <p className="mt-6 text-sm text-stone-500">Loading…</p>}
      <div className="mt-6 space-y-3">
        {rows.map((booking) => {
          const provider = shopById(booking.providerId);
          return (
            <div key={booking.id} className="rounded-2xl bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{provider?.name ?? booking.providerId}</p>
                  <p className="text-sm text-stone-500">Service {booking.serviceId}</p>
                  <p className="mt-2 text-sm">{formatDate(booking.scheduledStart)}</p>
                  {booking.notes && (
                    <p className="mt-1 text-sm text-stone-600">{booking.notes}</p>
                  )}
                </div>
                <StatusPill>{booking.status}</StatusPill>
              </div>
            </div>
          );
        })}
        {!loading && rows.length === 0 && (
          <p className="rounded-2xl bg-stone-50 p-6 text-sm text-stone-500">No bookings yet.</p>
        )}
      </div>
    </div>
  );
}
