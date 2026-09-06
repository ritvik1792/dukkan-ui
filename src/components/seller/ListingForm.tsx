"use client";

import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import type { CatalogProduct, Listing, ProductTag, TagKind } from "@/lib/types";
import { categories } from "@/data/seed";
import { createId } from "@/lib/ids";
import { fileToDataUrl } from "@/lib/images";
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
  mainImage: string;
  gallery: string[];
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
    mainImage: product.imageUrl ?? "",
    gallery: product.galleryUrls ?? [],
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
  mainImage: "",
  gallery: [],
};

export function blankListingForm(categoryId = "grocery"): ListingFormValue {
  return { ...emptyForm, categoryId };
}

export function ListingForm({
  initial,
  submitLabel,
  compact,
  hideCategory,
  lockedCategoryId,
  onSubmit,
}: {
  initial?: ListingFormValue;
  submitLabel: string;
  compact?: boolean;
  hideCategory?: boolean;
  lockedCategoryId?: string;
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

  async function onMainFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const url = await fileToDataUrl(file);
    set("mainImage", url);
  }

  async function onGalleryFiles(files: FileList | null) {
    if (!files?.length) return;
    const next: string[] = [];
    for (const file of Array.from(files).slice(0, 6)) {
      next.push(await fileToDataUrl(file));
    }
    setForm((f) => ({ ...f, gallery: [...f.gallery, ...next].slice(0, 8) }));
  }

  const tagBox = compact ? "rounded-2xl border border-stone-200 p-3" : "rounded-2xl bg-white p-4";

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(
          lockedCategoryId ? { ...form, categoryId: lockedCategoryId } : form,
        );
      }}
    >
      <Field label="Main picture">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => void onMainFile(e.target.files)}
          className="w-full text-sm"
        />
        {form.mainImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.mainImage} alt="" className="mt-2 h-28 w-full rounded-xl object-cover" />
        )}
      </Field>
      <Field label="Other pictures" hint="up to 8">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => void onGalleryFiles(e.target.files)}
          className="w-full text-sm"
        />
        {form.gallery.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {form.gallery.map((src, index) => (
              <button
                key={`${src.slice(0, 24)}-${index}`}
                type="button"
                className="relative h-16 w-16 overflow-hidden rounded-xl"
                onClick={() =>
                  setForm((f) => ({ ...f, gallery: f.gallery.filter((_, i) => i !== index) }))
                }
                aria-label="Remove picture"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </Field>
      <Field label="Product name">
        <TextInput required value={form.name} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <Field label="Brand">
        <TextInput value={form.brand} onChange={(e) => set("brand", e.target.value)} />
      </Field>
      {!hideCategory && (
        <Field label="Category">
          <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
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
      <div className={tagBox}>
        <p className="text-sm font-semibold">Tags / sale / coupon</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
