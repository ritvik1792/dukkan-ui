"use client";

import { ListingForm, listingToForm, type ListingFormValue } from "@/components/seller/ListingForm";
import { useApp } from "@/context/AppContext";
import { mapCatalogProduct, mapListing, upsertCatalogRequest, upsertListingRequest } from "@/lib/api";
import { useMotionRouter } from "@/lib/motion";
import { sellerConsolePath } from "@/lib/routes";
import { useParams } from "next/navigation";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const { listingById, catalogById, dispatch } = useApp();
  const router = useMotionRouter();
  const listing = listingById(params.id);
  const product = listing ? catalogById(listing.catalogProductId) : undefined;

  if (!listing || !product) return <p>Product not found.</p>;

  const currentListing = listing;
  const currentProduct = product;

  async function save(form: ListingFormValue) {
    const productPatch = {
      ...currentProduct,
      name: form.name,
      brand: form.brand || currentProduct.brand,
      categoryId: form.categoryId,
      description: form.description,
      unit: form.unit,
      imageUrl: form.mainImage || undefined,
      galleryUrls: form.gallery,
    };
    const listingPatch = {
      ...currentListing,
      basePrice: form.basePrice,
      sellerPrice: form.sellerPrice,
      stock: form.stock,
      moq: form.moq,
      color: form.color || undefined,
      quality: form.quality || undefined,
      warranty: form.warranty || undefined,
      tags: form.tags,
    };
    try {
      const product = mapCatalogProduct(
        await upsertCatalogRequest(
          {
            name: productPatch.name,
            brand: productPatch.brand,
            categoryId: productPatch.categoryId,
            description: productPatch.description,
            unit: productPatch.unit,
            imageLabel: productPatch.imageLabel,
            imageHue: productPatch.imageHue,
            imageUrl: productPatch.imageUrl,
            galleryUrls: productPatch.galleryUrls,
          },
          currentProduct.id,
        ),
      );
      const listing = mapListing(
        await upsertListingRequest(
          {
            basePrice: listingPatch.basePrice,
            sellerPrice: listingPatch.sellerPrice,
            stock: listingPatch.stock,
            moq: listingPatch.moq,
            color: listingPatch.color,
            quality: listingPatch.quality,
            warranty: listingPatch.warranty,
            tags: listingPatch.tags,
          },
          currentListing.id,
        ),
      );
      dispatch({ type: "upsertCatalog", product });
      dispatch({ type: "upsertListing", listing });
    } catch {
      dispatch({ type: "upsertCatalog", product: productPatch });
      dispatch({ type: "upsertListing", listing: listingPatch });
    }
    router.push(sellerConsolePath("/products"));
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Edit product</h1>
      <div className="mt-6">
        <ListingForm
          shopId={listing.shopId}
          initial={listingToForm(listing, product)}
          submitLabel="Save"
          onSubmit={(form) => void save(form)}
        />
      </div>
    </div>
  );
}
