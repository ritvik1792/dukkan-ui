"use client";

import { useApp } from "@/context/AppContext";
import type { Advertisement } from "@/lib/types";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { useEffect, useState } from "react";

export function AdCarousel({ ads }: { ads: Advertisement[] }) {
  const { selectProduct } = useApp();
  const slides = ads.filter((a) => a.active);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const ad = slides[index] ?? slides[0];
  const productHref = Boolean(ad.catalogProductId && ad.href.startsWith("/product"));

  return (
    <section className="relative overflow-hidden rounded-3xl bg-ink text-white animate-fade-up">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `linear-gradient(120deg, hsl(${ad.hue} 60% 35%), #0b1f1a)`,
        }}
      />
      <div className="relative grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime">
            {ad.badge}
          </p>
          <h2 className="mt-2 max-w-xl text-2xl font-semibold tracking-tight md:text-3xl">
            {ad.title}
          </h2>
          <p className="mt-3 max-w-lg text-sm text-white/75 md:text-base">{ad.subtitle}</p>
          <Link
            href={productHref ? ROUTES.productInfo : ad.href}
            onClick={() => {
              if (ad.catalogProductId && productHref) selectProduct(ad.catalogProductId);
            }}
            className="mt-6 inline-block rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-ink"
          >
            {ad.cta}
          </Link>
        </div>
        <div className="hidden items-center justify-center md:flex">
          <div
            className="h-40 w-40 rounded-full opacity-80"
            style={{ background: `hsl(${ad.hue} 80% 60%)` }}
          />
        </div>
      </div>
      {slides.length > 1 && (
        <div className="relative flex items-center justify-between px-4 pb-4">
          <div className="flex gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Show ad ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full ${i === index ? "w-6 bg-lime" : "w-2 bg-white/40"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full bg-white/10 px-3 py-1 text-xs"
              onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            >
              Prev
            </button>
            <button
              type="button"
              className="rounded-full bg-white/10 px-3 py-1 text-xs"
              onClick={() => setIndex((i) => (i + 1) % slides.length)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
