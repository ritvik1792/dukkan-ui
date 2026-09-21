export type Role = "buyer" | "seller" | "admin";

export type PaymentMethod =
  | "upi"
  | "card"
  | "cod"
  | "credit_card"
  | "debit_card"
  | "wallet"
  | "net_banking";

export type CouponPayMethod = "credit_card" | "debit_card" | "wallet" | "upi" | "net_banking";

export type DiscountType = "percent" | "flat";

export type TagStatus = "active" | "taken_down";

export type TagOwner = "seller" | "admin";

export type PaymentStatus = "paid" | "cod";

export type SavedAddress = {
  id: string;
  label: string;
  line: string;
  pinCode: string;
  coordinates?: Coordinates;
};

export type CardBrand = "visa" | "mastercard" | "rupay" | "card";

export type SavedCard = {
  id: string;
  brand: CardBrand;
  last4: string;
  expiry: string;
  name: string;
};

export type DeliveryMode = "partner" | "shop";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type ShopStatus = "pending" | "active" | "suspended";

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected";

export type OrderStatus =
  | "placed"
  | "accepted"
  | "packing"
  | "assigned"
  | "ready_for_delivery"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type TicketKind = "complaint" | "support";

export type TagKind = "sale" | "coupon" | "offer" | "badge";

export type Coordinates = {
  lat: number;
  lng: number;
};

/** How a saved location was obtained: device GPS, a preset area, or typed by hand. */
export type LocationSource = "gps" | "area" | "manual";

export type UserLocation = {
  coordinates: Coordinates;
  label: string;
  area?: string;
  source: LocationSource;
  /** GPS accuracy radius in metres, when the browser reports one. */
  accuracyM?: number;
  capturedAt: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  /** Local/offline fallback only. API auth never returns this; login uses PostgreSQL + BCrypt. */
  password?: string;
  role: Role;
  shopId?: string;
  phone?: string;
  dob?: string;
  pinCode?: string;
  shopRadiusKm?: number;
  location?: UserLocation;
  addresses?: SavedAddress[];
  defaultAddressId?: string;
  cards?: SavedCard[];
  defaultCardId?: string;
  savedUpiId?: string;
  preferredPayment?: PaymentMethod;
};

/** A named slot ads can be booked into, with its own rotation settings. */
export type AdPlacement = {
  id: string;
  label: string;
  slug: string;
  description: string;
  /** Seconds each ad stays on screen before the slot rotates. */
  rotationSeconds: number;
  /** How many ads the slot will show before the rest are skipped. */
  maxAds: number;
  active: boolean;
  createdAt: string;
};

export type Advertisement = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  badge: string;
  hue: number;
  catalogProductId?: string;
  active: boolean;
  imageUrl?: string;
  placementId?: string;
  /** Higher weight wins the earlier slots in a rotation. */
  weight?: number;
  startsAt?: string;
  endsAt?: string;
  createdAt?: string;
};

export type PlatformSettings = {
  deliveryRadiusKm: number;
  partnerEtaMinutes: number;
  showDemoRoleSwitcher: boolean;
  requestResponseWindowSeconds: number;
  requestWaveSize: number;
  requestMaxShops: number;
  offerExpirySeconds: number;
  requestMaxWaves: number;
};

export type Category = {
  id: string;
  name: string;
  emoji: string;
};

export type Neighborhood = {
  id: string;
  name: string;
  area: string;
  coordinates: Coordinates;
};

export type ShopEmployeeRole = "rider" | "packer" | "dispatcher" | "manager";

export type ShopEmployee = {
  id: string;
  name: string;
  role: ShopEmployeeRole;
  phone: string;
  available: boolean;
};

export type ShopTransportKind = "bike" | "scooter" | "cycle" | "tempo" | "van" | "truck";

export type ShopTransport = {
  id: string;
  kind: ShopTransportKind;
  label: string;
  registration?: string;
  capacityKg?: number;
  available: boolean;
};

export type Shop = {
  id: string;
  name: string;
  ownerUserId: string;
  categoryIds: string[];
  description: string;
  address: string;
  coordinates: Coordinates;
  rating: number;
  reviews: number;
  verified: boolean;
  gstin?: string;
  yearStarted: number;
  status: ShopStatus;
  partnerDeliveryEnabled: boolean;
  shopDeliveryEnabled: boolean;
  partnerDeliveryFee: number;
  shopDeliveryFee: number;
  minOrderAmount: number;
  imageUrl?: string;
  employees: ShopEmployee[];
  transport: ShopTransport[];
  /** Manual open/closed. Hours still apply when open. */
  isOpen?: boolean;
  openTime?: string;
  closeTime?: string;
  notificationsEnabled?: boolean;
  notifyOrderReceived?: boolean;
  notifyOrderStatus?: boolean;
  notifyStockConfirmation?: boolean;
  alertPrefs?: ShopAlertPrefs;
};

export type ShopSlaStep = "placed" | "packing" | "ready_for_delivery" | "out_for_delivery";

export type ShopSlaPref = {
  enabled: boolean;
  afterMinutes: number;
};

export type ShopAlertPrefs = {
  orders: boolean;
  reviews: boolean;
  complaints: boolean;
  delivered: boolean;
  stockConfirmation: boolean;
  sla: Record<ShopSlaStep, ShopSlaPref>;
};

export type AppNotificationKind = "order" | "review" | "complaint" | "delivered" | "order_sla";

export type AppNotification = {
  id: string;
  userId: string;
  shopId?: string;
  kind: AppNotificationKind;
  title: string;
  message: string;
  orderId?: string;
  reviewId?: string;
  ticketId?: string;
  dedupeKey: string;
  createdAt: string;
  readAt?: string;
};

