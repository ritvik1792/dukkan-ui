"use client";

import { useApp } from "@/context/AppContext";
import type { Advertisement } from "@/lib/types";
import { adsForPlacement, placementBySlug, rotationMs } from "@/lib/ads";
import { advertisements as seedAds } from "@/data/seed";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export function AdCarousel({
  ads,
  placementSlug = "home-hero",
}: {
  ads: Advertisement[];
  placementSlug?: string;
}) {
  const { state, selectProduct } = useApp();
  const [index, setIndex] = useState(0);
  const [slideKey, setSlideKey] = useState(0);

  const placement = placementBySlug(state.adPlacements, placementSlug);
  const slides = useMemo(() => {
    const source = ads.length ? ads : seedAds;
    const booked = adsForPlacement(source, placement);
    // Older ads have no placement yet, so fall back to every active ad rather than an empty slot.
    const active = booked.length ? booked : source.filter((ad) => ad.active);
    // Keep the home bar visible even when the API returns an empty catalog.
    return active.length ? active : seedAds.filter((ad) => ad.active);
  }, [ads, placement]);
  const interval = rotationMs(placement);

  useEffect(() => {
    setIndex(0);
    setSlideKey((k) => k + 1);
  }, [slides.length, placementSlug]);

  useEffect(() => {
    if (slides.length < 2) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
      setSlideKey((k) => k + 1);
    }, interval);
    return () => window.clearInterval(id);
  }, [slides.length, interval]);

  if (slides.length === 0) return null;

  const ad = slides[index] ?? slides[0];
  const productHref = Boolean(ad.catalogProductId && ad.href.startsWith("/product"));

  function goTo(next: number) {
    setIndex(next);
    setSlideKey((k) => k + 1);
  }

  return (
    <section className="ad-carousel relative overflow-hidden rounded-2xl bg-ink text-white shadow-sm sm:rounded-3xl">
      <div
        className="absolute inset-0 opacity-40 transition-[background] duration-700 ease-out"
        style={{
          background: `linear-gradient(120deg, hsl(${ad.hue} 45% 42%), #1e1418)`,
        }}
      />
      <div
        key={slideKey}
        className="ad-carousel-slide relative grid gap-5 p-5 md:grid-cols-[1.2fr_0.8fr] md:gap-6 md:p-7"
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-gold sm:text-xs">
            {ad.badge}
          </p>
          <h2 className="mt-1.5 max-w-xl text-xl font-semibold tracking-tight sm:mt-2 md:text-3xl">
            {ad.title}
          </h2>
          <p className="mt-2 max-w-lg text-sm text-white/75 md:mt-3 md:text-base">{ad.subtitle}</p>
          <Link
            href={productHref ? ROUTES.productInfo : ad.href}
            onClick={() => {
              if (ad.catalogProductId && productHref) selectProduct(ad.catalogProductId);
            }}
            className="btn-primary mt-4 sm:mt-5"
          >
            {ad.cta}
          </Link>
        </div>
        <div className="hidden items-center justify-center md:flex">
          {ad.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ad.imageUrl}
              alt=""
              className="h-36 w-full rounded-2xl object-cover"
            />
          ) : (
            <div
              className="h-36 w-36 rounded-full opacity-80 transition-[background] duration-700"
              style={{ background: `hsl(${ad.hue} 38% 58%)` }}
            />
          )}
        </div>
      </div>
      {slides.length > 1 && (
        <div className="relative flex items-center justify-between px-4 pb-3.5 sm:px-5 sm:pb-4">
          <div className="flex gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Show ad ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-5 bg-rose-gold" : "w-1.5 bg-white/35 hover:bg-white/55"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full bg-white/10 px-3 py-1 text-xs transition hover:bg-white/20"
              onClick={() => goTo((index - 1 + slides.length) % slides.length)}
            >
              Prev
            </button>
            <button
              type="button"
              className="rounded-full bg-white/10 px-3 py-1 text-xs transition hover:bg-white/20"
              onClick={() => goTo((index + 1) % slides.length)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
