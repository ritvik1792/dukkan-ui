"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { createBookingRequest, fetchServiceById } from "@/lib/api";
import { formatInr } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import type { ProviderService } from "@/lib/types";
import { useMotionRouter } from "@/lib/motion";
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface DateOption {
  key: string;
  dayLabel: string;
  dateLabel: string;
  discount: string;
  dateObj: Date;
}

interface SlotOption {
  timeLabel: string;
  period: "morning" | "afternoon" | "evening";
  discount: string;
  isoString: string;
}

function buildFallbackService(serviceId: string, shop?: Shop): ProviderService {
  const nowIso = new Date().toISOString();
  return {
    id: serviceId || "service-demo",
    providerId: shop?.id ?? "shop-gupta",
    name: shop ? `${shop.name} Table & Dining Reservation` : "Premium Table & Dining Experience",
    description: "Exclusive table booking with instant confirmation and welcome perks.",
    price: 250,
    durationMinutes: 60,
    bookingEnabled: true,
    requestEnabled: true,
    status: "ACTIVE",
    imageUrls: [],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

function BookForm() {
  const params = useSearchParams();
  const serviceId = params.get("serviceId") ?? "";
  const { showAlert } = useAlert();
  const router = useMotionRouter();
  const { shopById, state } = useApp();

  const targetShop = shopById(serviceId) ?? state.shops.find((s) => s.id === serviceId) ?? state.shops[0];
  const [service, setService] = useState<ProviderService>(() => buildFallbackService(serviceId, targetShop));
  const [guests, setGuests] = useState<number>(2);
  const [selectedDayKey, setSelectedDayKey] = useState<string>("");
  const [start, setStart] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showManualPicker, setShowManualPicker] = useState(false);

  useEffect(() => {
    const nextFallback = buildFallbackService(serviceId, targetShop);
    setService(nextFallback);

    if (serviceId) {
      fetchServiceById(serviceId)
        .then((s) => {
          if (s) setService(s);
        })
        .catch(() => {
          // Keep initial fallback service
        });
    }
  }, [serviceId, targetShop]);

  const provider = service ? shopById(service.providerId) : undefined;

  // Generate 8 consecutive upcoming days (Today, Tomorrow, Fri, Sat...)
  const dateOptions = useMemo<DateOption[]>(() => {
    const list: DateOption[] = [];
    const today = new Date();
    const discounts = ["25% off", "45% off", "45% off", "45% off", "45% off", "45% off", "45% off", "45% off"];

    for (let i = 0; i < 8; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayLabel = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString(undefined, { weekday: "short" });
      const dateLabel = d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      list.push({
        key,
        dayLabel,
        dateLabel,
        discount: discounts[i % discounts.length] ?? "25% off",
        dateObj: d,
      });
    }
    return list;
  }, []);

  // Set default day key once available
  useEffect(() => {
    if (dateOptions[0] && !selectedDayKey) {
      setSelectedDayKey(dateOptions[0].key);
    }
  }, [dateOptions, selectedDayKey]);

  // Compute time slots for selected day
  const slots = useMemo<SlotOption[]>(() => {
    if (!selectedDayKey) return [];
    const open = provider?.openTime ?? "09:00";
    const close = provider?.closeTime ?? "22:00";
    const duration = service?.durationMinutes ?? 45;

    const [oh, om] = open.split(":").map(Number);
    const [ch, cm] = close.split(":").map(Number);

    const targetDate = dateOptions.find((d) => d.key === selectedDayKey)?.dateObj ?? new Date();
    const startMin = (oh || 9) * 60 + (om || 0);
    const endMin = (ch || 22) * 60 + (cm || 0);

    const list: SlotOption[] = [];
    for (let m = startMin; m + duration <= endMin; m += duration) {
      const hours = Math.floor(m / 60);
      const minutes = m % 60;

      const slotDate = new Date(targetDate);
      slotDate.setHours(hours, minutes, 0, 0);

      // Period grouping
      let period: SlotOption["period"] = "afternoon";
      if (hours < 12) period = "morning";
      else if (hours >= 17) period = "evening";

      const timeLabel = slotDate.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });

      const localIso = new Date(slotDate.getTime() - slotDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      list.push({
        timeLabel,
        period,
        discount: hours >= 18 ? "30% off" : "25% off",
        isoString: localIso,
      });
    }
    return list;
  }, [selectedDayKey, provider?.openTime, provider?.closeTime, service?.durationMinutes, dateOptions]);

  // Set default slot if none picked
  useEffect(() => {
    if (slots.length > 0 && !start) {
      setStart(slots[0]?.isoString ?? "");
    }
  }, [slots, start]);

  const selectedSlot = useMemo(() => {
    return slots.find((s) => s.isoString === start);
  }, [slots, start]);

  const selectedDay = useMemo(() => {
    return dateOptions.find((d) => d.key === selectedDayKey);
  }, [dateOptions, selectedDayKey]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!service || !start) return;

    if (!state.sessionUserId) {
      showAlert({
        tone: "info",
        title: "Please sign in to complete reservation",
      });
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    setSubmitting(true);
    try {
      const startDate = new Date(start);
      const endDate =
        service.durationMinutes != null
          ? new Date(startDate.getTime() + service.durationMinutes * 60_000)
          : undefined;

      const fullNotes = `[Guests: ${guests}] ${notes}`.trim();

      await createBookingRequest({
        serviceId: service.id,
        scheduledStart: startDate.toISOString(),
        scheduledEnd: endDate?.toISOString(),
        notes: fullNotes || undefined,
      });

      showAlert({ tone: "success", title: "Booking requested successfully!" });
      router.push(ROUTES.accountBookings);
    } catch (err) {
      showAlert({
        tone: "error",
        title: err instanceof Error ? err.message : "Could not complete booking",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!service) {
    return (
      <div className="page-shell max-w-lg py-12 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
        <p className="mt-3 text-sm text-muted">Loading booking options…</p>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-2xl py-6 sm:py-8">
      {/* ── Header Bar with Back Nav ── */}
      <div className="flex items-center gap-3 pb-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-ink shadow-sm transition hover:bg-blush"
          aria-label="Go back"
        >
          ←
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Book Table &amp; Service
          </h1>
          <p className="text-xs text-muted sm:text-sm">
            {service.name} {provider ? `• ${provider.name}, ${provider.address}` : ""}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* ── Card 1: Number of guest(s) ── */}
        <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-bold text-ink sm:text-base">
            Number of guest(s)
          </h2>
          <div className="no-scrollbar mt-3.5 flex gap-2 overflow-x-auto pb-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
              const active = guests === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setGuests(num)}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition sm:h-12 sm:w-12 ${
                    active
                      ? "border-2 border-rose-600 bg-rose-50 text-rose-600 shadow-sm"
                      : "border border-border bg-white text-ink hover:bg-zinc-50"
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Card 2: When are you visiting? (Date Picker) ── */}
        <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink sm:text-base">
              When are you visiting?
            </h2>
            <button
              type="button"
              onClick={() => setShowManualPicker((prev) => !prev)}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              {showManualPicker ? "Use quick slots" : "Specific custom time"}
            </button>
          </div>

          {!showManualPicker ? (
            <div className="no-scrollbar mt-3.5 flex gap-2.5 overflow-x-auto pb-1">
              {dateOptions.map((opt) => {
                const active = selectedDayKey === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setSelectedDayKey(opt.key);
                      // Clear start so first slot of new day auto-picks
                      setStart("");
                    }}
                    className={`flex min-w-[5.25rem] shrink-0 flex-col items-center justify-between rounded-2xl p-2.5 text-center transition sm:min-w-[5.75rem] sm:p-3 ${
                      active
                        ? "border-2 border-rose-600 bg-rose-50/70 shadow-sm"
                        : "border border-border bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <span className="text-xs font-bold text-ink">{opt.dayLabel}</span>
                    <span className="mt-0.5 text-xs font-semibold text-ink/80">{opt.dateLabel}</span>
                    <span className="mt-2 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      {opt.discount}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-3.5">
              <Field label="Custom Date & Time">
                <TextInput
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  required
                />
              </Field>
            </div>
          )}
        </section>

        {/* ── Card 3: Select Time Slots ── */}
        {!showManualPicker && slots.length > 0 && (
          <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-sm font-bold text-ink sm:text-base">
              Select the time of day to see the offers
            </h2>

            {/* Slots grid */}
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 text-xs font-bold uppercase tracking-wider text-muted">
                <span>🍽️ Available Slots</span>
                <span className="text-[11px] font-normal text-stone-400">
                  ({service.durationMinutes ? `${service.durationMinutes} min session` : "Table / slot"})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {slots.map((slot) => {
                  const active = start === slot.isoString;
                  return (
                    <button
                      key={slot.isoString}
                      type="button"
                      onClick={() => setStart(slot.isoString)}
                      className={`flex flex-col items-center justify-center rounded-2xl p-3 text-center transition duration-150 ${
                        active
                          ? "border-2 border-rose-600 bg-rose-50 text-rose-600 shadow-sm ring-2 ring-rose-500/10"
                          : "border border-border bg-white hover:bg-zinc-50 text-ink"
                      }`}
                    >
                      <span className="text-sm font-bold">{slot.timeLabel}</span>
                      <span className="mt-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {slot.discount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── Card 4: Booking Option & Special Perks ── */}
        <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink sm:text-base">
              Booking options {selectedSlot ? `for ${selectedSlot.timeLabel}` : ""}
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-600">
              ⚡ Instant Confirmation
            </span>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎁</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-600">
                  Dukkan Exclusive
                </p>
                <p className="text-sm font-bold text-ink">
                  Flat 25% Off on Total Bill + Priority Seating
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  No pre-payment needed. Special offer applied automatically upon arrival.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Field label="Special Requests or Dietary Notes (optional)">
              <TextArea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="E.g., Window seat preferred, celebrating birthday, quiet corner…"
              />
            </Field>
          </div>
        </section>

        {/* ── Fixed / Bottom CTA ── */}
        <div className="sticky bottom-4 z-20 rounded-2xl border border-border bg-white/95 p-4 shadow-xl backdrop-blur-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-muted">
                {guests} {guests === 1 ? "Guest" : "Guests"} ·{" "}
                <span className="font-semibold text-ink">
                  {selectedDay ? `${selectedDay.dayLabel}, ${selectedDay.dateLabel}` : "Selected Date"}
                </span>
                {selectedSlot ? ` at ${selectedSlot.timeLabel}` : ""}
              </p>
              <p className="text-sm font-black text-rose-600">
                {service.price ? `From ${formatInr(service.price)}` : "Free Booking Reservation"}
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || !start}
              className="btn-primary btn-lg w-full sm:w-auto"
            >
              {submitting ? "Confirming booking…" : "Book table / service"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function ServiceBookPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell py-12 text-center text-muted">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
          <p className="mt-3 text-sm">Loading booking flow…</p>
        </div>
      }
    >
      <BookForm />
    </Suspense>
  );
}
