"use client";

import { Field, FileButton, Select, TextArea, TextInput } from "@/components/ui/Field";
import { persistImageFile } from "@/lib/images";
import { uniqueMediaUrls } from "@/lib/mediaUrls";
import { Toggle } from "@/components/ui/Toggle";
import { StatusPill } from "@/components/ui/StatCard";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import {
  createSellerService,
  deleteSellerService,
  fetchSellerServices,
  patchSellerService,
} from "@/lib/api";
import { formatInr } from "@/lib/format";
import type { ProviderService, ServiceStatus } from "@/lib/types";
import { FormEvent, useEffect, useState } from "react";

export default function SellerServicesPage() {
  const { user, state } = useApp();
  const { showAlert } = useAlert();
  const [rows, setRows] = useState<ProviderService[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProviderService | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [requestEnabled, setRequestEnabled] = useState(true);
  const [status, setStatus] = useState<ServiceStatus>("ACTIVE");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageName, setImageName] = useState("");

  const serviceCategories = state.categories.filter(
    (c) => c.kind === "SERVICE" || c.kind === "BOTH",
  );

  function reload() {
    setLoading(true);
    fetchSellerServices()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  function resetForm() {
    setEditing(null);
    setName("");
    setDescription("");
    setCategoryId(serviceCategories[0]?.id ?? "");
    setStartingPrice("");
    setDurationMinutes("");
    setServiceArea("");
    setBookingEnabled(true);
    setRequestEnabled(true);
    setStatus("ACTIVE");
    setImageUrl("");
    setImageUrls([]);
    setImageName("");
  }

  function startEdit(service: ProviderService) {
    setEditing(service);
    setName(service.name);
    setDescription(service.description ?? "");
    setCategoryId(service.categoryId ?? serviceCategories[0]?.id ?? "");
    setStartingPrice(service.startingPrice?.toString() ?? "");
    setDurationMinutes(service.durationMinutes?.toString() ?? "");
    setServiceArea(service.serviceArea ?? "");
    setBookingEnabled(service.bookingEnabled);
    setRequestEnabled(service.requestEnabled);
    setStatus(service.status);
    setImageUrl(service.imageUrl ?? "");
    setImageUrls(uniqueMediaUrls(service.imageUrls ?? [], service.imageUrl));
    setImageName("");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      description: description || undefined,
      categoryId: categoryId || undefined,
      startingPrice: startingPrice ? Number(startingPrice) : undefined,
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      serviceArea: serviceArea || undefined,
      bookingEnabled,
      requestEnabled,
      imageUrl: imageUrl || undefined,
      imageUrls: uniqueMediaUrls(imageUrls, imageUrl),
      status,
    };
    try {
      if (editing) {
        await patchSellerService(editing.id, payload);
        showAlert({ tone: "success", title: "Service updated" });
      } else {
        await createSellerService(payload);
        showAlert({ tone: "success", title: "Service created" });
      }
      resetForm();
      reload();
    } catch (err) {
      showAlert({
        tone: "error",
        title: err instanceof Error ? err.message : "Save failed",
      });
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this service?")) return;
    try {
      await deleteSellerService(id);
      showAlert({ tone: "info", title: "Service removed" });
      reload();
    } catch (err) {
      showAlert({
        tone: "error",
        title: err instanceof Error ? err.message : "Delete failed",
      });
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Services</h1>
        <p className="mt-1 text-sm text-stone-500">Manage bookable and on-request offerings.</p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6">
        <h2 className="font-semibold">{editing ? "Edit service" : "Add service"}</h2>
        <div>
          <p className="text-sm font-medium">Service images</p>
          <div className="mt-1">
            <FileButton
              accept="image/*"
              buttonLabel="Choose picture"
              fileName={imageName || (imageUrl ? "Picture added" : "")}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setImageName(file.name);
                void persistImageFile(file).then((url) => {
                  setImageUrl(url);
                  setImageUrls((current) => uniqueMediaUrls(current, url));
                });
              }}
            />
          </div>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="mt-2 h-28 w-full rounded-xl object-cover" />
          )}
        </div>
        <Field label="Service name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Service description">
          <TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </Field>
        <Field label="Service type">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {serviceCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starting price (₹)">
            <TextInput
              type="number"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
            />
          </Field>
          <Field label="Duration (minutes)">
            <TextInput
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Service area">
          <TextInput value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} />
        </Field>
        <div className="space-y-3 rounded-2xl border border-border p-3">
          <p className="text-sm font-medium">Service availability</p>
          <Toggle
            label="Bookings"
            hint="Customers can book a time."
            checked={bookingEnabled}
            onChange={setBookingEnabled}
          />
          <Toggle
            label="Requests"
            hint="Customers can ask if you are available."
            checked={requestEnabled}
            onChange={setRequestEnabled}
          />
        </div>
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as ServiceStatus)}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </Field>
        <div className="flex gap-2">
          <button type="submit" className="rounded-full bg-carrot px-4 py-2 text-sm font-semibold text-white">
            {editing ? "Save" : "Create"}
          </button>
          {editing && (
            <button type="button" onClick={resetForm} className="rounded-full border px-4 py-2 text-sm">
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading && <p className="text-sm text-stone-500">Loading…</p>}
      <div className="space-y-3">
        {rows.map((service) => (
          <div
            key={service.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4"
          >
            <div>
              <p className="font-semibold">{service.name}</p>
              <p className="text-sm text-stone-500">
                {service.startingPrice != null && `From ${formatInr(service.startingPrice)} · `}
                {service.durationMinutes != null && `${service.durationMinutes} min`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill>{service.status}</StatusPill>
              <button
                type="button"
                onClick={() => startEdit(service)}
                className="rounded-full border px-3 py-1 text-xs"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => remove(service.id)}
                className="rounded-full border px-3 py-1 text-xs text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
