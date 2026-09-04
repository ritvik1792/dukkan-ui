"use client";

import { ListingForm, listingToForm, type ListingFormValue } from "@/components/seller/ListingForm";
import { useApp } from "@/context/AppContext";
import { useParams, useRouter } from "next/navigation";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const { listingById, catalogById, dispatch } = useApp();
  const router = useRouter();
  const listing = listingById(params.id);
  const product = listing ? catalogById(listing.catalogProductId) : undefined;

  if (!listing || !product) return <p>Product not found.</p>;

  const currentListing = listing;
  const currentProduct = product;

  function save(form: ListingFormValue) {
    dispatch({
      type: "upsertCatalog",
      product: {
        ...currentProduct,
        name: form.name,
        brand: form.brand || currentProduct.brand,
        categoryId: form.categoryId,
        description: form.description,
        unit: form.unit,
      },
    });
    dispatch({
      type: "upsertListing",
      listing: {
        ...currentListing,
        basePrice: form.basePrice,
        sellerPrice: form.sellerPrice,
        stock: form.stock,
        moq: form.moq,
        color: form.color || undefined,
        quality: form.quality || undefined,
        tags: form.tags,
      },
    });
    router.push("/seller/products");
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Edit product</h1>
      <div className="mt-6">
        <ListingForm
          initial={listingToForm(listing, product)}
          submitLabel="Save"
          onSubmit={save}
        />
      </div>
    </div>
  );
}
