"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  adPlacements as seedAdPlacements,
  advertisements as seedAds,
  applications as seedApplications,
  catalog as seedCatalog,
  categories as seedCategories,
  coupons as seedCoupons,
  defaultSettings,
  moderationCases as seedModerationCases,
  partners as seedPartners,
  promoTags as seedPromoTags,
  listings as seedListings,
  neighborhoods as seedNeighborhoods,
  reviews as seedReviews,
  seedOrders,
  shops as seedShops,
  tickets as seedTickets,
  users as seedUsers,
} from "@/data/seed";
import {
  ApiError,
  fetchHealth,
  getToken,
  loadStorefront,
  loginRequest,
  mapApiUser,
  setToken,
  signupRequest,
} from "@/lib/api";
import { DEFAULT_DELIVERY_RADIUS_KM, STORAGE_KEY } from "@/lib/constants";
import { requestGeoFix } from "@/lib/geolocation";
import { useIsHydrated } from "@/lib/hydration";
import { appendOrderEvent, migrateOrder, normalizeOrderStatus } from "@/lib/orders";
import {
  mergeNotifications,
  notificationsForDelivered,
  notificationsForOrder,
  notificationsForReview,
  notificationsForTicket,
} from "@/lib/notifications";
import { mergeShopOps } from "@/lib/shopOps";
import { readViewSelection, writeViewSelection } from "@/lib/view";
import {
  detachListingsFromTags,
  syncListingsOntoTags,
  syncTagsOntoListings,
} from "@/lib/tags";
import { cartShipments, cartSummary } from "@/services/cart";
import { uniqueCatalogOffers, shopsInRadius } from "@/services/catalog";
import { authenticate, clampShopRadiusKm, isPlaceholderPassword, loginOrCreateByPhone } from "@/services/auth";
import {
  areaLocation,
  isUsableLocation,
  nearestNeighborhood,
  placeTitle,
  resolveGpsLocation,
} from "@/services/location";
import type {
  AdPlacement,
  Advertisement,
  AppNotification,
  CartItem,
  CatalogProduct,
  Category,
  Coordinates,
  Coupon,
  DeliveryMode,
  Listing,
  ModerationCase,
  ModerationCaseStatus,
  ModerationEvent,
  NearbyShop,
  Neighborhood,
  Order,
  Partner,
  PaymentMethod,
  PlatformSettings,
  ProductTag,
  PromoTag,
  Review,
  Role,
  TagStatus,
  SavedAddress,
  SavedCard,
  SellerApplication,
  Shop,
  Ticket,
  TicketStatus,
  User,
  UserLocation,
} from "@/lib/types";

export type AppState = {
  sessionUserId: string | null;
  neighborhoodId: string;
  /** Where "nearby" is measured from. Null until the shopper picks or shares one. */
  location: UserLocation | null;
  locationPromptSeen: boolean;
  users: User[];
  shops: Shop[];
  catalog: CatalogProduct[];
  listings: Listing[];
  cart: CartItem[];
  orders: Order[];
  reviews: Review[];
  tickets: Ticket[];
  applications: SellerApplication[];
  coupons: Coupon[];
  promoTags: PromoTag[];
  advertisements: Advertisement[];
  adPlacements: AdPlacement[];
  moderationCases: ModerationCase[];
  categories: Category[];
  neighborhoods: Neighborhood[];
  partners: Partner[];
  settings: PlatformSettings;
  wishlist: string[];
  notifications: AppNotification[];
  viewShopId: string | null;
  viewProductId: string | null;
  viewPreferShopId: string | null;
  hydrated: boolean;
  apiStatus: "connecting" | "online" | "offline";
  apiShopCount: number | null;
};

