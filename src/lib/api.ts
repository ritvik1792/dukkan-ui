import type {
  Advertisement,
  ApplicationStatus,
  ApprovalStatus,
  CatalogProduct,
  Category,
  Coupon,
  DeliveryMode,
  Listing,
  Neighborhood,
  Order,
  OrderStatus,
  Partner,
  PaymentMethod,
  PaymentStatus,
  PlatformSettings,
  ProductTag,
  ProductRequest,
  AvailabilityOffer,
  Review,
  Role,
  SellerApplication,
  Shop,
  ShopEmployee,
  ShopEmployeeRole,
  ShopStatus,
  ShopTransport,
  ShopTransportKind,
  TagKind,
  Ticket,
  TicketKind,
  TicketMessage,
  TicketStatus,
  User,
} from "@/lib/types";
import { mergeShopOps } from "@/lib/shopOps";

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
  dob?: string | null;
  pinCode?: string | null;
  shopRadiusKm?: number | null;
};

export type AuthResponse = {
  token: string;
  user: ApiUser;
};

export type OtpRequestResponse = {
  destination: string;
  purpose: string;
  expiresAt: string;
  devCode?: string | null;
};

export type UploadResponse = {
  url: string;
  filename: string;
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

export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return url;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body && !isForm && !headers.has("Content-Type")) {
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

export type ReverseGeocode = {
  formattedAddress: string;
  houseNumber?: string | null;
  road?: string | null;
  suburb?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  country?: string | null;
  lat: number;
  lng: number;
  displayName?: string | null;
};

const reverseInflight = new Map<string, Promise<ReverseGeocode>>();
const reverseMemory = new Map<string, { value: ReverseGeocode; at: number }>();
const REVERSE_MEMORY_MS = 5 * 60_000;

export function reverseGeocodeKey(lat: number, lng: number) {
  return `${Number(lat.toFixed(5))},${Number(lng.toFixed(5))}`;
}

/** Resolves lat/lng through the Dukkan backend (Nominatim). Dedupes in-flight and recent lookups. */
export function reverseGeocode(lat: number, lng: number) {
  const key = reverseGeocodeKey(lat, lng);
  const cached = reverseMemory.get(key);
  if (cached && Date.now() - cached.at < REVERSE_MEMORY_MS) {
    return Promise.resolve(cached.value);
  }
  const pending = reverseInflight.get(key);
  if (pending) return pending;

  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  const request = apiFetch<ReverseGeocode>(`/api/geo/reverse?${params}`)
    .then((value) => {
      reverseMemory.set(key, { value, at: Date.now() });
      return value;
    })
    .finally(() => {
      reverseInflight.delete(key);
    });
  reverseInflight.set(key, request);
  return request;
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

export function fetchCategories() {
  return apiFetch<Category[]>("/api/categories");
}

export function fetchNeighborhoods() {
  return apiFetch<RawNeighborhood[]>("/api/neighborhoods");
}

export function fetchPartners() {
  return apiFetch<Partner[]>("/api/partners");
}

export function fetchSellerPartners(shopId?: string) {
  const params = new URLSearchParams();
  if (shopId) params.set("shopId", shopId);
  const suffix = params.size ? `?${params}` : "";
  return apiFetch<Partner[]>(`/api/seller/partners${suffix}`);
}

export function fetchAdminPartners(shopId?: string) {
  const params = new URLSearchParams();
  if (shopId) params.set("shopId", shopId);
  const suffix = params.size ? `?${params}` : "";
  return apiFetch<Partner[]>(`/api/admin/partners${suffix}`);
}

export type DeliveryOrderRow = {
  id: string;
  status: string;
  deliveryMode: string;
  partnerId?: string | null;
  address: string;
  createdAt: string;
  deliverBy?: string | null;
};

export type DeliverySnapshot = {
  shop: RawShop;
  partners: Partner[];
  pool: Partner[];
  activeOrders: DeliveryOrderRow[];
};

export function fetchSellerDelivery(shopId?: string) {
  const params = new URLSearchParams();
  if (shopId) params.set("shopId", shopId);
  const suffix = params.size ? `?${params}` : "";
  return apiFetch<DeliverySnapshot>(`/api/seller/delivery${suffix}`);
}

export function fetchAdminDelivery(shopId: string) {
  const params = new URLSearchParams({ shopId });
  return apiFetch<DeliverySnapshot>(`/api/admin/delivery?${params}`);
}

export function fetchSellerPartnerPool(shopId?: string) {
  const params = new URLSearchParams();
  if (shopId) params.set("shopId", shopId);
  const suffix = params.size ? `?${params}` : "";
  return apiFetch<Partner[]>(`/api/seller/partners/pool${suffix}`);
}

export function createSellerPartner(
  input: { name: string; phone: string; vehicle?: string; available?: boolean },
  shopId?: string,
) {
  const suffix = shopId ? `?shopId=${encodeURIComponent(shopId)}` : "";
  return apiFetch<Partner>(`/api/seller/partners${suffix}`, {
    method: "POST",
    body: JSON.stringify({ ...input, shopId }),
  });
}

export function assignSellerPartner(partnerId: string, shopId?: string) {
  const suffix = shopId ? `?shopId=${encodeURIComponent(shopId)}` : "";
  return apiFetch<Partner>(`/api/seller/partners/${partnerId}/assign${suffix}`, {
    method: "POST",
  });
}

export function patchSellerPartner(
  partnerId: string,
  input: { available?: boolean; name?: string; phone?: string; vehicle?: string },
  shopId?: string,
) {
  const suffix = shopId ? `?shopId=${encodeURIComponent(shopId)}` : "";
  return apiFetch<Partner>(`/api/seller/partners/${partnerId}${suffix}`, {
    method: "PATCH",
    body: JSON.stringify({ ...input, shopId }),
  });
}

export function unassignSellerPartner(partnerId: string, shopId?: string) {
  const suffix = shopId ? `?shopId=${encodeURIComponent(shopId)}` : "";
  return apiFetch<void>(`/api/seller/partners/${partnerId}${suffix}`, { method: "DELETE" });
}

export function patchShopRequest(
  shopId: string,
  input: {
    partnerDeliveryEnabled?: boolean;
    shopDeliveryEnabled?: boolean;
    partnerDeliveryFee?: number;
    shopDeliveryFee?: number;
    minOrderAmount?: number;
    isOpen?: boolean;
    openTime?: string;
    closeTime?: string;
    status?: ShopStatus;
    notificationsEnabled?: boolean;
    notifyOrderReceived?: boolean;
    notifyOrderStatus?: boolean;
    notifyStockConfirmation?: boolean;
  },
) {
  return apiFetch<RawShop>(`/api/shops/${shopId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function createShopEmployee(
  shopId: string,
  input: { name: string; role?: ShopEmployeeRole; phone?: string; available?: boolean },
) {
  return apiFetch<RawShopEmployee>("/api/seller/employees", {
    method: "POST",
    body: JSON.stringify({ ...input, shopId }),
  });
}

export function patchShopEmployee(
  id: string,
  input: { name?: string; role?: ShopEmployeeRole; phone?: string; available?: boolean },
) {
  return apiFetch<RawShopEmployee>(`/api/seller/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteShopEmployee(id: string) {
  return apiFetch<void>(`/api/seller/employees/${id}`, { method: "DELETE" });
}

export function createShopTransport(
  shopId: string,
  input: {
    kind?: ShopTransportKind;
    label?: string;
    registration?: string;
    capacityKg?: number;
    available?: boolean;
  },
) {
  return apiFetch<RawShopTransport>("/api/seller/transport", {
    method: "POST",
    body: JSON.stringify({ ...input, shopId }),
  });
}

export function patchShopTransport(
  id: string,
  input: {
    kind?: ShopTransportKind;
    label?: string;
    registration?: string;
    capacityKg?: number;
    available?: boolean;
  },
) {
  return apiFetch<RawShopTransport>(`/api/seller/transport/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteShopTransport(id: string) {
  return apiFetch<void>(`/api/seller/transport/${id}`, { method: "DELETE" });
}

export function patchSettingsRequest(input: {
  deliveryRadiusKm?: number;
  partnerEtaMinutes?: number;
  showDemoRoleSwitcher?: boolean;
  requestResponseWindowSeconds?: number;
  requestWaveSize?: number;
  requestMaxShops?: number;
  offerExpirySeconds?: number;
  requestMaxWaves?: number;
}) {
  return apiFetch<PlatformSettings>("/api/settings", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function fetchReviews(query?: { catalogProductId?: string; shopId?: string }) {
  const params = new URLSearchParams();
  if (query?.catalogProductId) params.set("catalogProductId", query.catalogProductId);
  if (query?.shopId) params.set("shopId", query.shopId);
  const suffix = params.size ? `?${params}` : "";
  return apiFetch<RawReview[]>(`/api/reviews${suffix}`);
}

export function fetchOrders() {
  return apiFetch<RawOrder[]>("/api/orders");
}

export function fetchTickets() {
  return apiFetch<RawTicket[]>("/api/tickets");
}

export function fetchApplications() {
  return apiFetch<RawApplication[]>("/api/applications");
}

export function fetchCoupons(shopId?: string) {
  const suffix = shopId ? `?shopId=${encodeURIComponent(shopId)}` : "";
  return apiFetch<Coupon[]>(`/api/coupons${suffix}`);
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

export function requestOtp(input: { phone?: string; email?: string; purpose?: string }) {
  return apiFetch<OtpRequestResponse>("/api/auth/otp/request", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function verifyOtp(input: { phone?: string; email?: string; code: string; purpose?: string }) {
  return apiFetch<AuthResponse>("/api/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProfileRequest(input: {
  name?: string;
  email?: string;
  phone?: string;
  dob?: string;
  pinCode?: string;
  shopRadiusKm?: number;
}) {
  return apiFetch<ApiUser>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function uploadImage(file: File) {
  const body = new FormData();
  body.append("file", file);
  return apiFetch<UploadResponse>("/api/uploads", { method: "POST", body });
}

export function placeOrderRequest(input: {
  items: { listingId: string; quantity: number; deliveryMode: DeliveryMode }[];
  address: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentRefId?: string;
  discount?: number;
  couponCode?: string;
  requestId?: string;
  offerId?: string;
}) {
  return apiFetch<RawOrder>("/api/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type RawProductRequest = {
  id: string;
  buyerId: string;
  catalogProductId: string;
  listingId?: string | null;
  queryText?: string | null;
  buyerLat: number;
  buyerLng: number;
  status: string;
  waveIndex: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

export type RawOffer = {
  id: string;
  requestId: string;
  requestShopId: string;
  shopId: string;
  listingId?: string | null;
  unitPrice: number | string;
  availableQty: number;
  message?: string | null;
  status: string;
  createdAt: string;
  expiresAt: string;
};

export type ProductRequestDetail = {
  request: ProductRequest;
  shops: unknown[];
  notifiedCount?: number;
};

export function createProductRequest(input: {
  catalogProductId: string;
  listingId?: string;
  queryText?: string;
  buyerLat: number;
  buyerLng: number;
}) {
  return apiFetch<{ request: RawProductRequest; shops: unknown[]; notifiedCount?: number }>(
    "/api/product-requests",
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function fetchProductRequest(id: string) {
  return apiFetch<{ request: RawProductRequest; shops: unknown[]; notifiedCount?: number }>(
    `/api/product-requests/${id}`,
  );
}

export function fetchProductRequestOffers(id: string) {
  return apiFetch<RawOffer[]>(`/api/product-requests/${id}/offers`);
}

export function cancelProductRequest(id: string) {
  return apiFetch<{ request: RawProductRequest }>(`/api/product-requests/${id}/cancel`, {
    method: "POST",
  });
}

export function selectOfferRequest(offerId: string) {
  return apiFetch<RawOffer>(`/api/offers/${offerId}/select`, { method: "POST" });
}

export function fetchMerchantRequests() {
  return apiFetch<
    {
      request: RawProductRequest;
      requestShop: {
        id: string;
        requestId: string;
        shopId: string;
        listingId?: string | null;
        status: string;
        notifiedAt?: string | null;
        distanceKm?: number | string | null;
      };
      shopId: string;
    }[]
  >("/api/merchant/requests");
}

export function fetchMerchantRequest(id: string) {
  return apiFetch<{
    request: RawProductRequest;
    requestShop: {
      id: string;
      requestId: string;
      shopId: string;
      listingId?: string | null;
      status: string;
    };
    offers: RawOffer[];
  }>(`/api/merchant/requests/${id}`);
}

export function respondMerchantRequest(
  id: string,
  input: {
    decision: "ACCEPTED" | "REJECTED";
    unitPrice?: number;
    availableQty?: number;
    listingId?: string;
    message?: string;
  },
) {
  return apiFetch<{ requestId: string; offer: RawOffer | null; declined: boolean }>(
    `/api/merchant/requests/${id}/respond`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function mapProductRequest(raw: RawProductRequest): ProductRequest {
  return {
    id: raw.id,
    buyerId: raw.buyerId,
    catalogProductId: raw.catalogProductId,
    listingId: raw.listingId ?? undefined,
    queryText: raw.queryText ?? undefined,
    buyerLat: asNumber(raw.buyerLat),
    buyerLng: asNumber(raw.buyerLng),
    status: raw.status as ProductRequest["status"],
    waveIndex: raw.waveIndex,
    createdAt: asIso(raw.createdAt),
    updatedAt: asIso(raw.updatedAt),
    expiresAt: asIso(raw.expiresAt),
  };
}

export function mapOffer(raw: RawOffer): AvailabilityOffer {
  return {
    id: raw.id,
    requestId: raw.requestId,
    requestShopId: raw.requestShopId,
    shopId: raw.shopId,
    listingId: raw.listingId ?? undefined,
    unitPrice: asNumber(raw.unitPrice),
    availableQty: raw.availableQty,
    message: raw.message ?? undefined,
    status: raw.status as AvailabilityOffer["status"],
    createdAt: asIso(raw.createdAt),
    expiresAt: asIso(raw.expiresAt),
  };
}

export function patchOrderRequest(
  id: string,
  input: {
    status?: OrderStatus;
    partnerId?: string;
    packingBy?: string;
    readyBy?: string;
    deliverBy?: string;
  },
) {
  return apiFetch<RawOrder>(`/api/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function createTicketRequest(input: {
  kind: TicketKind;
  subject: string;
  shopId?: string;
  orderId?: string;
  listingId?: string;
  body?: string;
  imageUrls?: string[];
}) {
  return apiFetch<RawTicket>("/api/tickets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function addTicketMessageRequest(
  ticketId: string,
  input: { body?: string; imageUrls?: string[] },
) {
  return apiFetch<RawTicket>(`/api/tickets/${ticketId}/messages`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function patchTicketRequest(
  ticketId: string,
  input: { status?: TicketStatus; assignedToUserId?: string; hidden?: boolean },
) {
  return apiFetch<RawTicket>(`/api/tickets/${ticketId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function createReviewRequest(input: {
  catalogProductId: string;
  listingId?: string;
  shopId: string;
  orderId?: string;
  rating: number;
  title?: string;
  body: string;
  imageUrls?: string[];
}) {
  return apiFetch<RawReview>("/api/reviews", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function replyReviewRequest(reviewId: string, body: string) {
  return apiFetch<RawReview>(`/api/reviews/${reviewId}/reply`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function patchReviewRequest(reviewId: string, input: { hidden?: boolean; imageUrls?: string[] }) {
  return apiFetch<RawReview>(`/api/reviews/${reviewId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function createApplicationRequest(input: {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  gstin?: string;
  categoryIds: string[];
  notes?: string;
  partnerDeliveryEnabled?: boolean;
  shopDeliveryEnabled?: boolean;
  lat?: number;
  lng?: number;
}) {
  return apiFetch<{ application: RawApplication; shop: RawShop }>("/api/applications", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function patchApplicationRequest(id: string, status: ApplicationStatus) {
  return apiFetch<RawApplication>(`/api/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function upsertCatalogRequest(
  input: {
    name: string;
    brand: string;
    categoryId: string;
    description?: string;
    unit: string;
    imageLabel?: string;
    imageHue?: number;
    imageUrl?: string;
    galleryUrls?: string[];
  },
  id?: string,
) {
  return apiFetch<RawCatalogProduct>(id ? `/api/catalog/${id}` : "/api/catalog", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(input),
  });
}

export function upsertListingRequest(
  input: {
    catalogProductId?: string;
    shopId?: string;
    basePrice: number;
    sellerPrice: number;
    stock: number;
    moq: number;
    color?: string;
    quality?: string;
    warranty?: string;
    status?: ApprovalStatus;
    tags?: ProductTag[];
  },
  id?: string,
) {
  return apiFetch<RawListing>(id ? `/api/listings/${id}` : "/api/listings", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(input),
  });
}

export function deleteListingRequest(id: string) {
  return apiFetch<void>(`/api/listings/${id}`, { method: "DELETE" });
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
  imageUrl?: string | null;
  employees?: RawShopEmployee[] | null;
  transport?: RawShopTransport[] | null;
  isOpen?: boolean | null;
  openTime?: string | null;
  closeTime?: string | null;
  notificationsEnabled?: boolean | null;
  notifyOrderReceived?: boolean | null;
  notifyOrderStatus?: boolean | null;
  notifyStockConfirmation?: boolean | null;
};

type RawShopEmployee = {
  id: string;
  name: string;
  role?: string | null;
  phone?: string | null;
  available?: boolean | null;
};

type RawShopTransport = {
  id: string;
  kind?: string | null;
  label?: string | null;
  registration?: string | null;
  capacityKg?: number | string | null;
  available?: boolean | null;
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
  imageUrl?: string | null;
  galleryUrls?: string[] | null;
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
  warranty?: string | null;
  status: string;
  tags?: RawListingTag[];
  availabilityConfirmedAt?: string | null;
};

export type RawNeighborhood = {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
};

export type RawReview = {
  id: string;
  catalogProductId: string;
  listingId?: string | null;
  shopId: string;
  buyerId: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  orderId?: string | null;
  hidden?: boolean;
  imageUrls?: string[] | null;
  sellerReply?: { body: string; createdAt: string } | string | null;
  sellerRepliedAt?: string | null;
};

export type RawTicketMessage = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  imageUrls?: string[] | null;
};

export type RawTicket = {
  id: string;
  kind: string;
  status: string;
  subject: string;
  buyerId?: string | null;
  shopId?: string | null;
  orderId?: string | null;
  listingId?: string | null;
  assignedToUserId?: string | null;
  createdAt: string;
  hidden?: boolean;
  messages?: RawTicketMessage[];
};

export type RawOrderItem = {
  listingId: string;
  catalogProductId: string;
  quantity: number;
  unitPrice: number | string;
  deliveryMode: string;
  deliveryFee: number | string;
  warranty?: string | null;
};

export type RawOrder = {
  id: string;
  buyerId: string;
  shopId: string;
  items?: RawOrderItem[];
  deliveryMode: string;
  status: string;
  subtotal: number | string;
  deliveryFee: number | string;
  total: number | string;
  createdAt: string;
  address: string;
  partnerId?: string | null;
  packingBy?: string | null;
  readyBy?: string | null;
  deliverBy?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  paymentRefId?: string | null;
  discount?: number | string | null;
  couponCode?: string | null;
  timeline?: { status: string; at: string }[];
  requestId?: string | null;
  offerId?: string | null;
};

export type RawApplication = {
  id: string;
  userId: string;
  shopId: string;
  status: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  gstin?: string | null;
  categoryIds?: string[];
  notes?: string | null;
  submittedAt: string;
};

export function asNumber(value: unknown, fallback = 0): number {
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

function asIso(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
}

export function mapShop(raw: RawShop): Shop {
  return mergeShopOps({
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
    imageUrl: resolveMediaUrl(raw.imageUrl),
    employees: (raw.employees ?? []).map(mapShopEmployee),
    transport: (raw.transport ?? []).map(mapShopTransport),
    isOpen: raw.isOpen ?? true,
    openTime: raw.openTime ?? undefined,
    closeTime: raw.closeTime ?? undefined,
    notificationsEnabled: raw.notificationsEnabled ?? true,
    notifyOrderReceived: raw.notifyOrderReceived ?? true,
    notifyOrderStatus: raw.notifyOrderStatus ?? true,
    notifyStockConfirmation: raw.notifyStockConfirmation ?? true,
  });
}

function mapShopEmployee(raw: RawShopEmployee): ShopEmployee {
  return {
    id: raw.id,
    name: raw.name,
    role: asEnum<ShopEmployeeRole>(raw.role, "rider"),
    phone: raw.phone ?? "",
    available: raw.available !== false,
  };
}

function mapShopTransport(raw: RawShopTransport): ShopTransport {
  return {
    id: raw.id,
    kind: asEnum<ShopTransportKind>(raw.kind, "bike"),
    label: raw.label?.trim() || titleCaseKind(raw.kind),
    registration: raw.registration ?? undefined,
    capacityKg: raw.capacityKg == null || raw.capacityKg === "" ? undefined : asNumber(raw.capacityKg),
    available: raw.available !== false,
  };
}

function titleCaseKind(kind?: string | null) {
  if (!kind) return "Vehicle";
  return kind.replaceAll("_", " ");
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
    imageUrl: resolveMediaUrl(raw.imageUrl),
    galleryUrls: (raw.galleryUrls ?? []).map((url) => resolveMediaUrl(url) ?? url),
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
    warranty: raw.warranty ?? undefined,
    status: asEnum<ApprovalStatus>(raw.status, "approved"),
    availabilityConfirmedAt: raw.availabilityConfirmedAt
      ? asIso(raw.availabilityConfirmedAt)
      : undefined,
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

export function mapNeighborhood(raw: RawNeighborhood): Neighborhood {
  return {
    id: raw.id,
    name: raw.name,
    area: raw.area,
    coordinates: { lat: asNumber(raw.lat), lng: asNumber(raw.lng) },
  };
}

export function mapReview(raw: RawReview): Review {
  const reply =
    raw.sellerReply && typeof raw.sellerReply === "object"
      ? { body: raw.sellerReply.body, createdAt: asIso(raw.sellerReply.createdAt) }
      : typeof raw.sellerReply === "string" && raw.sellerReply
        ? { body: raw.sellerReply, createdAt: asIso(raw.sellerRepliedAt ?? raw.createdAt) }
        : undefined;
  return {
    id: raw.id,
    catalogProductId: raw.catalogProductId,
    listingId: raw.listingId ?? undefined,
    shopId: raw.shopId,
    buyerId: raw.buyerId,
    rating: raw.rating,
    title: raw.title,
    body: raw.body,
    createdAt: asIso(raw.createdAt),
    orderId: raw.orderId ?? undefined,
    hidden: Boolean(raw.hidden),
    imageUrls: (raw.imageUrls ?? []).map((url) => resolveMediaUrl(url) ?? url),
    sellerReply: reply,
  };
}

export function mapTicket(raw: RawTicket): Ticket {
  return {
    id: raw.id,
    kind: asEnum<TicketKind>(raw.kind, "support"),
    status: asEnum<TicketStatus>(raw.status, "open"),
    subject: raw.subject,
    buyerId: raw.buyerId ?? undefined,
    shopId: raw.shopId ?? undefined,
    orderId: raw.orderId ?? undefined,
    listingId: raw.listingId ?? undefined,
    assignedToUserId: raw.assignedToUserId ?? undefined,
    createdAt: asIso(raw.createdAt),
    hidden: Boolean(raw.hidden),
    messages: (raw.messages ?? []).map(
      (message): TicketMessage => ({
        id: message.id,
        authorId: message.authorId,
        body: message.body,
        createdAt: asIso(message.createdAt),
        imageUrls: message.imageUrls?.length
          ? message.imageUrls.map((url) => resolveMediaUrl(url) ?? url)
          : undefined,
      }),
    ),
  };
}

export function mapOrder(raw: RawOrder): Order {
  return {
    id: raw.id,
    buyerId: raw.buyerId,
    shopId: raw.shopId,
    items: (raw.items ?? []).map((item) => ({
      listingId: item.listingId,
      catalogProductId: item.catalogProductId,
      quantity: item.quantity,
      unitPrice: asNumber(item.unitPrice),
      deliveryMode: asEnum<DeliveryMode>(item.deliveryMode, "partner"),
      deliveryFee: asNumber(item.deliveryFee),
      warranty: item.warranty ?? undefined,
    })),
    deliveryMode: asEnum<DeliveryMode>(raw.deliveryMode, "partner"),
    status: asEnum<OrderStatus>(raw.status, "placed"),
    subtotal: asNumber(raw.subtotal),
    deliveryFee: asNumber(raw.deliveryFee),
    total: asNumber(raw.total),
    createdAt: asIso(raw.createdAt),
    address: raw.address,
    partnerId: raw.partnerId ?? undefined,
    packingBy: raw.packingBy ?? undefined,
    readyBy: raw.readyBy ?? undefined,
    deliverBy: raw.deliverBy ?? undefined,
    paymentMethod: raw.paymentMethod
      ? asEnum<PaymentMethod>(raw.paymentMethod, "cod")
      : undefined,
    paymentStatus: raw.paymentStatus
      ? asEnum<PaymentStatus>(raw.paymentStatus, "paid")
      : undefined,
    paymentRefId: raw.paymentRefId ?? undefined,
    discount: raw.discount == null ? undefined : asNumber(raw.discount),
    couponCode: raw.couponCode ?? undefined,
    requestId: raw.requestId ?? undefined,
    offerId: raw.offerId ?? undefined,
    timeline: raw.timeline?.map((event) => ({
      status: asEnum<OrderStatus>(event.status, "placed"),
      at: asIso(event.at),
    })),
  };
}

export function mapApplication(raw: RawApplication): SellerApplication {
  return {
    id: raw.id,
    userId: raw.userId,
    shopId: raw.shopId,
    status: asEnum<ApplicationStatus>(raw.status, "submitted"),
    businessName: raw.businessName,
    ownerName: raw.ownerName,
    email: raw.email,
    phone: raw.phone,
    address: raw.address,
    gstin: raw.gstin ?? "",
    categoryIds: raw.categoryIds ?? [],
    notes: raw.notes ?? "",
    submittedAt: asIso(raw.submittedAt),
  };
}

export function mapApiUser(raw: ApiUser, extras?: Partial<User>): User {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    password: extras?.password ?? "",
    role: asEnum<Role>(raw.role, "buyer"),
    shopId: raw.shopId ?? extras?.shopId,
    phone: raw.phone ?? extras?.phone,
    dob: raw.dob ?? extras?.dob,
    pinCode: raw.pinCode ?? extras?.pinCode,
    shopRadiusKm: raw.shopRadiusKm ?? extras?.shopRadiusKm,
    addresses: extras?.addresses,
    defaultAddressId: extras?.defaultAddressId,
    cards: extras?.cards,
    defaultCardId: extras?.defaultCardId,
    savedUpiId: extras?.savedUpiId,
    preferredPayment: extras?.preferredPayment,
  };
}

export type StorefrontPayload = {
  health: HealthResponse;
  shops: Shop[];
  catalog: CatalogProduct[];
  listings: Listing[];
  advertisements: Advertisement[];
  settings: PlatformSettings;
  categories: Category[];
  neighborhoods: Neighborhood[];
  partners: Partner[];
  reviews: Review[];
  orders?: Order[];
  tickets?: Ticket[];
  applications?: SellerApplication[];
  coupons?: Coupon[];
};

export async function loadStorefront(): Promise<StorefrontPayload> {
  const [health, shops, catalog, listings, advertisements, settings, categories, neighborhoods, partners, reviews] =
    await Promise.all([
      fetchHealth(),
      fetchShops(),
      fetchCatalog(),
      fetchListings(),
      fetchAds(),
      fetchSettings(),
      fetchCategories(),
      fetchNeighborhoods(),
      fetchPartners(),
      fetchReviews(),
    ]);

  const payload: StorefrontPayload = {
    health,
    shops: shops.map(mapShop),
    catalog: catalog.map(mapCatalogProduct),
    listings: listings.map(mapListing),
    advertisements,
    settings,
    categories,
    neighborhoods: neighborhoods.map(mapNeighborhood),
    partners,
    reviews: reviews.map(mapReview),
  };

  if (getToken()) {
    const [orders, tickets, applications, coupons] = await Promise.allSettled([
      fetchOrders(),
      fetchTickets(),
      fetchApplications(),
      fetchCoupons(),
    ]);
    if (orders.status === "fulfilled") payload.orders = orders.value.map(mapOrder);
    if (tickets.status === "fulfilled") payload.tickets = tickets.value.map(mapTicket);
    if (applications.status === "fulfilled") payload.applications = applications.value.map(mapApplication);
    if (coupons.status === "fulfilled") payload.coupons = coupons.value;
  }

  return payload;
}
