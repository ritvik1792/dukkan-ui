"use client";

import { Field, FileButton, Select, TextArea, TextInput } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { useApp } from "@/context/AppContext";
import { uniqueMediaUrls } from "@/lib/mediaUrls";
import type { CatalogProduct, CategoryKind, Listing, ProductTag } from "@/lib/types";
import { persistImageFile } from "@/lib/images";
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
  warranty: string;
  /** Preserved on edit; attach/detach offers later via Sales & coupons. */
  tags: ProductTag[];
  mainImage: string;
  gallery: string[];
  durationMinutes: number;
  bookingEnabled: boolean;
  requestEnabled: boolean;
  serviceArea: string;
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
    gallery: uniqueMediaUrls(product.galleryUrls ?? [], product.imageUrl),
    durationMinutes: 30,
    bookingEnabled: true,
    requestEnabled: true,
    serviceArea: "",
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
  durationMinutes: 30,
  bookingEnabled: true,
  requestEnabled: true,
  serviceArea: "",
};

export function blankListingForm(categoryId = "grocery"): ListingFormValue {
  return { ...emptyForm, categoryId };
}

function discountPercent(basePrice: number, sellerPrice: number) {
  if (basePrice <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - sellerPrice / basePrice) * 100)));
}

export function ListingForm({
  initial,
  submitLabel,
  hideCategory,
  lockedCategoryId,
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
  const categoryId = lockedCategoryId || form.categoryId;
  const kind: CategoryKind | undefined = categories.find((category) => category.id === categoryId)?.kind;
  const serviceListing = kind === "SERVICE";
  const productCategories = categories.filter((category) => category.kind !== "SERVICE");
  const serviceCategories = categories.filter((category) => category.kind === "SERVICE");

  function set<K extends keyof ListingFormValue>(key: K, value: ListingFormValue[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onMainFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setMainFileName(file.name);
    const url = await persistImageFile(file);
    setForm((current) => ({
      ...current,
      mainImage: url,
      gallery: uniqueMediaUrls(current.gallery, url),
    }));
  }

  async function onGalleryFiles(files: FileList | null) {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, 6);
    setGalleryFileName(picked.map((file) => file.name).join(", "));
    const next: string[] = [];
    for (const file of picked) {
      next.push(await persistImageFile(file));
    }
    setForm((current) => ({
      ...current,
      gallery: uniqueMediaUrls([...current.gallery, ...next], current.mainImage).slice(0, 8),
    }));
  }

  const discount = discountPercent(form.basePrice, form.sellerPrice);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const next = lockedCategoryId ? { ...form, categoryId: lockedCategoryId } : form;
        onSubmit({
          ...next,
          gallery: uniqueMediaUrls(next.gallery, next.mainImage),
        });
      }}
    >
      <div>
        <p className="text-sm font-medium">{serviceListing ? "Service images" : "Product images"}</p>
        <p className="mt-0.5 text-xs text-stone-400">
          {serviceListing ? "Main picture, plus any extra shots of the service." : "Main picture, plus any extra product shots."}
        </p>
        <div className="mt-2">
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
            onChange={(e) => {
              void onGalleryFiles(e.target.files);
              e.target.value = "";
            }}
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
                  setForm((current) => ({
                    ...current,
                    gallery: current.gallery.filter((_, i) => i !== index),
                  }))
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
      <Field label={serviceListing ? "Service name" : "Product name"}>
        <TextInput required value={form.name} onChange={(e) => set("name", e.target.value)} />
      </Field>
      {!serviceListing && (
        <Field label="Brand">
          <TextInput value={form.brand} onChange={(e) => set("brand", e.target.value)} />
        </Field>
      )}
      {!hideCategory && (
        <Field label={serviceListing ? "Service type" : "Product category"}>
          <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            <optgroup label="Products">
              {productCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.emoji} {category.name}
                </option>
              ))}
            </optgroup>
            {serviceCategories.length > 0 && (
              <optgroup label="Services">
                {serviceCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.emoji} {category.name}
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
        </Field>
      )}
      <Field label={serviceListing ? "Service description" : "Product description"}>
        <TextArea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
      </Field>
      {serviceListing ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starting price ₹">
              <TextInput
                type="number"
                min={0}
                value={form.sellerPrice}
                onChange={(e) => set("sellerPrice", Number(e.target.value))}
              />
            </Field>
            <Field label="Duration (minutes)">
              <TextInput
                type="number"
                min={0}
                value={form.durationMinutes}
                onChange={(e) => set("durationMinutes", Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Service area">
            <TextInput
              value={form.serviceArea}
              onChange={(e) => set("serviceArea", e.target.value)}
              placeholder="e.g. South Delhi"
            />
          </Field>
          <div className="space-y-3 rounded-2xl border border-border p-3">
            <p className="text-sm font-medium">Service availability</p>
            <Toggle
              label="Bookings"
              hint="Customers can book a time."
              checked={form.bookingEnabled}
              onChange={(checked) => set("bookingEnabled", checked)}
            />
            <Toggle
              label="Requests"
              hint="Customers can ask if you are available."
              checked={form.requestEnabled}
              onChange={(checked) => set("requestEnabled", checked)}
            />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price ₹">
            <TextInput
              type="number"
              min={0}
              value={form.sellerPrice}
              onChange={(e) => set("sellerPrice", Number(e.target.value))}
            />
          </Field>
          <Field label="MRP ₹">
            <TextInput
              type="number"
              min={0}
              value={form.basePrice}
              onChange={(e) => set("basePrice", Number(e.target.value))}
            />
          </Field>
          <Field label="Discount %">
            <TextInput
              type="number"
              min={0}
              max={100}
              value={discount}
              onChange={(e) => {
                const percent = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                set("sellerPrice", Math.round(form.basePrice * (1 - percent / 100)));
              }}
            />
          </Field>
          <Field label="Stock">
            <TextInput
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => set("stock", Number(e.target.value))}
            />
          </Field>
          <Field label="Quantity / unit">
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
      )}
      <button type="submit" className="rounded-full bg-carrot px-5 py-2.5 text-sm font-semibold text-white">
        {serviceListing ? submitLabel.replace(/product/i, "service") : submitLabel}
      </button>
    </form>
  );
}