type Action =
  | { type: "hydrate"; payload: Partial<AppState> }
  | { type: "login"; userId: string }
  | { type: "logout" }
  | { type: "setNeighborhood"; neighborhoodId: string }
  | { type: "setLocation"; location: UserLocation }
  | { type: "clearLocation" }
  | { type: "dismissLocationPrompt" }
  | { type: "setSettings"; settings: PlatformSettings }
  | { type: "addToCart"; item: CartItem }
  | { type: "setQty"; listingId: string; quantity: number }
  | { type: "toggleWishlist"; catalogProductId: string }
  | { type: "setCartDelivery"; listingId: string; deliveryMode: DeliveryMode }
  | { type: "clearCart" }
  | { type: "placeOrder"; order: Order }
  | { type: "upsertUser"; user: User }
  | { type: "upsertShop"; shop: Shop }
  | { type: "upsertCatalog"; product: CatalogProduct }
  | { type: "upsertListing"; listing: Listing }
  | { type: "deleteListings"; listingIds: string[] }
  | { type: "setListingStatus"; listingId: string; status: Listing["status"] }
  | { type: "setShopStatus"; shopId: string; status: Shop["status"] }
  | { type: "setOrderStatus"; orderId: string; status: Order["status"] }
  | {
      type: "setOrderSchedule";
      orderId: string;
      packingBy?: string;
      readyBy?: string;
      deliverBy?: string;
    }
  | { type: "assignPartner"; orderId: string; partnerId: string }
  | { type: "replyReview"; reviewId: string; body: string }
  | { type: "addReview"; review: Review }
  | { type: "addReviewPhotos"; reviewId: string; imageUrls: string[] }
  | { type: "upsertCoupon"; coupon: Coupon }
  | { type: "upsertPromoTag"; tag: PromoTag }
  | { type: "setPromoTagStatus"; tagId: string; status: TagStatus }
  | { type: "setReviewHidden"; reviewId: string; hidden: boolean }
  | { type: "setTicketHidden"; ticketId: string; hidden: boolean }
  | { type: "setApplicationStatus"; applicationId: string; status: SellerApplication["status"] }
  | { type: "addApplication"; application: SellerApplication }
  | { type: "addTicket"; ticket: Ticket }
  | { type: "upsertTicket"; ticket: Ticket }
  | { type: "upsertOrder"; order: Order }
  | { type: "replaceReview"; review: Review }
  | { type: "setTicketStatus"; ticketId: string; status: TicketStatus }
  | { type: "assignTicket"; ticketId: string; userId: string }
  | { type: "addTicketMessage"; ticketId: string; authorId: string; body: string; imageUrls?: string[] }
  | { type: "addShopCategory"; shopId: string; categoryId: string }
  | { type: "removeShopCategory"; shopId: string; categoryId: string }
  | { type: "setListingTags"; listingId: string; tags: ProductTag[] }
  | { type: "upsertAd"; ad: Advertisement }
  | { type: "deleteAd"; adId: string }
  | { type: "upsertAdPlacement"; placement: AdPlacement }
  | { type: "deleteAdPlacement"; placementId: string }
  | { type: "openModerationCase"; moderationCase: ModerationCase }
  | {
      type: "addModerationEvent";
      caseId: string;
      event: ModerationEvent;
      status: ModerationCaseStatus;
    }
  | { type: "saveAddress"; address: SavedAddress; setDefault?: boolean }
  | { type: "deleteAddress"; addressId: string }
  | { type: "setDefaultAddress"; addressId: string }
  | { type: "saveCard"; card: SavedCard; setDefault?: boolean }
  | { type: "deleteCard"; cardId: string }
  | { type: "setDefaultCard"; cardId: string }
  | { type: "setPaymentPrefs"; preferredPayment?: PaymentMethod; savedUpiId?: string }
  | { type: "addNotification"; notification: AppNotification }
  | { type: "markNotificationsRead"; ids: string[] }
  | { type: "markAllNotificationsRead"; userId: string }
  | { type: "setViewShop"; shopId: string }
  | { type: "setViewProduct"; productId: string; preferShopId?: string | null }
  | {
      type: "setApi";
      status: AppState["apiStatus"];
      shopCount?: number | null;
    }
  | {
      type: "loadCatalog";
      shops: Shop[];
      catalog: CatalogProduct[];
      listings: Listing[];
      advertisements: Advertisement[];
      settings: PlatformSettings;
      shopCount: number;
      categories?: Category[];
      neighborhoods?: Neighborhood[];
      partners?: Partner[];
      reviews?: Review[];
      orders?: Order[];
      tickets?: Ticket[];
      applications?: SellerApplication[];
      coupons?: Coupon[];
    };

const initialState: AppState = {
  sessionUserId: null,
  neighborhoodId: "cp",
  location: null,
  locationPromptSeen: false,
  users: seedUsers,
  shops: seedShops,
  catalog: seedCatalog,
  listings: seedListings,
  cart: [],
  orders: seedOrders,
  reviews: seedReviews,
  tickets: seedTickets,
  applications: seedApplications,
  coupons: seedCoupons,
  promoTags: seedPromoTags,
  advertisements: seedAds,
  adPlacements: seedAdPlacements,
  moderationCases: seedModerationCases,
  categories: seedCategories,
  neighborhoods: seedNeighborhoods,
  partners: seedPartners,
  settings: defaultSettings,
  wishlist: [],
  notifications: [],
  viewShopId: null,
  viewProductId: null,
  viewPreferShopId: null,
  hydrated: false,
  apiStatus: "connecting",
  apiShopCount: null,
};

function persistable(state: AppState) {
  return {
    sessionUserId: state.sessionUserId,
    neighborhoodId: state.neighborhoodId,
    location: state.location,
    locationPromptSeen: state.locationPromptSeen,
    users: state.users,
    shops: state.shops,
    catalog: state.catalog,
    listings: state.listings,
    cart: state.cart,
    orders: state.orders,
    reviews: state.reviews,
    tickets: state.tickets,
    applications: state.applications,
    coupons: state.coupons,
    promoTags: state.promoTags,
    advertisements: state.advertisements,
    adPlacements: state.adPlacements,
    moderationCases: state.moderationCases,
    categories: state.categories,
    neighborhoods: state.neighborhoods,
    partners: state.partners,
    settings: state.settings,
    wishlist: state.wishlist,
    notifications: state.notifications,
  };
}

