import type { ListingFormValue } from "@/components/seller/ListingForm";
import { uniqueMediaUrls } from "@/lib/mediaUrls";
import type { Category, ServiceStatus } from "@/lib/types";

export function isServiceListingCategory(categories: Category[], categoryId: string) {
  return categories.find((category) => category.id === categoryId)?.kind === "SERVICE";
}

export function listingGallery(form: Pick<ListingFormValue, "mainImage" | "gallery">) {
  return uniqueMediaUrls(form.gallery, form.mainImage);
}

export function servicePayloadFromListing(form: ListingFormValue): {
  name: string;
  description?: string;
  categoryId?: string;
  startingPrice?: number;
  durationMinutes?: number;
  serviceArea?: string;
  bookingEnabled: boolean;
  requestEnabled: boolean;
  imageUrl?: string;
  imageUrls?: string[];
  status: ServiceStatus;
} {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    categoryId: form.categoryId || undefined,
    startingPrice: form.sellerPrice,
    durationMinutes: form.durationMinutes > 0 ? form.durationMinutes : undefined,
    serviceArea: form.serviceArea.trim() || undefined,
    bookingEnabled: form.bookingEnabled,
    requestEnabled: form.requestEnabled,
    imageUrl: form.mainImage || undefined,
    imageUrls: listingGallery(form),
    status: "ACTIVE",
  };
}
