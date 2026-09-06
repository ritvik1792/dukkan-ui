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

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  shopId?: string;
  phone?: string;
  dob?: string;
  pinCode?: string;
  shopRadiusKm?: number;
  addresses?: SavedAddress[];
  defaultAddressId?: string;
  cards?: SavedCard[];
  defaultCardId?: string;
  savedUpiId?: string;
  preferredPayment?: PaymentMethod;
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
};

export type PlatformSettings = {
  deliveryRadiusKm: number;
  partnerEtaMinutes: number;
  showDemoRoleSwitcher: boolean;
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
