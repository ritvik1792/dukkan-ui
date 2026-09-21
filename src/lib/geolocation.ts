import { GEO_MAX_AGE_MS, GEO_TIMEOUT_MS } from "./constants";
import { roundCoordinates } from "./geo";
import type { Coordinates } from "./types";

export type GeoPermission = "granted" | "prompt" | "denied" | "unsupported";

export type GeoFix = {
  coordinates: Coordinates;
  accuracyM?: number;
};

export type GeoErrorReason = "unsupported" | "denied" | "unavailable" | "timeout";

const MESSAGES: Record<GeoErrorReason, string> = {
  unsupported: "This browser can't share a location. Pick your area below instead.",
  denied:
    "Location access is blocked. Allow it from the address bar, or pick your area below.",
  unavailable: "We couldn't get a GPS fix. Try again, or pick your area below.",
  timeout: "Getting your location took too long. Try again, or pick your area below.",
};

export class GeoError extends Error {
  reason: GeoErrorReason;

  constructor(reason: GeoErrorReason) {
    super(MESSAGES[reason]);
    this.name = "GeoError";
    this.reason = reason;
  }
}

export function geolocationSupported(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

/**
 * Permissions API is unavailable on some browsers (notably older Safari), where the only
 * way to learn the state is to actually ask for a fix.
 */
export async function readGeoPermission(): Promise<GeoPermission> {
  if (!geolocationSupported()) return "unsupported";
  if (!navigator.permissions?.query) return "prompt";
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state;
  } catch {
    return "prompt";
  }
}

export function requestGeoFix(options?: PositionOptions): Promise<GeoFix> {
  if (!geolocationSupported()) {
    return Promise.reject(new GeoError("unsupported"));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coordinates: roundCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
          accuracyM: Number.isFinite(position.coords.accuracy)
            ? position.coords.accuracy
            : undefined,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) reject(new GeoError("denied"));
        else if (error.code === error.TIMEOUT) reject(new GeoError("timeout"));
        else reject(new GeoError("unavailable"));
      },
      {
        enableHighAccuracy: true,
        timeout: GEO_TIMEOUT_MS,
        maximumAge: GEO_MAX_AGE_MS,
        ...options,
      },
    );
  });
}

export function geoErrorMessage(error: unknown): string {
  if (error instanceof GeoError) return error.message;
  return MESSAGES.unavailable;
}
