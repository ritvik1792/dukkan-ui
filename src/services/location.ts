import { reverseGeocode, type ReverseGeocode } from "@/lib/api";
import { AREA_LABEL_MAX_KM } from "@/lib/constants";
import { distanceKm, formatAccuracy, isCoordinates, nearestByDistance } from "@/lib/geo";
import type { GeoFix } from "@/lib/geolocation";
import type { Coordinates, Neighborhood, UserLocation } from "@/lib/types";

export function nearestNeighborhood(
  origin: Coordinates,
  neighborhoods: Neighborhood[],
): Neighborhood | undefined {
  return nearestByDistance(origin, neighborhoods);
}

/** Names a raw fix after the closest known area when reverse geocoding is unavailable. */
export function gpsLocation(fix: GeoFix, neighborhoods: Neighborhood[]): UserLocation {
  const nearest = nearestNeighborhood(fix.coordinates, neighborhoods);
  const withinRange =
    nearest && distanceKm(fix.coordinates, nearest.coordinates) <= AREA_LABEL_MAX_KM;
  return {
    coordinates: fix.coordinates,
    label: withinRange ? `Near ${nearest.name}` : "Current location",
    area: withinRange ? nearest.area : undefined,
    source: "gps",
    accuracyM: fix.accuracyM,
    capturedAt: new Date().toISOString(),
  };
}

export function applyResolvedAddress(location: UserLocation, resolved: ReverseGeocode): UserLocation {
  const label =
    resolved.suburb?.trim() ||
    resolved.road?.trim() ||
    shortAddress(resolved.formattedAddress) ||
    location.label;
  const area = [resolved.city, resolved.state].filter(Boolean).join(", ") || location.area;
  return { ...location, label, area };
}

export async function resolveGpsLocation(
  fix: GeoFix,
  neighborhoods: Neighborhood[],
): Promise<UserLocation> {
  const fallback = gpsLocation(fix, neighborhoods);
  try {
    return applyResolvedAddress(fallback, await reverseGeocode(fix.coordinates.lat, fix.coordinates.lng));
  } catch {
    return fallback;
  }
}

function shortAddress(formatted: string | undefined) {
  if (!formatted) return "";
  return formatted
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
}

export function areaLocation(neighborhood: Neighborhood): UserLocation {
  return {
    coordinates: neighborhood.coordinates,
    label: neighborhood.name,
    area: neighborhood.area,
    source: "area",
    capturedAt: new Date().toISOString(),
  };
}

export function isUsableLocation(value: unknown): value is UserLocation {
  if (!value || typeof value !== "object") return false;
  return isCoordinates((value as UserLocation).coordinates);
}

/** One-line description of where nearby results are being measured from. */
export function locationSummary(location: UserLocation | null): string {
  if (!location) return "No location set";
  if (location.source !== "gps") return location.area ? `${location.label}, ${location.area}` : location.label;
  const accuracy = formatAccuracy(location.accuracyM);
  return accuracy ? `${location.label} · GPS ${accuracy}` : `${location.label} · GPS`;
}
