"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { createBookingRequest, fetchServiceById } from "@/lib/api";
import { ROUTES } from "@/lib/routes";
import type { ProviderService } from "@/lib/types";
import { useMotionRouter } from "@/lib/motion";
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

function BookForm() {
  const params = useSearchParams();
  const serviceId = params.get("serviceId") ?? "";
  const { showAlert } = useAlert();
  const router = useMotionRouter();
  const { shopById } = useApp();
  const [service, setService] = useState<ProviderService | null>(null);
  const [start, setStart] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!serviceId) return;
    fetchServiceById(serviceId)
      .then(setService)
      .catch(() => setService(null));
  }, [serviceId]);

  const provider = service ? shopById(service.providerId) : undefined;

  const slots = useMemo(() => {
    const open = provider?.openTime ?? "09:00";
    const close = provider?.closeTime ?? "21:00";
    const duration = service?.durationMinutes ?? 60;
    const [oh, om] = open.split(":").map(Number);
    const [ch, cm] = close.split(":").map(Number);
    const day = new Date();
    day.setDate(day.getDate() + 1);
    day.setSeconds(0, 0);
    const startMin = oh * 60 + (om || 0);
    const endMin = ch * 60 + (cm || 0);
    const options: { label: string; value: string }[] = [];
    for (let m = startMin; m + duration <= endMin; m += duration) {
      const d = new Date(day);
      d.setHours(Math.floor(m / 60), m % 60, 0, 0);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      options.push({
        label: d.toLocaleString(undefined, {
          weekday: "short",
          hour: "numeric",
          minute: "2-digit",
        }),
        value: local,
      });
    }
    return options.slice(0, 12);
  }, [provider?.openTime, provider?.closeTime, service?.durationMinutes]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!service || !start) return;
    setSubmitting(true);
    try {
      const startDate = new Date(start);
      const endDate =
        service.durationMinutes != null
          ? new Date(startDate.getTime() + service.durationMinutes * 60_000)
          : undefined;
      await createBookingRequest({
        serviceId: service.id,
        scheduledStart: startDate.toISOString(),
        scheduledEnd: endDate?.toISOString(),
        notes: notes || undefined,
      });
      showAlert({ tone: "success", title: "Booking requested" });
      router.push(ROUTES.accountBookings);
    } catch (err) {
      showAlert({
        tone: "error",
        title: err instanceof Error ? err.message : "Could not book",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!serviceId) {
    return (
      <p className="p-8 text-sm text-stone-500">
        Pick a service to book from search or a provider page.
      </p>
    );
  }

  if (!service) {
    return <p className="p-8 text-sm text-stone-500">Loading service…</p>;
  }

  return (
    <div className="page-shell max-w-lg py-10">
      <p className="text-xs uppercase tracking-wider text-stone-400">Book a service</p>
      <h1 className="text-2xl font-semibold">{service.name}</h1>
      {provider && <p className="text-sm text-stone-500">{provider.name}</p>}
      <p className="mt-1 text-sm text-stone-500">
        Requests stay pending until the provider confirms.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl bg-white p-6">
        {slots.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Suggested slots
            </p>
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => setStart(slot.value)}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    start === slot.value ? "bg-ink text-lime" : "border hover:bg-stone-50"
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <Field label="Date & time">
          <TextInput
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
          />
        </Field>
        <Field label="Notes (optional)">
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </Field>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-ink py-3 text-sm font-semibold text-lime disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Request booking"}
        </button>
      </form>
    </div>
  );
}

export default function ServiceBookPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<p className="p-8 text-sm text-stone-500">Loading…</p>}>
        <BookForm />
      </Suspense>
    </RequireAuth>
  );
}
