"use client";

import { LocationCapture } from "@/components/location/LocationCapture";
import { CategoryMultiSelect, isProductCategory, isServiceCategory } from "@/components/ui/CategoryMultiSelect";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import type { Category, Coordinates, ProviderType } from "@/lib/types";

export type SellerIntentValues = {
  productCategoryIds: string[];
  provideServices: boolean;
  serviceCategoryIds: string[];
  businessName: string;
  address: string;
  gstin: string;
  notes: string;
  partnerDelivery: boolean;
  shopDelivery: boolean;
  providerType: ProviderType;
  profession: string;
  serviceArea: string;
  pin: { coordinates: Coordinates; accuracyM?: number } | null;
};

export function emptySellerIntent(defaults?: Partial<SellerIntentValues>): SellerIntentValues {
  return {
    productCategoryIds: [],
    provideServices: false,
    serviceCategoryIds: [],
    businessName: "",
    address: "",
    gstin: "",
    notes: "",
    partnerDelivery: true,
    shopDelivery: true,
    providerType: "SERVICE_BUSINESS",
    profession: "",
    serviceArea: "",
    pin: null,
    ...defaults,
  };
}

export function isSelling(values: SellerIntentValues) {
  return values.productCategoryIds.length > 0 || values.provideServices;
}

export function sellerIntentError(values: SellerIntentValues, requireDetails: boolean) {
  if (!isSelling(values)) return "";
  if (values.provideServices && values.serviceCategoryIds.length === 0) {
    return "Select at least one service category.";
  }
  if (!requireDetails) return "";
  if (values.businessName.trim().length < 2) {
    return "Enter a shop or business name.";
  }
  if (values.address.trim().length < 4) {
    return "Enter your shop or service address.";
  }
  return "";
}

export function SellerIntentFields({
  categories,
  values,
  onChange,
  locationLabel,
  mode,
}: {
  categories: Category[];
  values: SellerIntentValues;
  onChange: (next: SellerIntentValues) => void;
  locationLabel: string;
  mode: "apply" | "add";
}) {
  const productCategories = categories.filter(isProductCategory);
  const serviceCategories = categories.filter(isServiceCategory);
  const showDetails = mode === "apply";
  const showDelivery = showDetails && values.productCategoryIds.length > 0;

  function set<K extends keyof SellerIntentValues>(key: K, value: SellerIntentValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Shop categories</p>
        <p className="mt-0.5 text-xs font-normal text-stone-400">
          Optional. Pick every product type you sell — you can add more later.
        </p>
        <div className="mt-2">
          <CategoryMultiSelect
            categories={productCategories}
            selectedIds={values.productCategoryIds}
            onChange={(ids) => set("productCategoryIds", ids)}
          />
        </div>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={values.provideServices}
          onChange={(e) =>
            onChange({
              ...values,
              provideServices: e.target.checked,
              serviceCategoryIds: e.target.checked ? values.serviceCategoryIds : [],
            })
          }
        />
        <span>
          <span className="font-medium">I provide services</span>
          <span className="mt-0.5 block text-xs font-normal text-stone-400">
            Salon, repairs, tutors, and other work you offer in person.
          </span>
        </span>
      </label>

      {values.provideServices && (
        <>
          <Field label="Service categories" hint="multi-select">
            <CategoryMultiSelect
              categories={serviceCategories}
              selectedIds={values.serviceCategoryIds}
              onChange={(ids) => set("serviceCategoryIds", ids)}
            />
          </Field>
          {mode !== "add" && (
            <>
              <Field label="Provider type">
                <Select
                  value={values.providerType}
                  onChange={(e) => set("providerType", e.target.value as ProviderType)}
                >
                  <option value="SERVICE_BUSINESS">Service business</option>
                  <option value="INDIVIDUAL">Individual professional</option>
                </Select>
              </Field>
              {values.providerType === "INDIVIDUAL" && (
                <Field label="Profession">
                  <TextInput
                    value={values.profession}
                    onChange={(e) => set("profession", e.target.value)}
                    placeholder="e.g. Electrician"
                  />
                </Field>
              )}
              <Field label="Service area">
                <TextInput
                  value={values.serviceArea}
                  onChange={(e) => set("serviceArea", e.target.value)}
                  placeholder="e.g. South Delhi"
                />
              </Field>
            </>
          )}
        </>
      )}

      {showDetails && (
        <>
          <Field label={values.providerType === "INDIVIDUAL" && values.provideServices && values.productCategoryIds.length === 0 ? "Your name on the listing" : "Shop or business name"}>
            <TextInput
              required
              value={values.businessName}
              onChange={(e) => set("businessName", e.target.value)}
            />
          </Field>
          <Field label="Address">
            <TextArea
              required
              value={values.address}
              onChange={(e) => set("address", e.target.value)}
              rows={2}
            />
          </Field>
          <Field
            label="Location"
            hint={values.pin ? "GPS pinned" : `defaults to ${locationLabel}`}
          >
            <LocationCapture
              label="Pin your shop or base location"
              hint="Buyers only see you inside their radius, so an accurate pin helps."
              value={values.pin?.coordinates}
              accuracyM={values.pin?.accuracyM}
              onCapture={(coordinates, accuracyM, resolved) => {
                onChange({
                  ...values,
                  pin: { coordinates, accuracyM },
                  address: resolved?.formattedAddress || values.address,
                });
              }}
              onClear={() => set("pin", null)}
            />
          </Field>
          {values.productCategoryIds.length > 0 && (
            <Field label="GSTIN" hint="optional">
              <TextInput value={values.gstin} onChange={(e) => set("gstin", e.target.value)} />
            </Field>
          )}
          {showDelivery && (
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={values.partnerDelivery}
                  onChange={(e) => set("partnerDelivery", e.target.checked)}
                />
                Dukkan partner delivery
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={values.shopDelivery}
                  onChange={(e) => set("shopDelivery", e.target.checked)}
                />
                Deliver ourselves
              </label>
            </div>
          )}
          <Field label="About">
            <TextArea value={values.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
          </Field>
        </>
      )}

      {mode === "add" && values.provideServices && (
        <Field label="Service area">
          <TextInput
            value={values.serviceArea}
            onChange={(e) => set("serviceArea", e.target.value)}
            placeholder="e.g. South Delhi"
          />
        </Field>
      )}
    </div>
  );
}
