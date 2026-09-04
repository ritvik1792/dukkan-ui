"use client";

import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import type { CatalogProduct, Listing, ProductTag, TagKind } from "@/lib/types";
import { categories } from "@/data/seed";
import { createId } from "@/lib/ids";
import { useState } from "react";

export type ListingFormValue = {
  name: string;
  brand: string;
  categoryId: string;
  description: string;
  unit: string;
  basePrice: number;
  sellerPrice: number;
  stock: number;
  moq: number;
  color: string;
  quality: string;
  tags: ProductTag[];
};

export function listingToForm(listing: Listing, product: CatalogProduct): ListingFormValue {
  return {
    name: product.name,
    brand: product.brand,
    categoryId: product.categoryId,
    description: product.description,
    unit: product.unit,
    basePrice: listing.basePrice,
    sellerPrice: listing.sellerPrice,
    stock: listing.stock,
    moq: listing.moq,
    color: listing.color ?? "",
    quality: listing.quality ?? "",
    tags: listing.tags,
  };
}

const emptyForm: ListingFormValue = {
  name: "",
  brand: "",
  categoryId: "grocery",
  description: "",
  unit: "1 pc",
  basePrice: 100,
  sellerPrice: 90,
  stock: 10,
  moq: 1,
  color: "",
  quality: "",
  tags: [],
};

export function ListingForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: ListingFormValue;
  submitLabel: string;
  onSubmit: (value: ListingFormValue) => void;
}) {
  const [form, setForm] = useState<ListingFormValue>(initial ?? emptyForm);
  const [tagLabel, setTagLabel] = useState("");
  const [tagKind, setTagKind] = useState<TagKind>("sale");
  const [tagCode, setTagCode] = useState("");
  const [tagPct, setTagPct] = useState(10);

  function set<K extends keyof ListingFormValue>(key: K, value: ListingFormValue[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <Field label="Product name">
        <TextInput required value={form.name} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <Field label="Brand">
        <TextInput value={form.brand} onChange={(e) => set("brand", e.target.value)} />
      </Field>
      <Field label="Category">
        <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Description">
        <TextArea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Base price ₹">
          <TextInput
            type="number"
            value={form.basePrice}
            onChange={(e) => set("basePrice", Number(e.target.value))}
          />
        </Field>
        <Field label="Seller price ₹">
          <TextInput
            type="number"
            value={form.sellerPrice}
            onChange={(e) => set("sellerPrice", Number(e.target.value))}
          />
        </Field>
        <Field label="Stock">
          <TextInput
            type="number"
            value={form.stock}
            onChange={(e) => set("stock", Number(e.target.value))}
          />
        </Field>
        <Field label="Unit">
          <TextInput value={form.unit} onChange={(e) => set("unit", e.target.value)} />
        </Field>
        <Field label="Colour" hint="optional">
          <TextInput value={form.color} onChange={(e) => set("color", e.target.value)} />
        </Field>
        <Field label="Quality" hint="optional">
          <TextInput value={form.quality} onChange={(e) => set("quality", e.target.value)} />
        </Field>
      </div>
      <div className="rounded-2xl bg-white p-4">
        <p className="text-sm font-semibold">Tags / sale / coupon</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <TextInput
            placeholder="Label"
            value={tagLabel}
            onChange={(e) => setTagLabel(e.target.value)}
          />
          <Select value={tagKind} onChange={(e) => setTagKind(e.target.value as TagKind)}>
            <option value="sale">Sale</option>
            <option value="coupon">Coupon</option>
            <option value="offer">Offer</option>
            <option value="badge">Badge</option>
          </Select>
          <TextInput placeholder="Code" value={tagCode} onChange={(e) => setTagCode(e.target.value)} />
          <TextInput
            type="number"
            placeholder="% off"
            value={tagPct}
            onChange={(e) => setTagPct(Number(e.target.value))}
          />
        </div>
        <button
          type="button"
          className="mt-3 rounded-full bg-ink px-3 py-1 text-xs text-lime"
          onClick={() => {
            if (!tagLabel) return;
            setForm((f) => ({
              ...f,
              tags: [
                ...f.tags,
                {
                  id: createId("tag"),
                  label: tagLabel,
                  kind: tagKind,
                  code: tagCode || undefined,
                  discountPercent: tagPct || undefined,
                },
              ],
            }));
            setTagLabel("");
          }}
        >
          Add tag
        </button>
        <ul className="mt-3 space-y-1 text-sm">
          {form.tags.map((t) => (
            <li key={t.id} className="flex justify-between">
              <span>
                {t.label} ({t.kind})
              </span>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x.id !== t.id) }))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
      <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-lime">
        {submitLabel}
      </button>
    </form>
  );
}
