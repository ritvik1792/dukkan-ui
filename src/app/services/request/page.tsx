"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { createServiceRequest, fetchPublicServices } from "@/lib/api";
import { ROUTES } from "@/lib/routes";
import type { ProviderService } from "@/lib/types";
import { useMotionRouter } from "@/lib/motion";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

function RequestForm() {
  const params = useSearchParams();
  const serviceId = params.get("serviceId") ?? "";
  const { showAlert } = useAlert();
  const router = useMotionRouter();
  const { shopById, user, locationLabel, origin } = useApp();
  const [service, setService] = useState<ProviderService | null>(null);
  const [address, setAddress] = useState(locationLabel);
  const [description, setDescription] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!serviceId) return;
    fetchPublicServices()
      .then((rows) => setService(rows.find((s) => s.id === serviceId) ?? null))
      .catch(() => setService(null));
  }, [serviceId]);

  const provider = service ? shopById(service.providerId) : undefined;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!service || !address.trim()) return;
    setSubmitting(true);
    try {
      await createServiceRequest({
        serviceId: service.id,
        customerAddress: address.trim(),
        customerLat: origin.lat,
        customerLng: origin.lng,
        description: description || undefined,
        preferredTime: preferredTime ? new Date(preferredTime).toISOString() : undefined,
        contactPhone: phone || undefined,
      });
      showAlert({ tone: "success", title: "Request sent" });
      router.push(ROUTES.accountServiceRequests);
    } catch (err) {
      showAlert({
        tone: "error",
        title: err instanceof Error ? err.message : "Could not send request",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!serviceId) {
    return <p className="p-8 text-sm text-stone-500">Pick a service from search or a provider profile.</p>;
  }

  if (!service) {
    return <p className="p-8 text-sm text-stone-500">Loading service…</p>;
  }

  return (
    <div className="page-shell max-w-lg py-10">
      <p className="text-xs uppercase tracking-wider text-stone-400">Request a service</p>
      <h1 className="text-2xl font-semibold">{service.name}</h1>
      {provider && <p className="text-sm text-stone-500">{provider.name}</p>}
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl bg-white p-6">
        <Field label="Address">
          <TextInput value={address} onChange={(e) => setAddress(e.target.value)} required />
        </Field>
        <Field label="Describe what you need">
          <TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </Field>
        <Field label="Preferred time (optional)">
          <TextInput
            type="datetime-local"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
          />
        </Field>
        <Field label="Contact phone">
          <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-carrot py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send request"}
        </button>
      </form>
    </div>
  );
}

export default function ServiceRequestPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<p className="p-8 text-sm text-stone-500">Loading…</p>}>
        <RequestForm />
      </Suspense>
    </RequireAuth>
  );
}
