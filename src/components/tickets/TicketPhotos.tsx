"use client";

import { FileButton } from "@/components/ui/Field";
import { persistImageFile } from "@/lib/images";
import { useState } from "react";

const MAX_PHOTOS = 4;

export function TicketPhotoGrid({
  urls,
  onRemove,
  compact,
}: {
  urls: string[];
  onRemove?: (index: number) => void;
  compact?: boolean;
}) {
  if (urls.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "mt-2" : "mt-3"}`}>
      {urls.map((src, index) =>
        onRemove ? (
          <button
            key={`${src.slice(0, 24)}-${index}`}
            type="button"
            className="relative h-16 w-16 overflow-hidden rounded-xl"
            onClick={() => onRemove(index)}
            aria-label="Remove picture"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src.slice(0, 24)}-${index}`}
            src={src}
            alt=""
            className="h-20 w-20 rounded-xl object-cover"
          />
        ),
      )}
    </div>
  );
}

export function useTicketPhotos() {
  const [urls, setUrls] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");

  async function add(files: FileList | null) {
    if (!files?.length) return;
    const remaining = MAX_PHOTOS - urls.length;
    const picked = Array.from(files).slice(0, remaining);
    if (picked.length === 0) return;
    setFileName(picked.map((file) => file.name).join(", "));
    const next: string[] = [];
    for (const file of picked) {
      next.push(await persistImageFile(file));
    }
    setUrls((current) => [...current, ...next].slice(0, MAX_PHOTOS));
  }

  function remove(index: number) {
    setUrls((current) => current.filter((_, i) => i !== index));
  }

  function clear() {
    setUrls([]);
    setFileName("");
  }

  return { urls, fileName, add, remove, clear };
}

export function TicketPhotoPicker({
  urls,
  fileName,
  onAdd,
  onRemove,
}: {
  urls: string[];
  fileName: string;
  onAdd: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div>
      <FileButton
        accept="image/*"
        multiple
        buttonLabel="Add pictures"
        fileName={fileName || (urls.length ? `${urls.length} picture${urls.length === 1 ? "" : "s"}` : "")}
        onChange={(e) => {
          void onAdd(e.target.files);
          e.target.value = "";
        }}
      />
      <TicketPhotoGrid urls={urls} onRemove={onRemove} />
    </div>
  );
}
