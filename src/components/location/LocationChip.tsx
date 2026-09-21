"use client";

import { PinIcon, useLocationDialog } from "@/components/location/LocationDialog";
import { useApp } from "@/context/AppContext";

export function LocationChip({ className = "" }: { className?: string }) {
  const { location, locationLabel } = useApp();
  const { openLocation } = useLocationDialog();

  return (
    <button
      type="button"
      onClick={openLocation}
      className={`flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-left hover:bg-white/15 ${className}`}
    >
      <PinIcon className="h-4 w-4 shrink-0 text-lime" />
      <span className="min-w-0">
        <span className="block text-[10px] uppercase tracking-wider text-white/60">
          {location ? (location.source === "gps" ? "Your location" : "Delivering to") : "Set location"}
        </span>
        <span className="block truncate text-sm font-medium">{locationLabel}</span>
      </span>
    </button>
  );
}