function applyLocation(state: AppState, location: UserLocation): AppState {
  const nearest = nearestNeighborhood(location.coordinates, state.neighborhoods);
  return {
    ...state,
    location,
    locationPromptSeen: true,
    neighborhoodId: nearest?.id ?? state.neighborhoodId,
    users: state.sessionUserId
      ? state.users.map((user) =>
          user.id === state.sessionUserId ? { ...user, location } : user,
        )
      : state.users,
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
      return {
        ...state,
        ...action.payload,
        wishlist: action.payload.wishlist ?? state.wishlist,
        hydrated: true,
      };
    case "login":
      return { ...state, sessionUserId: action.userId };
    case "logout":
      return { ...state, sessionUserId: null, cart: [] };
    case "setNeighborhood": {
      const picked = state.neighborhoods.find((n) => n.id === action.neighborhoodId);
      if (!picked) return state;
      return applyLocation(state, areaLocation(picked));
    }
    case "setLocation":
      return applyLocation(state, action.location);
    case "clearLocation": {
      const next = { ...state, location: null, locationPromptSeen: false };
      if (!state.sessionUserId) return next;
      return {
        ...next,
        users: state.users.map((user) =>
          user.id === state.sessionUserId ? { ...user, location: undefined } : user,
        ),
      };
    }
    case "dismissLocationPrompt":
      return { ...state, locationPromptSeen: true };
    case "setSettings":
      return { ...state, settings: action.settings };
    case "addToCart": {
      const existing = state.cart.find(
        (c) =>
          c.listingId === action.item.listingId &&
          c.deliveryMode === action.item.deliveryMode,
      );
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((c) =>
            c === existing
              ? { ...c, quantity: c.quantity + action.item.quantity }
              : c,
          ),
        };
      }
      return { ...state, cart: [...state.cart, action.item] };
    }
    case "setQty":
      return {
        ...state,
        cart: state.cart
          .map((c) =>
            c.listingId === action.listingId
              ? { ...c, quantity: action.quantity }
              : c,
          )
          .filter((c) => c.quantity > 0),
      };
    case "toggleWishlist": {
      const has = state.wishlist.includes(action.catalogProductId);
      return {
        ...state,
        wishlist: has
          ? state.wishlist.filter((id) => id !== action.catalogProductId)
          : [...state.wishlist, action.catalogProductId],
      };
    }
    case "setCartDelivery":
      return {
        ...state,
        cart: state.cart.map((c) =>
          c.listingId === action.listingId
            ? { ...c, deliveryMode: action.deliveryMode }
            : c,
        ),
      };
    case "clearCart":
      return { ...state, cart: [] };
    case "placeOrder":
      return {
        ...state,
        orders: [action.order, ...state.orders],
        cart: [],
        notifications: mergeNotifications(
          state.notifications,
          notificationsForOrder(state, action.order),
        ),
      };
    case "upsertUser": {
      const exists = state.users.some((u) => u.id === action.user.id);
      return {
        ...state,
        users: exists
          ? state.users.map((u) => (u.id === action.user.id ? action.user : u))
          : [...state.users, action.user],
      };
    }
    case "upsertShop": {
      const exists = state.shops.some((s) => s.id === action.shop.id);
      return {
        ...state,
        shops: exists
          ? state.shops.map((s) => (s.id === action.shop.id ? action.shop : s))
          : [...state.shops, action.shop],
      };
    }
    case "upsertCatalog": {
      const exists = state.catalog.some((p) => p.id === action.product.id);
      return {
        ...state,
        catalog: exists
          ? state.catalog.map((p) => (p.id === action.product.id ? action.product : p))
          : [...state.catalog, action.product],
      };
    }
    case "upsertListing": {
      const exists = state.listings.some((l) => l.id === action.listing.id);
      const listings = exists
        ? state.listings.map((l) => (l.id === action.listing.id ? action.listing : l))
        : [action.listing, ...state.listings];
      return {
        ...state,
        listings,
        promoTags: syncListingsOntoTags(state.promoTags, action.listing),
      };
    }
    case "deleteListings": {
      const ids = new Set(action.listingIds);
      return {
        ...state,
        listings: state.listings.filter((listing) => !ids.has(listing.id)),
        cart: state.cart.filter((item) => !ids.has(item.listingId)),
        promoTags: detachListingsFromTags(state.promoTags, action.listingIds),
      };
    }
    case "setListingStatus":
      return {
        ...state,
        listings: state.listings.map((l) =>
          l.id === action.listingId ? { ...l, status: action.status } : l,
        ),
      };
    case "setShopStatus":
      return {
        ...state,
        shops: state.shops.map((s) =>
          s.id === action.shopId ? { ...s, status: action.status } : s,
        ),
      };
    case "setOrderStatus": {
      const previous = state.orders.find((order) => order.id === action.orderId);
      const nextStatus = normalizeOrderStatus(action.status);
      const orders = state.orders.map((o) =>
        o.id === action.orderId
          ? {
              ...o,
              status: nextStatus,
              timeline: appendOrderEvent(o, action.status),
            }
          : o,
      );
      const delivered =
        nextStatus === "delivered" && previous && normalizeOrderStatus(previous.status) !== "delivered"
          ? notificationsForDelivered(state, { ...previous, status: "delivered" })
          : [];
      return {
        ...state,
        orders,
        notifications: mergeNotifications(state.notifications, delivered),
      };
    }
    case "setOrderSchedule":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId
            ? {
                ...o,
                packingBy: action.packingBy,
                readyBy: action.readyBy,
                deliverBy: action.deliverBy,
              }
            : o,
        ),
      };
    case "assignPartner":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId
            ? { ...o, partnerId: action.partnerId || undefined }
            : o,
        ),
      };
    case "replyReview":
      return {
        ...state,
        reviews: state.reviews.map((r) =>
          r.id === action.reviewId
            ? {
                ...r,
                sellerReply: { body: action.body, createdAt: new Date().toISOString() },
              }
            : r,
        ),
      };
    case "addReview":
      return {
        ...state,
        reviews: [action.review, ...state.reviews],
        notifications: mergeNotifications(
          state.notifications,
          notificationsForReview(state, action.review),
        ),
      };
    case "addReviewPhotos":
      return {
        ...state,
        reviews: state.reviews.map((r) =>
          r.id === action.reviewId
            ? {
                ...r,
                imageUrls: [...(r.imageUrls ?? []), ...action.imageUrls].slice(0, 8),
              }
            : r,
        ),
      };
    case "upsertCoupon": {
      const exists = state.coupons.some((c) => c.id === action.coupon.id);
      return {
        ...state,
        coupons: exists
          ? state.coupons.map((c) => (c.id === action.coupon.id ? action.coupon : c))
          : [action.coupon, ...state.coupons],
      };
    }
    case "upsertPromoTag": {
      const exists = state.promoTags.some((tag) => tag.id === action.tag.id);
      const promoTags = exists
        ? state.promoTags.map((tag) => (tag.id === action.tag.id ? action.tag : tag))
        : [action.tag, ...state.promoTags];
      return {
        ...state,
        promoTags,
        listings: syncTagsOntoListings(state.listings, action.tag),
      };
    }
    case "setPromoTagStatus": {
      const tag = state.promoTags.find((item) => item.id === action.tagId);
      if (!tag) return state;
      const next = { ...tag, status: action.status };
      return {
        ...state,
        promoTags: state.promoTags.map((item) => (item.id === next.id ? next : item)),
        listings: syncTagsOntoListings(state.listings, next),
      };
    }
    case "setReviewHidden":
      return {
        ...state,
        reviews: state.reviews.map((review) =>
          review.id === action.reviewId ? { ...review, hidden: action.hidden } : review,
        ),
      };
    case "setTicketHidden":
      return {
        ...state,
        tickets: state.tickets.map((ticket) =>
          ticket.id === action.ticketId
            ? {
                ...ticket,
                hidden: action.hidden,
                status: action.hidden ? "closed" : ticket.status,
              }
            : ticket,
        ),
      };
    case "addApplication":
      return { ...state, applications: [action.application, ...state.applications] };
    case "setApplicationStatus":
      return {
        ...state,
        applications: state.applications.map((a) =>
          a.id === action.applicationId ? { ...a, status: action.status } : a,
        ),
      };
    case "addTicket":
      return {
        ...state,
        tickets: [action.ticket, ...state.tickets],
        notifications: mergeNotifications(
          state.notifications,
          notificationsForTicket(state, action.ticket),
        ),
      };
    case "upsertTicket": {
      const exists = state.tickets.some((ticket) => ticket.id === action.ticket.id);
      return {
        ...state,
        tickets: exists
          ? state.tickets.map((ticket) => (ticket.id === action.ticket.id ? action.ticket : ticket))
          : [action.ticket, ...state.tickets],
        notifications: exists
          ? state.notifications
          : mergeNotifications(
              state.notifications,
              notificationsForTicket(state, action.ticket),
            ),
      };
    }
    case "upsertOrder": {
      const exists = state.orders.some((order) => order.id === action.order.id);
      return {
        ...state,
        orders: exists
          ? state.orders.map((order) => (order.id === action.order.id ? action.order : order))
          : [action.order, ...state.orders],
      };
    }
    case "replaceReview": {
      const exists = state.reviews.some((review) => review.id === action.review.id);
      return {
        ...state,
        reviews: exists
          ? state.reviews.map((review) => (review.id === action.review.id ? action.review : review))
          : [action.review, ...state.reviews],
      };
    }
    case "setTicketStatus":
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.ticketId ? { ...t, status: action.status } : t,
        ),
      };
    case "assignTicket":
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.ticketId
            ? { ...t, assignedToUserId: action.userId || undefined }
            : t,
        ),
      };
    case "addTicketMessage":
      return {
        ...state,
        tickets: state.tickets.map((t) => {
          if (t.id !== action.ticketId) return t;
          const author = state.users.find((u) => u.id === action.authorId);
          const staffReply = author && author.role !== "buyer";
          return {
            ...t,
            status: t.status === "open" && staffReply ? "in_progress" : t.status,
            assignedToUserId:
              t.assignedToUserId ?? (staffReply ? action.authorId : t.assignedToUserId),
            messages: [
              ...t.messages,
              {
                id: `m-${Date.now()}`,
                authorId: action.authorId,
                body: action.body,
                createdAt: new Date().toISOString(),
                imageUrls: action.imageUrls?.length ? action.imageUrls : undefined,
              },
            ],
          };
        }),
      };
    case "addShopCategory":
      return {
        ...state,
        shops: state.shops.map((s) =>
          s.id === action.shopId && !s.categoryIds.includes(action.categoryId)
            ? { ...s, categoryIds: [...s.categoryIds, action.categoryId] }
            : s,
        ),
      };
    case "removeShopCategory":
      return {
        ...state,
        shops: state.shops.map((s) =>
          s.id === action.shopId
            ? {
                ...s,
                categoryIds: s.categoryIds.filter((id) => id !== action.categoryId),
              }
            : s,
        ),
      };
    case "setListingTags": {
      const listing = state.listings.find((item) => item.id === action.listingId);
      if (!listing) return state;
      const next = { ...listing, tags: action.tags };
      return {
        ...state,
        listings: state.listings.map((item) => (item.id === next.id ? next : item)),
        promoTags: syncListingsOntoTags(state.promoTags, next),
      };
    }
    case "upsertAd": {
      const exists = state.advertisements.some((a) => a.id === action.ad.id);
      return {
        ...state,
        advertisements: exists
          ? state.advertisements.map((a) => (a.id === action.ad.id ? action.ad : a))
          : [action.ad, ...state.advertisements],
      };
    }
    case "deleteAd":
      return {
        ...state,
        advertisements: state.advertisements.filter((ad) => ad.id !== action.adId),
      };
    case "upsertAdPlacement": {
      const exists = state.adPlacements.some((p) => p.id === action.placement.id);
      return {
        ...state,
        adPlacements: exists
          ? state.adPlacements.map((p) => (p.id === action.placement.id ? action.placement : p))
          : [action.placement, ...state.adPlacements],
      };
    }
    case "deleteAdPlacement":
      return {
        ...state,
        adPlacements: state.adPlacements.filter((p) => p.id !== action.placementId),
        // Ads keep existing but fall back to "unassigned" so nothing silently disappears.
        advertisements: state.advertisements.map((ad) =>
          ad.placementId === action.placementId ? { ...ad, placementId: undefined } : ad,
        ),
      };
    case "openModerationCase":
      return {
        ...state,
        moderationCases: [action.moderationCase, ...state.moderationCases],
      };
    case "addModerationEvent":
      return {
        ...state,
        moderationCases: state.moderationCases.map((item) =>
          item.id === action.caseId
            ? {
                ...item,
                status: action.status,
                updatedAt: action.event.createdAt,
                events: [...item.events, action.event],
              }
            : item,
        ),
      };
    case "saveAddress": {
      if (!state.sessionUserId) return state;
      return {
        ...state,
        users: state.users.map((user) => {
          if (user.id !== state.sessionUserId) return user;
          const addresses = [...(user.addresses ?? [])];
          const index = addresses.findIndex((item) => item.id === action.address.id);
          if (index >= 0) addresses[index] = action.address;
          else addresses.push(action.address);
          return {
            ...user,
            addresses,
            pinCode: user.pinCode || action.address.pinCode,
            defaultAddressId:
              action.setDefault || !user.defaultAddressId
                ? action.address.id
                : user.defaultAddressId,
          };
        }),
      };
    }
    case "deleteAddress": {
      if (!state.sessionUserId) return state;
      return {
        ...state,
        users: state.users.map((user) => {
          if (user.id !== state.sessionUserId) return user;
          const addresses = (user.addresses ?? []).filter((item) => item.id !== action.addressId);
          return {
            ...user,
            addresses,
            defaultAddressId:
              user.defaultAddressId === action.addressId
                ? addresses[0]?.id
                : user.defaultAddressId,
          };
        }),
      };
    }
    case "setDefaultAddress": {
      if (!state.sessionUserId) return state;
      return {
        ...state,
        users: state.users.map((user) =>
          user.id === state.sessionUserId ? { ...user, defaultAddressId: action.addressId } : user,
        ),
      };
    }
    case "saveCard": {
      if (!state.sessionUserId) return state;
      return {
        ...state,
        users: state.users.map((user) => {
          if (user.id !== state.sessionUserId) return user;
          const cards = [...(user.cards ?? [])];
          const index = cards.findIndex((item) => item.id === action.card.id);
          if (index >= 0) cards[index] = action.card;
          else cards.push(action.card);
          return {
            ...user,
            cards,
            defaultCardId: action.setDefault || !user.defaultCardId ? action.card.id : user.defaultCardId,
            preferredPayment: "card",
          };
        }),
      };
    }
    case "deleteCard": {
      if (!state.sessionUserId) return state;
      return {
        ...state,
        users: state.users.map((user) => {
          if (user.id !== state.sessionUserId) return user;
          const cards = (user.cards ?? []).filter((item) => item.id !== action.cardId);
          return {
            ...user,
            cards,
            defaultCardId: user.defaultCardId === action.cardId ? cards[0]?.id : user.defaultCardId,
          };
        }),
      };
    }
    case "setDefaultCard": {
      if (!state.sessionUserId) return state;
      return {
        ...state,
        users: state.users.map((user) =>
          user.id === state.sessionUserId ? { ...user, defaultCardId: action.cardId, preferredPayment: "card" } : user,
        ),
      };
    }
    case "setPaymentPrefs": {
      if (!state.sessionUserId) return state;
      return {
        ...state,
        users: state.users.map((user) =>
          user.id === state.sessionUserId
            ? {
                ...user,
                preferredPayment: action.preferredPayment ?? user.preferredPayment,
                savedUpiId: action.savedUpiId ?? user.savedUpiId,
              }
            : user,
        ),
      };
    }
    case "addNotification":
      return {
        ...state,
        notifications: mergeNotifications(state.notifications, [action.notification]),
      };
    case "markNotificationsRead": {
      const ids = new Set(action.ids);
      const now = new Date().toISOString();
      return {
        ...state,
        notifications: state.notifications.map((item) =>
          ids.has(item.id) && !item.readAt ? { ...item, readAt: now } : item,
        ),
      };
    }
    case "markAllNotificationsRead": {
      const now = new Date().toISOString();
      return {
        ...state,
        notifications: state.notifications.map((item) =>
          item.userId === action.userId && !item.readAt ? { ...item, readAt: now } : item,
        ),
      };
    }
    case "setViewShop":
      return { ...state, viewShopId: action.shopId };
    case "setViewProduct":
      return {
        ...state,
        viewProductId: action.productId,
        viewPreferShopId: action.preferShopId ?? null,
        viewShopId: action.preferShopId ?? state.viewShopId,
      };
    case "setApi":
      return {
        ...state,
        apiStatus: action.status,
        apiShopCount: action.shopCount ?? state.apiShopCount,
      };
    case "loadCatalog":
      return {
        ...state,
        shops: action.shops.map((shop) => {
          const prev = state.shops.find((item) => item.id === shop.id);
          const seed = seedShops.find((item) => item.id === shop.id);
          return mergeShopOps(shop, prev ?? seed);
        }),
        catalog: action.catalog.map((product) => {
          const prev = state.catalog.find((item) => item.id === product.id);
          return {
            ...product,
            imageUrl: product.imageUrl ?? prev?.imageUrl,
            galleryUrls: product.galleryUrls?.length ? product.galleryUrls : prev?.galleryUrls,
          };
        }),
        listings: action.listings.map((listing) => {
          const prev = state.listings.find((item) => item.id === listing.id);
          return {
            ...listing,
            color: listing.color ?? prev?.color,
            quality: listing.quality ?? prev?.quality,
            warranty: listing.warranty ?? prev?.warranty,
          };
        }),
        // The API has no concept of placements yet, so keep the local slot assignment.
        // Empty API catalogs should not wipe the storefront ad bar — fall back to seed.
        advertisements: (action.advertisements.length ? action.advertisements : seedAds).map((ad) => {
          const prev = state.advertisements.find((item) => item.id === ad.id);
          const seed = seedAds.find((item) => item.id === ad.id);
          return {
            ...ad,
            placementId: ad.placementId ?? prev?.placementId ?? seed?.placementId,
            weight: ad.weight ?? prev?.weight ?? seed?.weight,
            createdAt: ad.createdAt ?? prev?.createdAt ?? seed?.createdAt,
          };
        }),
        categories: action.categories ?? state.categories,
        neighborhoods: action.neighborhoods?.length ? action.neighborhoods : state.neighborhoods,
        partners: action.partners ?? state.partners,
        reviews: action.reviews ?? state.reviews,
        orders: action.orders ?? state.orders,
        tickets: action.tickets ?? state.tickets,
        applications: action.applications ?? state.applications,
        coupons: action.coupons ?? state.coupons,
        settings: action.settings,
        apiStatus: "online",
        apiShopCount: action.shopCount,
      };
    default:
      return state;
  }
}