export type CatalogProduct = {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  description: string;
  unit: string;
  imageLabel: string;
  imageHue: number;
  imageUrl?: string;
  galleryUrls?: string[];
};

export type ProductTag = {
  id: string;
  label: string;
  kind: TagKind;
  code?: string;
  discountPercent?: number;
};

export type SaleRule = {
  minAmount: number;
  discountPercent: number;
  maxDiscount: number;
};

export type CouponCardRule = {
  networks: CardBrand[];
  banks: string;
};

export type CouponRule = {
  minPrice: number;
  maxDiscount: number;
  discountType: DiscountType;
  discountValue: number;
  paymentMethods: CouponPayMethod[];
  creditCard?: CouponCardRule;
};

export type PromoTag = {
  id: string;
  label: string;
  kind: TagKind;
  owner: TagOwner;
  shopId?: string;
  createdByUserId: string;
  status: TagStatus;
  code?: string;
  sale?: SaleRule;
  coupon?: CouponRule;
  listingIds: string[];
  createdAt: string;
};

export type Listing = {
  id: string;
  catalogProductId: string;
  shopId: string;
  basePrice: number;
  sellerPrice: number;
  stock: number;
  moq: number;
  color?: string;
  quality?: string;
  warranty?: string;
  tags: ProductTag[];
  status: ApprovalStatus;
  availabilityConfirmedAt?: string;
};

export type CartItem = {
  listingId: string;
  quantity: number;
  deliveryMode: DeliveryMode;
};

export type Partner = {
  id: string;
  name: string;
  vehicle: string;
  phone: string;
  available: boolean;
};

export type OrderItem = {
  listingId: string;
  catalogProductId: string;
  quantity: number;
  unitPrice: number;
  deliveryMode: DeliveryMode;
  deliveryFee: number;
  warranty?: string;
};

export type OrderEvent = {
  status: OrderStatus;
  at: string;
};

export type Order = {
  id: string;
  buyerId: string;
  shopId: string;
  items: OrderItem[];
  deliveryMode: DeliveryMode;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  address: string;
  addressCoordinates?: Coordinates;
  partnerId?: string;
  timeline?: OrderEvent[];
  packingBy?: string;
  readyBy?: string;
  deliverBy?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentRefId?: string;
  discount?: number;
  couponCode?: string;
  requestId?: string;
  offerId?: string;
};

export type ProductRequestStatus =
  | "OPEN"
  | "AWAITING_OFFERS"
  | "OFFERS_READY"
  | "SELECTED"
  | "ORDERED"
  | "EXPIRED"
  | "CANCELLED";

export type ProductRequest = {
  id: string;
  buyerId: string;
  catalogProductId: string;
  listingId?: string;
  queryText?: string;
  buyerLat: number;
  buyerLng: number;
  status: ProductRequestStatus;
  waveIndex: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

export type AvailabilityOffer = {
  id: string;
  requestId: string;
  requestShopId: string;
  shopId: string;
  listingId?: string;
  unitPrice: number;
  availableQty: number;
  message?: string;
  status: "ACTIVE" | "EXPIRED" | "WITHDRAWN" | "SELECTED" | "REJECTED";
  createdAt: string;
  expiresAt: string;
};

export type Review = {
  id: string;
  catalogProductId: string;
  listingId?: string;
  shopId: string;
  buyerId: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  orderId?: string;
  imageUrls?: string[];
  sellerReply?: { body: string; createdAt: string };
  hidden?: boolean;
};

export type TicketMessage = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  imageUrls?: string[];
};

export type Ticket = {
  id: string;
  kind: TicketKind;
  status: TicketStatus;
  subject: string;
  buyerId?: string;
  shopId?: string;
  orderId?: string;
  listingId?: string;
  assignedToUserId?: string;
  createdAt: string;
  messages: TicketMessage[];
  hidden?: boolean;
};

export type ModerationAction = "hide" | "override";

export type ModerationReason =
  | "counterfeit"
  | "pricing"
  | "images"
  | "description"
  | "stock"
  | "policy"
  | "other";

/**
 * Where a moderated listing sits between admin and seller. `open` means the seller still has to
 * act; `republish_requested` means they claim it is fixed and admin has to answer.
 */
export type ModerationCaseStatus =
  | "open"
  | "disputed"
  | "republish_requested"
  | "approved"
  | "declined";

export type ModerationEventKind =
  | "opened"
  | "dispute"
  | "republish_request"
  | "approved"
  | "declined"
  | "note";

export type ModerationEvent = {
  id: string;
  kind: ModerationEventKind;
  authorId: string;
  authorRole: Role;
  body: string;
  createdAt: string;
};

export type ModerationCase = {
  id: string;
  listingId: string;
  shopId: string;
  catalogProductId: string;
  action: ModerationAction;
  reason: ModerationReason;
  explanation: string;
  openedByUserId: string;
  status: ModerationCaseStatus;
  createdAt: string;
  updatedAt: string;
  events: ModerationEvent[];
};

export type SellerApplication = {
  id: string;
  userId: string;
  shopId: string;
  status: ApplicationStatus;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  coordinates?: Coordinates;
  gstin: string;
  categoryIds: string[];
  notes: string;
  submittedAt: string;
};

export type Coupon = {
  id: string;
  shopId: string;
  code: string;
  label: string;
  discountPercent: number;
  minOrderAmount: number;
  active: boolean;
};

export type NearbyShop = Shop & { distanceKm: number };
