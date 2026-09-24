"use client";

import { Field, FileButton, Select, TextArea, TextInput } from "@/components/ui/Field";
import { useApp } from "@/context/AppContext";
import type { CatalogProduct, Listing, ProductTag } from "@/lib/types";
import { persistImageFile } from "@/lib/images";
import { eligiblePromoTags, snapshotTag, tagRuleSummary } from "@/lib/tags";
import { useMemo, useState } from "react";

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
  warranty: string;
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
    warranty: listing.warranty ?? "",
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
  warranty: "",
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
  shopId,
  onSubmit,
}: {
  initial?: ListingFormValue;
  submitLabel: string;
  compact?: boolean;
  hideCategory?: boolean;
  lockedCategoryId?: string;
  shopId?: string;
  onSubmit: (value: ListingFormValue) => void;
}) {
  const { state } = useApp();
  const categories = state.categories;
  const [form, setForm] = useState<ListingFormValue>(initial ?? emptyForm);
  const [mainFileName, setMainFileName] = useState("");
  const [galleryFileName, setGalleryFileName] = useState("");
  const eligible = useMemo(
    () => eligiblePromoTags(state.promoTags, shopId),
    [state.promoTags, shopId],
  );

  function set<K extends keyof ListingFormValue>(key: K, value: ListingFormValue[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onMainFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setMainFileName(file.name);
    const url = await persistImageFile(file);
    set("mainImage", url);
  }

  async function onGalleryFiles(files: FileList | null) {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, 6);
    setGalleryFileName(picked.map((file) => file.name).join(", "));
    const next: string[] = [];
    for (const file of picked) {
      next.push(await persistImageFile(file));
    }
    setForm((f) => ({ ...f, gallery: [...f.gallery, ...next].slice(0, 8) }));
  }

  const tagBox = compact ? "rounded-2xl border border-border p-3" : "rounded-2xl bg-white p-4";

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
      <div>
        <p className="text-sm font-medium">Main picture</p>
        <div className="mt-1">
          <FileButton
            accept="image/*"
            buttonLabel="Choose picture"
            fileName={mainFileName || (form.mainImage ? "Picture added" : "")}
            onChange={(e) => void onMainFile(e.target.files)}
          />
        </div>
        {form.mainImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.mainImage} alt="" className="mt-2 h-28 w-full rounded-xl object-cover" />
        )}
      </div>
      <div>
        <p className="text-sm font-medium">
          Other pictures <span className="font-normal text-stone-400">up to 8</span>
        </p>
        <div className="mt-1">
          <FileButton
            accept="image/*"
            multiple
            buttonLabel="Choose pictures"
            fileName={galleryFileName}
            onChange={(e) => void onGalleryFiles(e.target.files)}
          />
        </div>
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
      </div>
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
        <Field label="Warranty" hint="optional">
          <TextInput
            value={form.warranty}
            onChange={(e) => set("warranty", e.target.value)}
            placeholder="12 months, 7-day replacement"
          />
        </Field>
      </div>
      <div className={tagBox}>
        <p className="text-sm font-semibold">Tags / sale / coupon</p>
        <p className="mt-1 text-xs text-stone-500">
          Choose from your tags and platform tags. Create new ones under Sales & coupons.
        </p>
        <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto">
          {eligible.map((tag) => {
            const selected = form.tags.some((item) => item.id === tag.id);
            return (
              <li key={tag.id}>
                <label className="flex cursor-pointer items-start gap-2 rounded-xl px-1 py-1 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selected}
                    onChange={() =>
                      setForm((current) => ({
                        ...current,
                        tags: selected
                          ? current.tags.filter((item) => item.id !== tag.id)
                          : [...current.tags, snapshotTag(tag)],
                      }))
                    }
                  />
                  <span>
                    <span className="font-medium">
                      {tag.label}
                      {tag.owner === "admin" ? " · Platform" : ""}
                    </span>
                    <span className="mt-0.5 block text-xs text-stone-400">{tagRuleSummary(tag)}</span>
                  </span>
                </label>
              </li>
            );
          })}
          {eligible.length === 0 && (
            <li className="text-sm text-stone-500">No active tags yet. Add one from Sales & coupons.</li>
          )}
        </ul>
      </div>
      <button type="submit" className="rounded-full bg-carrot px-5 py-2.5 text-sm font-semibold text-white">
        {submitLabel}
      </button>
    </form>
  );
}
