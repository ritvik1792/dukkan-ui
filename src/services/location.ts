import { reverseGeocode, type ReverseGeocode } from "@/lib/api";
import { AREA_LABEL_MAX_KM } from "@/lib/constants";
import { distanceKm, isCoordinates, nearestByDistance } from "@/lib/geo";
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
  const locality = clean(resolved.suburb);
  const city = clean(resolved.city);
  const state = clean(resolved.state);
  const postcode = clean(resolved.postcode);
  const label = locality || city || state || shortAddress(resolved.formattedAddress) || location.label;
  const area = areaBeside(label, city, state) || location.area;
  return { ...location, label, area, postcode: postcode || location.postcode };
}

export async function resolveGpsLocation(
  fix: GeoFix,
  neighborhoods: Neighborhood[],
): Promise<UserLocation> {
  const fallback = gpsLocation(fix, neighborhoods);
  try {
    const resolved = await lookupPlace(fix.coordinates.lat, fix.coordinates.lng);
    return applyResolvedAddress(fallback, resolved);
  } catch {
    return fallback;
  }
}

/** Dukkan reverse geocode first, then a public lookup so a name still lands when the API is down. */
async function lookupPlace(lat: number, lng: number): Promise<ReverseGeocode> {
  try {
    const resolved = await reverseGeocode(lat, lng);
    if (clean(resolved.suburb) || clean(resolved.city)) return resolved;
    if (clean(resolved.postcode)) {
      const fromPin = await lookupPincode(resolved.postcode!);
      if (fromPin?.locality || fromPin?.city) {
        return {
          ...resolved,
          suburb: fromPin.locality || resolved.suburb,
          city: fromPin.city || resolved.city,
          state: fromPin.state || resolved.state,
        };
      }
      return resolved;
    }
  } catch {
    /* backend geocoder unavailable */
  }
  const fromMap = await reverseGeocodePublic(lat, lng);
  if (clean(fromMap.suburb) || !clean(fromMap.postcode)) return fromMap;
  const fromPin = await lookupPincode(fromMap.postcode!);
  if (!fromPin) return fromMap;
  return {
    ...fromMap,
    suburb: fromPin.locality || fromMap.suburb,
    city: fromPin.city || fromMap.city,
    state: fromPin.state || fromMap.state,
    postcode: fromMap.postcode,
  };
}

async function reverseGeocodePublic(lat: number, lng: number): Promise<ReverseGeocode> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
    addressdetails: "1",
    zoom: "18",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Address lookup failed");
  const raw = (await res.json()) as {
    display_name?: string;
    address?: Record<string, string | undefined>;
    error?: string;
  };
  if (raw.error) throw new Error(raw.error);
  const address = raw.address ?? {};
  const suburb = firstText(
    address.suburb,
    address.neighbourhood,
    address.neighborhood,
    address.quarter,
    address.city_district,
  );
  const city = firstText(address.city, address.town, address.village, address.municipality);
  return {
    formattedAddress: raw.display_name ?? "",
    houseNumber: address.house_number ?? null,
    road: address.road ?? null,
    suburb,
    city,
    state: address.state ?? null,
    postcode: address.postcode ?? null,
    country: address.country ?? null,
    lat,
    lng,
    displayName: raw.display_name ?? null,
  };
}

async function lookupPincode(postcode: string): Promise<{
  locality?: string;
  city?: string;
  state?: string;
} | null> {
  const res = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(postcode)}`);
  if (!res.ok) return null;
  const body = (await res.json()) as Array<{
    Status?: string;
    PostOffice?: Array<{ Name?: string; District?: string; Block?: string; State?: string }>;
  }>;
  const offices = body?.[0]?.Status === "Success" ? (body[0].PostOffice ?? []) : [];
  if (offices.length === 0) return null;
  const named = offices.find((office) => isPlaceName(office.Name));
  const district = clean(offices[0]?.District);
  const block = clean(offices[0]?.Block);
  const locality = offices.length === 1 ? clean(named?.Name) : clean(block) || undefined;
  return {
    locality: locality && locality !== district ? locality : undefined,
    city: district,
    state: clean(offices[0]?.State),
  };
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

/** Short place name for chips: locality plus city, never coordinates. */
export function placeTitle(location: UserLocation): string {
  if (location.area && location.area !== location.label && !location.label.includes(location.area)) {
    return `${location.label}, ${location.area}`;
  }
  return location.label;
}

/** One-line description of where nearby results are being measured from. */
export function locationSummary(location: UserLocation | null): string {
  if (!location) return "No location set";
  const title = placeTitle(location);
  if (location.postcode && !title.includes(location.postcode)) return `${title} · ${location.postcode}`;
  return title;
}

function areaBeside(label: string, city?: string, state?: string) {
  if (city && city !== label && !label.includes(city)) return city;
  if (state && state !== label && state !== city && !label.includes(state)) return state;
  return undefined;
}

function clean(value: string | null | undefined) {
  const text = value?.trim();
  return text ? text : undefined;
}

function firstText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return null;
}

function isPlaceName(value: string | null | undefined) {
  const text = clean(value);
  if (!text) return false;
  return !/university|commission|hospital|school|college/i.test(text);
}
