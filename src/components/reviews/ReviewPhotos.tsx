"use client";

import { useState } from "react";

export function ReviewPhotos({ urls }: { urls?: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!urls?.length) return null;

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        {urls.map((src, index) => (
          <button
            key={`${src.slice(0, 32)}-${index}`}
            type="button"
            className="h-20 w-20 overflow-hidden rounded-xl ring-1 ring-stone-200"
            onClick={() => setOpen(src)}
            aria-label={`View review photo ${index + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close photo"
            className="drawer-scrim absolute inset-0 bg-black/70"
            onClick={() => setOpen(null)}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={open}
            alt="Review photo"
            className="relative z-10 max-h-[80vh] max-w-[min(90vw,720px)] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
