"use client";

import { StatusPill } from "@/components/ui/StatCard";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { fetchSellerBookings, patchBookingStatus } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Booking, BookingStatus } from "@/lib/types";
import { useEffect, useState } from "react";

export default function SellerBookingsPage() {
  const { user } = useApp();
  const { showAlert } = useAlert();
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    fetchSellerBookings()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  async function transition(id: string, status: BookingStatus) {
    try {
      await patchBookingStatus(id, status);
      showAlert({ tone: "success", title: `Booking ${status.toLowerCase()}` });
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
      <h1 className="text-2xl font-semibold">Bookings</h1>
      <p className="mt-1 text-sm text-stone-500">Confirm or reject pending appointment requests.</p>
      {loading && <p className="mt-4 text-sm text-stone-500">Loading…</p>}
      <div className="mt-6 space-y-3">
        {rows.map((booking) => (
          <div
            key={booking.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4"
          >
            <div>
              <p className="font-semibold">{formatDate(booking.scheduledStart)}</p>
              <p className="text-sm text-stone-500">Service {booking.serviceId}</p>
              {booking.notes && <p className="mt-1 text-sm">{booking.notes}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill>{booking.status}</StatusPill>
              {booking.status === "PENDING" && (
                <>
                  <button
                    type="button"
                    onClick={() => transition(booking.id, "CONFIRMED")}
                    className="rounded-full bg-ink px-3 py-1 text-xs text-lime"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => transition(booking.id, "REJECTED")}
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
          <p className="rounded-2xl bg-stone-50 p-6 text-sm text-stone-500">No bookings yet.</p>
        )}
      </div>
    </div>
  );
}