type AppContextValue = {
  state: AppState;
  dispatch: Dispatch<Action>;
  user: User | null;
  isAuthenticated: boolean;
  neighborhood: Neighborhood;
  location: UserLocation | null;
  /** Point that `nearbyShops` distances are measured from. */
  origin: Coordinates;
  locationLabel: string;
  needsLocationPrompt: boolean;
  nearbyShops: NearbyShop[];
  shopRadiusKm: number;
  cartCount: number;
  cartTotal: number;
  shopById: (id: string) => Shop | undefined;
  listingById: (id: string) => Listing | undefined;
  catalogById: (id: string) => CatalogProduct | undefined;
  login: (email: string, password: string) => Promise<User | null>;
  signup: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<User>;
  loginWithPhone: (phone: string, name?: string) => User;
  logout: () => void;
  switchRole: (role: Role) => void;
  selectShop: (shopId: string) => void;
  selectProduct: (productId: string, preferShopId?: string | null) => void;
  /** Asks the browser for a GPS fix and makes it the active location. Throws `GeoError`. */
  detectLocation: () => Promise<UserLocation>;
  setAreaLocation: (neighborhoodId: string) => void;
  dismissLocationPrompt: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const namedFixes = useRef(new Set<string>());

  useEffect(() => {
    const view = readViewSelection();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppState>;
        dispatch({
          type: "hydrate",
          payload: {
            ...initialState,
            ...parsed,
            settings: { ...defaultSettings, ...parsed.settings },
            users: (parsed.users ?? initialState.users).map((u) => {
              const seed = seedUsers.find((item) => item.id === u.id);
              return {
                ...u,
                password: isPlaceholderPassword(u.password) ? undefined : u.password,
                addresses: u.addresses?.length ? u.addresses : (seed?.addresses ?? []),
                defaultAddressId: u.defaultAddressId ?? seed?.defaultAddressId,
                cards: u.cards?.length ? u.cards : (seed?.cards ?? []),
                defaultCardId: u.defaultCardId ?? seed?.defaultCardId,
                shopRadiusKm: clampShopRadiusKm(
                  u.shopRadiusKm ?? defaultSettings.deliveryRadiusKm,
                ),
              };
            }),
            orders: (parsed.orders ?? initialState.orders).map(migrateOrder),
            shops: (parsed.shops ?? initialState.shops).map((shop) => {
              const seed = seedShops.find((item) => item.id === shop.id);
              return mergeShopOps(shop, seed);
            }),
            notifications: parsed.notifications ?? [],
            reviews: (parsed.reviews ?? initialState.reviews).map((review) => {
              if (review.imageUrls?.length) return review;
              const seed = seedReviews.find((item) => item.id === review.id);
              return seed?.imageUrls?.length ? { ...review, imageUrls: seed.imageUrls } : review;
            }),
            advertisements: (parsed.advertisements ?? seedAds).map((ad) => {
              const seed = seedAds.find((item) => item.id === ad.id);
              return { ...ad, placementId: ad.placementId ?? seed?.placementId };
            }),
            adPlacements: parsed.adPlacements?.length ? parsed.adPlacements : seedAdPlacements,
            moderationCases: parsed.moderationCases ?? seedModerationCases,
            promoTags: parsed.promoTags?.length ? parsed.promoTags : seedPromoTags,
            categories: (() => {
              const cached = parsed.categories ?? [];
              const byId = new Map(cached.map((c) => [c.id, c]));
              for (const seed of seedCategories) {
                if (!byId.has(seed.id)) byId.set(seed.id, seed);
                else {
                  const prev = byId.get(seed.id)!;
                  byId.set(seed.id, {
                    ...prev,
                    kind: prev.kind ?? seed.kind,
                    emoji: prev.emoji || seed.emoji,
                    name: prev.name || seed.name,
                  });
                }
              }
              return [...byId.values()];
            })(),
            sessionUserId: parsed.sessionUserId ?? null,
            location: isUsableLocation(parsed.location) ? parsed.location : null,
            locationPromptSeen: parsed.locationPromptSeen ?? false,
            wishlist: parsed.wishlist ?? [],
            viewShopId: view.shopId,
            viewProductId: view.productId,
            viewPreferShopId: view.preferShopId,
          },
        });
        return;
      }
    } catch {
      /* ignore corrupt cache */
    }
    dispatch({
      type: "hydrate",
      payload: {
        viewShopId: view.shopId,
        viewProductId: view.productId,
        viewPreferShopId: view.preferShopId,
      },
    });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    let cancelled = false;
    if (!getToken()) {
      fetchHealth()
        .then((health) => {
          if (!cancelled) {
            dispatch({ type: "setApi", status: "online", shopCount: health.shopCount });
          }
        })
        .catch(() => {
          if (!cancelled) dispatch({ type: "setApi", status: "offline" });
        });
      return () => {
        cancelled = true;
      };
    }
    loadStorefront()
      .then((payload) => {
        if (cancelled) return;
        dispatch({
          type: "loadCatalog",
          shops: payload.shops,
          catalog: payload.catalog,
          listings: payload.listings,
          advertisements: payload.advertisements,
          settings: { ...defaultSettings, ...payload.settings },
          shopCount: payload.health.shopCount ?? payload.shops.length,
          categories: payload.categories,
          neighborhoods: payload.neighborhoods,
          partners: payload.partners,
          reviews: payload.reviews,
          orders: payload.orders,
          tickets: payload.tickets,
          applications: payload.applications,
          coupons: payload.coupons,
        });
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: "setApi", status: "offline" });
      });
    return () => {
      cancelled = true;
    };
  }, [state.hydrated, state.sessionUserId]);

  useEffect(() => {
    if (!state.hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable(state)));
  }, [state]);

  // A GPS fix saved earlier may still be labeled "Current location". Name it from the pin.
  useEffect(() => {
    if (!state.hydrated) return;
    const current = state.location;
    if (!current || current.source !== "gps") return;
    const unnamed =
      !current.postcode ||
      current.label === "Current location" ||
      current.label.startsWith("Near ");
    if (!unnamed) return;
    const key = `${current.coordinates.lat.toFixed(5)},${current.coordinates.lng.toFixed(5)}`;
    if (namedFixes.current.has(key)) return;
    namedFixes.current.add(key);
    let cancelled = false;
    resolveGpsLocation(
      { coordinates: current.coordinates, accuracyM: current.accuracyM },
      state.neighborhoods,
    )
      .then((next) => {
        if (cancelled) return;
        if (next.label === current.label && next.postcode === current.postcode && next.area === current.area) {
          return;
        }
        dispatch({
          type: "setLocation",
          location: { ...next, capturedAt: current.capturedAt },
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [
    state.hydrated,
    state.location,
    state.neighborhoods,
  ]);
  useEffect(() => {
    if (!state.hydrated || state.location || !state.sessionUserId) return;
    const saved = state.users.find((u) => u.id === state.sessionUserId)?.location;
    if (isUsableLocation(saved)) dispatch({ type: "setLocation", location: saved });
  }, [state.hydrated, state.sessionUserId, state.location, state.users]);

  useEffect(() => {
    if (!state.hydrated) return;
    writeViewSelection({
      shopId: state.viewShopId,
      productId: state.viewProductId,
      preferShopId: state.viewPreferShopId,
    });
  }, [state.hydrated, state.viewShopId, state.viewProductId, state.viewPreferShopId]);

  const value = useMemo((): AppContextValue => {
    const user =
      state.sessionUserId
        ? (state.users.find((u) => u.id === state.sessionUserId) ?? null)
        : null;
    const isAuthenticated = Boolean(user);
    const neighborhood =
      state.neighborhoods.find((n) => n.id === state.neighborhoodId) ?? state.neighborhoods[0];
    const location = state.location;
    const origin = location?.coordinates ?? neighborhood.coordinates;
    const locationLabel = location ? placeTitle(location) : neighborhood.name;
    const needsLocationPrompt = state.hydrated && !location && !state.locationPromptSeen;
    const shopRadiusKm = clampShopRadiusKm(
      user?.shopRadiusKm ?? state.settings.deliveryRadiusKm ?? DEFAULT_DELIVERY_RADIUS_KM,
    );
    const nearbyShops = shopsInRadius(state.shops, origin, shopRadiusKm);
    const shopById = (id: string) => state.shops.find((s) => s.id === id);
    const listingById = (id: string) => state.listings.find((l) => l.id === id);
    const catalogById = (id: string) => state.catalog.find((p) => p.id === id);

    const cartCount = state.cart.reduce((n, i) => n + i.quantity, 0);
    const shipments = cartShipments({
      cart: state.cart,
      listingById,
      shopById,
      catalogById,
    });
    const cartTotal = cartSummary(shipments).total;

    const login = async (email: string, password: string) => {
      try {
        const res = await loginRequest(email, password);
        setToken(res.token);
        const existing = state.users.find((u) => u.id === res.user.id);
        const user = mapApiUser(res.user, {
          password,
          dob: existing?.dob,
          pinCode: existing?.pinCode,
          shopRadiusKm: existing?.shopRadiusKm,
        });
        dispatch({ type: "upsertUser", user });
        dispatch({ type: "login", userId: user.id });
        return user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        const found = authenticate(state.users, email, password);
        if (found) dispatch({ type: "login", userId: found.id });
        return found ?? null;
      }
    };
    const signup = async (input: {
      name: string;
      email: string;
      phone: string;
      password: string;
    }) => {
      const res = await signupRequest(input);
      setToken(res.token);
      const user = mapApiUser(res.user, { password: input.password });
      dispatch({ type: "upsertUser", user });
      dispatch({ type: "login", userId: user.id });
      return user;
    };
    const loginWithPhone = (phone: string, name?: string) => {
      const result = loginOrCreateByPhone(state.users, phone, name);
      if (result.created) dispatch({ type: "upsertUser", user: result.user });
      dispatch({ type: "login", userId: result.user.id });
      return result.user;
    };
    const logout = () => {
      setToken(null);
      dispatch({ type: "logout" });
    };

    const switchRole = (role: Role) => {
      const next = state.users.find((u) => u.role === role);
      if (next) dispatch({ type: "login", userId: next.id });
    };

    const selectShop = (shopId: string) => {
      writeViewSelection({
        shopId,
        productId: state.viewProductId,
        preferShopId: state.viewPreferShopId,
      });
      dispatch({ type: "setViewShop", shopId });
    };

    const selectProduct = (productId: string, preferShopId?: string | null) => {
      writeViewSelection({
        shopId: preferShopId ?? state.viewShopId,
        productId,
        preferShopId: preferShopId ?? null,
      });
      dispatch({ type: "setViewProduct", productId, preferShopId });
    };

    const detectLocation = async () => {
      const fix = await requestGeoFix();
      const next = await resolveGpsLocation(fix, state.neighborhoods);
      dispatch({ type: "setLocation", location: next });
      return next;
    };

    const setAreaLocation = (neighborhoodId: string) => {
      dispatch({ type: "setNeighborhood", neighborhoodId });
    };

    const dismissLocationPrompt = () => dispatch({ type: "dismissLocationPrompt" });

    return {
      state,
      dispatch,
      user,
      isAuthenticated,
      neighborhood,
      location,
      origin,
      locationLabel,
      needsLocationPrompt,
      nearbyShops,
      shopRadiusKm,
      cartCount,
      cartTotal,
      shopById,
      listingById,
      catalogById,
      login,
      signup,
      loginWithPhone,
      logout,
      switchRole,
      selectShop,
      selectProduct,
      detectLocation,
      setAreaLocation,
      dismissLocationPrompt,
    };
  }, [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Location, session, cart, and catalog are restored from localStorage / the API after
 * AppProvider mounts. AppProvider sits outside the shell's Suspense boundary, so that
 * restore can finish before a page hydrates. Returning the SSR seed snapshot until
 * *this* consumer has hydrated keeps ShopCard promo lines and the chrome aligned with
 * the server HTML.
 */
function withServerSnapshot(ctx: AppContextValue): AppContextValue {
  const neighborhood =
    initialState.neighborhoods.find((n) => n.id === initialState.neighborhoodId) ??
    initialState.neighborhoods[0];
  const shopRadiusKm = clampShopRadiusKm(
    initialState.settings.deliveryRadiusKm ?? DEFAULT_DELIVERY_RADIUS_KM,
  );
  return {
    ...ctx,
    state: initialState,
    user: null,
    isAuthenticated: false,
    neighborhood,
    location: null,
    origin: neighborhood.coordinates,
    locationLabel: neighborhood.name,
    needsLocationPrompt: false,
    nearbyShops: shopsInRadius(initialState.shops, neighborhood.coordinates, shopRadiusKm),
    shopRadiusKm,
    cartCount: 0,
    cartTotal: 0,
    shopById: (id: string) => initialState.shops.find((s) => s.id === id),
    listingById: (id: string) => initialState.listings.find((l) => l.id === id),
    catalogById: (id: string) => initialState.catalog.find((p) => p.id === id),
  };
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  const isHydrated = useIsHydrated();
  return useMemo(() => (isHydrated ? ctx : withServerSnapshot(ctx)), [ctx, isHydrated]);
}

export function useUniqueOffers(query?: string, categoryId?: string) {
  const { state, nearbyShops } = useApp();
  return useMemo(
    () =>
      uniqueCatalogOffers({
        catalog: state.catalog,
        listings: state.listings,
        nearbyShopIds: new Set(nearbyShops.map((s) => s.id)),
        shops: state.shops,
        query,
        categoryId,
      }),
    [state.catalog, state.listings, state.shops, nearbyShops, query, categoryId],
  );
}
