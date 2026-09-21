import type { Coordinates } from "./types";

export function distanceKm(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function nearestByDistance<T extends { coordinates: Coordinates }>(
  origin: Coordinates,
  items: T[],
): T | undefined {
  let best: T | undefined;
  let bestKm = Infinity;
  for (const item of items) {
    const km = distanceKm(origin, item.coordinates);
    if (km < bestKm) {
      best = item;
      bestKm = km;
    }
  }
  return best;
}

export function isCoordinates(value: unknown): value is Coordinates {
  if (!value || typeof value !== "object") return false;
  const { lat, lng } = value as Partial<Coordinates>;
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

/** ~1 m precision. Keeps stored fixes small and avoids logging a needlessly exact position. */
export function roundCoordinates(coordinates: Coordinates): Coordinates {
  return {
    lat: Number(coordinates.lat.toFixed(5)),
    lng: Number(coordinates.lng.toFixed(5)),
  };
}

export function formatCoordinates(coordinates: Coordinates): string {
  return `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`;
}

export function formatAccuracy(accuracyM?: number): string {
  if (!accuracyM || !Number.isFinite(accuracyM)) return "";
  if (accuracyM >= 1000) return `±${(accuracyM / 1000).toFixed(1)} km`;
  return `±${Math.round(accuracyM)} m`;
}
