"use client";

import { PinIcon } from "@/components/location/LocationDialog";
import { reverseGeocode, type ReverseGeocode } from "@/lib/api";
import { formatAccuracy, formatCoordinates } from "@/lib/geo";
import { geoErrorMessage, requestGeoFix } from "@/lib/geolocation";
import type { Coordinates } from "@/lib/types";
import { useState } from "react";

/**
 * Attaches a GPS fix to whatever is being saved (a shop, a delivery address). Optional by
 * design: the surrounding form must stay usable when the shopper declines.
 */
export function LocationCapture({
  value,
  accuracyM,
  onCapture,
  onClear,
  label = "Pin exact location",
  hint = "Helps us place you accurately on the map and rank nearby shops.",
}: {
  value?: Coordinates;
  accuracyM?: number;
  onCapture: (coordinates: Coordinates, accuracyM?: number, address?: ReverseGeocode) => void;
  onClear?: () => void;
  label?: string;
  hint?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resolvedLabel, setResolvedLabel] = useState("");

  async function capture() {
    setBusy(true);
    setError("");
    try {
      const fix = await requestGeoFix();
      let address: ReverseGeocode | undefined;
      try {
        address = await reverseGeocode(fix.coordinates.lat, fix.coordinates.lng);
        setResolvedLabel(address.formattedAddress);
      } catch {
        setResolvedLabel("");
      }
      onCapture(fix.coordinates, fix.accuracyM, address);
    } catch (err) {
      setError(geoErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const accuracy = formatAccuracy(accuracyM);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{label}</p>
          {value ? (
            <p className="mt-0.5 text-xs text-stone-500">
              {resolvedLabel ? (
                <span className="block">{resolvedLabel}</span>
              ) : null}
              <span className="tabular-nums">
                {formatCoordinates(value)}
                {accuracy ? ` · ${accuracy}` : ""}
              </span>
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-stone-500">{hint}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {value && onClear && (
            <button
              type="button"
              onClick={() => {
                onClear();
                setError("");
                setResolvedLabel("");
              }}
              className="text-xs text-stone-500 underline"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={capture}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-lime disabled:opacity-70"
          >
            <PinIcon className="h-3.5 w-3.5" />
            {busy ? "Locating…" : value ? "Update" : "Use current location"}
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
