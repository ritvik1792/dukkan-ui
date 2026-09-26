"use client";

import { PinIcon, useLocationDialog } from "@/components/location/LocationDialog";
import { useApp } from "@/context/AppContext";
import { updateProfileRequest } from "@/lib/api";
import { MAX_SHOP_RADIUS_KM, MIN_SHOP_RADIUS_KM } from "@/lib/constants";
import { clampShopRadiusKm } from "@/services/auth";
import { FormEvent, useEffect, useId, useRef, useState } from "react";

const PRESETS = [5, 10, 15];

export function LocationChip({
  className = "",
  tone = "header",
}: {
  className?: string;
  tone?: "header" | "hero";
}) {
  const { locationLabel, shopRadiusKm, user, dispatch } = useApp();
  const { openLocation } = useLocationDialog();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(String(shopRadiusKm));
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const onDark = tone === "header";

  useEffect(() => {
    if (open) setDraft(String(shopRadiusKm));
  }, [open, shopRadiusKm]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function apply(value: number) {
    const km = clampShopRadiusKm(value);
    dispatch({ type: "setSearchRadius", km });
    if (user) void updateProfileRequest({ shopRadiusKm: km }).catch(() => undefined);
    setOpen(false);
  }

  function submitCustom(event: FormEvent) {
    event.preventDefault();
    const value = Number(draft);
    if (!Number.isFinite(value)) return;
    apply(value);
  }

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <div
        className={`flex min-w-0 items-center gap-1.5 text-left text-xs sm:text-sm ${
          onDark ? "text-white" : "text-ink"
        }`}
      >
        <button
          type="button"
          onClick={openLocation}
          className={`flex min-w-0 flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-left ${
            onDark ? "bg-white/10 hover:bg-white/15" : "bg-white ring-1 ring-black/10"
          }`}
        >
          {onDark ? (
            <PinIcon className="h-3.5 w-3.5 shrink-0 text-rose-gold" />
          ) : (
            <span aria-hidden>📍</span>
          )}
          <span className="min-w-0 flex-1">
            <span className={`block text-[10px] uppercase tracking-wide ${onDark ? "text-white/60" : "text-stone-400"}`}>
              Search location
            </span>
            <span className="block truncate font-semibold">{locationLabel}</span>
          </span>
        </button>
        <span className={onDark ? "shrink-0 text-white/70" : "shrink-0 text-stone-500"}>around</span>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => {
            setDraft(String(shopRadiusKm));
            setOpen((current) => !current);
          }}
          className={`shrink-0 rounded-full px-2 py-0.5 font-semibold ${
            onDark
              ? "bg-white/15 hover:bg-white/25"
              : "bg-rose-50 text-rose-700 hover:bg-rose-100"
          }`}
        >
          {shopRadiusKm} km
        </button>
      </div>
      {open && (
        <div
          id={panelId}
          className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-border bg-white p-3 text-ink shadow-xl"
        >
          <p className="text-xs font-medium text-stone-500">How far to look</p>
          <div className="mt-2 flex gap-2">
            {PRESETS.map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => apply(km)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  shopRadiusKm === km
                    ? "bg-carrot text-white"
                    : "border border-border hover:bg-blush"
                }`}
              >
                {km} km
              </button>
            ))}
          </div>
          <form onSubmit={submitCustom} className="mt-3 flex gap-2">
            <label className="sr-only" htmlFor={`${panelId}-km`}>
              Custom distance in kilometres
            </label>
            <input
              id={`${panelId}-km`}
              type="number"
              inputMode="numeric"
              min={MIN_SHOP_RADIUS_KM}
              max={MAX_SHOP_RADIUS_KM}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="w-full rounded-xl border border-border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-carrot/40"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-carrot px-3 py-1.5 text-xs font-semibold text-white"
            >
              Set
            </button>
          </form>
          <p className="mt-2 text-[11px] text-stone-400">
            {MIN_SHOP_RADIUS_KM}–{MAX_SHOP_RADIUS_KM} km
          </p>
        </div>
      )}
    </div>
  );
}
