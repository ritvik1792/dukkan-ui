"use client";

import { Field, FileButton, TextArea, TextInput } from "@/components/ui/Field";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { useApp } from "@/context/AppContext";
import { persistImageFile } from "@/lib/images";
import type { AdPlacement, Advertisement } from "@/lib/types";
import { useState } from "react";

export type AdFormValue = {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  badge: string;
  hue: number;
  placementId: string;
  catalogProductId: string;
  weight: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  imageUrl: string;
};

export function adToForm(ad: Advertisement): AdFormValue {
  return {
    title: ad.title,
    subtitle: ad.subtitle,
    cta: ad.cta,
    href: ad.href,
    badge: ad.badge,
    hue: ad.hue,
    placementId: ad.placementId ?? "",
    catalogProductId: ad.catalogProductId ?? "",
    weight: ad.weight ?? 1,
    startsAt: ad.startsAt?.slice(0, 10) ?? "",
    endsAt: ad.endsAt?.slice(0, 10) ?? "",
    active: ad.active,
    imageUrl: ad.imageUrl ?? "",
  };
}

export function blankAdForm(placementId = ""): AdFormValue {
  return {
    title: "",
    subtitle: "",
    cta: "Shop now",
    href: "/search",
    badge: "Sponsored",
    hue: 32,
    placementId,
    catalogProductId: "",
    weight: 1,
    startsAt: "",
    endsAt: "",
    active: true,
    imageUrl: "",
  };
}

export function AdForm({
  initial,
  placements,
  submitLabel,
  onSubmit,
}: {
  initial?: AdFormValue;
  placements: AdPlacement[];
  submitLabel: string;
  onSubmit: (value: AdFormValue) => void;
}) {
  const { state } = useApp();
  const [form, setForm] = useState<AdFormValue>(initial ?? blankAdForm());
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);

  function set<K extends keyof AdFormValue>(key: K, value: AdFormValue[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onPickImage(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setFileName(file.name);
    try {
      set("imageUrl", await persistImageFile(file));
    } finally {
      setUploading(false);
    }
  }

  const canSubmit = form.title.trim() && form.cta.trim() && form.href.trim();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        onSubmit(form);
      }}
    >
      <Field label="Creative">
        <div className="flex flex-wrap items-center gap-3">
          {form.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.imageUrl}
              alt=""
              className="h-20 w-32 rounded-xl object-cover"
            />
          ) : (
            <div
              className="flex h-20 w-32 items-center justify-center rounded-xl text-xs text-ink/60"
              style={{
                background: `linear-gradient(160deg, hsl(${form.hue} 70% 88%), hsl(${form.hue} 55% 72%))`,
              }}
            >
              No image
            </div>
          )}
          <div>
            <FileButton
              accept="image/*"
              buttonLabel={uploading ? "Uploading…" : "Upload image"}
              fileName={fileName}
              onChange={(event) => void onPickImage(event.target.files)}
            />
            {form.imageUrl && (
              <button
                type="button"
                className="mt-2 text-xs underline"
                onClick={() => {
                  set("imageUrl", "");
                  setFileName("");
                }}
              >
                Remove image
              </button>
            )}
          </div>
        </div>
      </Field>

      <Field label="Placement tag" hint="Where this ad is allowed to show">
        <SearchSelect
          value={form.placementId}
          onChange={(value) => set("placementId", value)}
          options={placements.map((placement) => ({
            value: placement.id,
            label: placement.label,
            hint: `${placement.rotationSeconds}s rotation · up to ${placement.maxAds} ads`,
          }))}
          placeholder="Unassigned"
          clearLabel="Unassigned"
          searchPlaceholder="Search placements"
        />
      </Field>

      <Field label="Title">
        <TextInput
          value={form.title}
          onChange={(event) => set("title", event.target.value)}
          placeholder="Atta from nearby kiranas"
          required
        />
      </Field>

      <Field label="Subtitle">
        <TextArea
          rows={2}
          value={form.subtitle}
          onChange={(event) => set("subtitle", event.target.value)}
          placeholder="One line that explains the offer."
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Button text">
          <TextInput value={form.cta} onChange={(event) => set("cta", event.target.value)} />
        </Field>
        <Field label="Badge">
          <TextInput value={form.badge} onChange={(event) => set("badge", event.target.value)} />
        </Field>
      </div>

      <Field label="Link" hint="Where the button sends the shopper">
        <TextInput
          value={form.href}
          onChange={(event) => set("href", event.target.value)}
          placeholder="/search?category=grocery"
        />
      </Field>

      <Field label="Linked product" hint="Optional — opens the product page instead of the link">
        <SearchSelect
          value={form.catalogProductId}
          onChange={(value) => set("catalogProductId", value)}
          options={state.catalog.map((product) => ({
            value: product.id,
            label: product.name,
            hint: product.brand,
          }))}
          placeholder="No product"
          clearLabel="No product"
          searchPlaceholder="Search catalogue"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Weight" hint="Higher shows first">
          <TextInput
            type="number"
            min={1}
            value={form.weight}
            onChange={(event) => set("weight", Number(event.target.value))}
          />
        </Field>
        <Field label="Starts">
          <TextInput
            type="date"
            value={form.startsAt}
            onChange={(event) => set("startsAt", event.target.value)}
          />
        </Field>
        <Field label="Ends">
          <TextInput
            type="date"
            value={form.endsAt}
            onChange={(event) => set("endsAt", event.target.value)}
          />
        </Field>
      </div>

      <Field label="Background hue" hint={`${form.hue}°, used when there is no image`}>
        <input
          type="range"
          min={0}
          max={360}
          value={form.hue}
          onChange={(event) => set("hue", Number(event.target.value))}
          className="w-full"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(event) => set("active", event.target.checked)}
        />
        Active — include in the rotation
      </label>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-full bg-carrot px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </form>
  );
}
