import type {
  Advertisement,
  ApprovalStatus,
  CatalogProduct,
  Listing,
  PlatformSettings,
  ProductTag,
  Role,
  Shop,
  ShopStatus,
  TagKind,
  User,
} from "@/lib/types";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
).replace(/\/$/, "");

export const API_TOKEN_KEY = "dukkan-api-token";

export type HealthResponse = {
  status: string;
  service: string;
  database?: string;
  shopCount?: number;
};

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  shopId?: string | null;
};

export type AuthResponse = {
  token: string;
  user: ApiUser;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(API_TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(API_TOKEN_KEY, token);
  else window.localStorage.removeItem(API_TOKEN_KEY);
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { message?: string; error?: string };
      detail = body.message || body.error || detail;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function fetchHealth() {
  return apiFetch<HealthResponse>("/api/health");
}

export function fetchShops() {
  return apiFetch<RawShop[]>("/api/shops");
}

export function fetchCatalog() {
  return apiFetch<RawCatalogProduct[]>("/api/catalog");
}

export function fetchListings() {
  return apiFetch<RawListing[]>("/api/listings");
}

export function fetchAds() {
  return apiFetch<Advertisement[]>("/api/ads");
}

export function fetchSettings() {
  return apiFetch<PlatformSettings>("/api/settings");
}

export function loginRequest(email: string, password: string) {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signupRequest(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}) {
  return apiFetch<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type RawShop = {
  id: string;
  name: string;
  ownerUserId: string;
  description?: string | null;
  address: string;
  lat: number;
  lng: number;
  rating: number | string;
  reviewCount?: number;
  reviews?: number;
  verified: boolean;
  gstin?: string | null;
  yearStarted?: number | null;
  status: string;
  partnerDeliveryEnabled: boolean;
  shopDeliveryEnabled: boolean;
  partnerDeliveryFee: number | string;
  shopDeliveryFee: number | string;
  minOrderAmount: number | string;
  categoryIds?: string[];
};

export type RawCatalogProduct = {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  description?: string | null;
  unit: string;
  imageLabel: string;
  imageHue: number;
};

type RawListingTag = {
  id: string;
  label: string;
  kind: string;
  code?: string | null;
  discountPercent?: number | null;
};

export type RawListing = {
  id: string;
  catalogProductId: string;
  shopId: string;
  basePrice: number | string;
  sellerPrice: number | string;
  stock: number;
  moq: number;
  color?: string | null;
  quality?: string | null;
  status: string;
  tags?: RawListingTag[];
};

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function asEnum<T extends string>(value: unknown, fallback: T): T {
  return (typeof value === "string" ? value.toLowerCase() : fallback) as T;
}

export function mapShop(raw: RawShop): Shop {
  return {
    id: raw.id,
    name: raw.name,
    ownerUserId: raw.ownerUserId,
    categoryIds: raw.categoryIds ?? [],
    description: raw.description ?? "",
    address: raw.address,
    coordinates: { lat: asNumber(raw.lat), lng: asNumber(raw.lng) },
    rating: asNumber(raw.rating),
    reviews: asNumber(raw.reviewCount ?? raw.reviews),
    verified: Boolean(raw.verified),
    gstin: raw.gstin ?? undefined,
    yearStarted: raw.yearStarted ?? 0,
    status: asEnum<ShopStatus>(raw.status, "active"),
    partnerDeliveryEnabled: Boolean(raw.partnerDeliveryEnabled),
    shopDeliveryEnabled: Boolean(raw.shopDeliveryEnabled),
    partnerDeliveryFee: asNumber(raw.partnerDeliveryFee),
    shopDeliveryFee: asNumber(raw.shopDeliveryFee),
    minOrderAmount: asNumber(raw.minOrderAmount),
  };
}

export function mapCatalogProduct(raw: RawCatalogProduct): CatalogProduct {
  return {
    id: raw.id,
    name: raw.name,
    brand: raw.brand,
    categoryId: raw.categoryId,
    description: raw.description ?? "",
    unit: raw.unit,
    imageLabel: raw.imageLabel,
    imageHue: raw.imageHue,
  };
}

export function mapListing(raw: RawListing): Listing {
  return {
    id: raw.id,
    catalogProductId: raw.catalogProductId,
    shopId: raw.shopId,
    basePrice: asNumber(raw.basePrice),
    sellerPrice: asNumber(raw.sellerPrice),
    stock: raw.stock,
    moq: raw.moq,
    color: raw.color ?? undefined,
    quality: raw.quality ?? undefined,
    status: asEnum<ApprovalStatus>(raw.status, "approved"),
    tags: (raw.tags ?? []).map(
      (tag): ProductTag => ({
        id: tag.id,
        label: tag.label,
        kind: asEnum<TagKind>(tag.kind, "badge"),
        code: tag.code ?? undefined,
        discountPercent: tag.discountPercent ?? undefined,
      }),
    ),
  };
}

export function mapApiUser(raw: ApiUser, extras?: Partial<User>): User {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    password: extras?.password ?? "",
    role: asEnum<Role>(raw.role, "buyer"),
    shopId: raw.shopId ?? undefined,
    phone: raw.phone ?? extras?.phone,
    dob: extras?.dob,
    pinCode: extras?.pinCode,
    shopRadiusKm: extras?.shopRadiusKm,
  };
}

export type StorefrontPayload = {
  health: HealthResponse;
  shops: Shop[];
  catalog: CatalogProduct[];
  listings: Listing[];
  advertisements: Advertisement[];
  settings: PlatformSettings;
};

export async function loadStorefront(): Promise<StorefrontPayload> {
  const [health, shops, catalog, listings, advertisements, settings] =
    await Promise.all([
      fetchHealth(),
      fetchShops(),
      fetchCatalog(),
      fetchListings(),
      fetchAds(),
      fetchSettings(),
    ]);
  return {
    health,
    shops: shops.map(mapShop),
    catalog: catalog.map(mapCatalogProduct),
    listings: listings.map(mapListing),
    advertisements,
    settings,
  };
}
