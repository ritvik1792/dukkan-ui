"use client";

import { Field, FileButton, TextArea, TextInput } from "@/components/ui/Field";
import { useAlert } from "@/components/ui/AlertMessage";
import { useApp } from "@/context/AppContext";
import { createId } from "@/lib/ids";
import { createReviewRequest, mapReview } from "@/lib/api";
import { persistImageFile } from "@/lib/images";
import { useState } from "react";

export function WriteReviewForm({
  catalogProductId,
  listingId,
  shopId,
  orderId,
  productName,
}: {
  catalogProductId: string;
  listingId?: string;
  shopId: string;
  orderId?: string;
  productName?: string;
}) {
  const { user, dispatch } = useApp();
  const { showAlert } = useAlert();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, 6);
    setFileName(picked.map((file) => file.name).join(", "));
    const next: string[] = [];
    for (const file of picked) {
      next.push(await persistImageFile(file));
    }
    setPhotos((current) => [...current, ...next].slice(0, 8));
  }

  async function submit() {
    if (!user || !body.trim()) return;
    const local = {
      id: createId("r"),
      catalogProductId,
      listingId,
      shopId,
      buyerId: user.id,
      rating,
      title: title.trim() || "Review",
      body: body.trim(),
      createdAt: new Date().toISOString(),
      orderId,
      imageUrls: photos,
    };
    try {
      const created = await createReviewRequest({
        catalogProductId,
        listingId,
        shopId,
        orderId,
        rating,
        title: local.title,
        body: local.body,
        imageUrls: photos,
      });
      dispatch({ type: "addReview", review: mapReview(created) });
    } catch {
      dispatch({ type: "addReview", review: local });
    }
    showAlert({ tone: "success", title: "Review posted" });
    setTitle("");
    setBody("");
    setPhotos([]);
    setFileName("");
    setRating(5);
  }

  if (!user) return null;

  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="font-semibold">Write a review{productName ? ` · ${productName}` : ""}</p>
      <p className="mt-1 text-xs text-stone-500">Add photos so other buyers can see the product.</p>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`${star} stars`}
            className={`text-lg ${star <= rating ? "text-ember" : "text-stone-300"}`}
            onClick={() => setRating(star)}
          >
            ★
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-3">
        <Field label="Title">
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What stood out?"
          />
        </Field>
        <Field label="Review">
          <TextArea
            required
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="How was the product and delivery?"
          />
        </Field>
        <div>
          <p className="text-sm font-medium">Pictures</p>
          <div className="mt-1">
            <FileButton
              accept="image/*"
              multiple
              buttonLabel="Choose pictures"
              fileName={fileName}
              onChange={(e) => void onFiles(e.target.files)}
            />
          </div>
          {photos.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {photos.map((src, index) => (
                <button
                  key={`${src.slice(0, 24)}-${index}`}
                  type="button"
                  className="relative h-16 w-16 overflow-hidden rounded-xl"
                  onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))}
                  aria-label="Remove picture"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className="rounded-full bg-carrot px-4 py-2 text-sm font-semibold text-white"
          onClick={() => void submit()}
        >
          Post review
        </button>
      </div>
    </div>
  );
}
