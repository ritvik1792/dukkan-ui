"use client";

import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import type { AdPlacement } from "@/lib/types";
import { useState } from "react";

export type PlacementFormValue = {
  label: string;
  slug: string;
  description: string;
  rotationSeconds: number;
  maxAds: number;
  active: boolean;
};

export function placementToForm(placement: AdPlacement): PlacementFormValue {
  return {
    label: placement.label,
    slug: placement.slug,
    description: placement.description,
    rotationSeconds: placement.rotationSeconds,
    maxAds: placement.maxAds,
    active: placement.active,
  };
}

export function blankPlacementForm(): PlacementFormValue {
  return {
    label: "",
    slug: "",
    description: "",
    rotationSeconds: 6,
    maxAds: 4,
    active: true,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function PlacementForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: PlacementFormValue;
  submitLabel: string;
  onSubmit: (value: PlacementFormValue) => void;
}) {
  const [form, setForm] = useState<PlacementFormValue>(initial ?? blankPlacementForm());
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));

  function set<K extends keyof PlacementFormValue>(key: K, value: PlacementFormValue[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const canSubmit = form.label.trim().length > 0 && form.rotationSeconds > 0 && form.maxAds > 0;

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        onSubmit({ ...form, slug: form.slug || slugify(form.label) });
      }}
    >
      <Field label="Tag name" hint="What this slot is called in the dashboard">
        <TextInput
          value={form.label}
          onChange={(event) => {
            set("label", event.target.value);
            if (!slugTouched) set("slug", slugify(event.target.value));
          }}
          placeholder="Home hero"
          required
        />
      </Field>

      <Field label="Slug" hint="Used by the storefront to pick this slot">
        <TextInput
          value={form.slug}
          onChange={(event) => {
            setSlugTouched(true);
            set("slug", slugify(event.target.value));
          }}
          placeholder="home-hero"
        />
      </Field>

      <Field label="Description">
        <TextArea
          rows={2}
          value={form.description}
          onChange={(event) => set("description", event.target.value)}
          placeholder="Big rotating banner at the top of the buyer dashboard."
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Rotation time" hint="Seconds per ad">
          <TextInput
            type="number"
            min={1}
            max={120}
            value={form.rotationSeconds}
            onChange={(event) => set("rotationSeconds", Number(event.target.value))}
          />
        </Field>
        <Field label="Max ads" hint="How many ads the slot cycles">
          <TextInput
            type="number"
            min={1}
            max={20}
            value={form.maxAds}
            onChange={(event) => set("maxAds", Number(event.target.value))}
          />
        </Field>
      </div>

      <Toggle
        label="Active"
        hint="This slot renders on the storefront."
        checked={form.active}
        onChange={(checked) => set("active", checked)}
      />

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
