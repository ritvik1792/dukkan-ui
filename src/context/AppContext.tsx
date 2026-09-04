"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  advertisements as seedAds,
  applications as seedApplications,
  catalog as seedCatalog,
  coupons as seedCoupons,
  defaultSettings,
  listings as seedListings,
  neighborhoods,
  reviews as seedReviews,
  seedOrders,
  shops as seedShops,
  tickets as seedTickets,
  users as seedUsers,
} from "@/data/seed";
import { DEFAULT_DELIVERY_RADIUS_KM, DEMO_PASSWORD, STORAGE_KEY } from "@/lib/constants";
import { readViewSelection, writeViewSelection } from "@/lib/view";
import { cartShipments, cartSummary } from "@/services/cart";
import { uniqueCatalogOffers, shopsInRadius } from "@/services/catalog";
import { authenticate, clampShopRadiusKm } from "@/services/auth";
import type {
  Advertisement,
  CartItem,
  CatalogProduct,
  Coupon,
  DeliveryMode,
  Listing,
  NearbyShop,
  Neighborhood,
  Order,
  PlatformSettings,
  ProductTag,
  Review,
  Role,
  SellerApplication,
  Shop,
  Ticket,
  TicketStatus,
  User,
} from "@/lib/types";

export type AppState = {
  sessionUserId: string | null;
  neighborhoodId: string;
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
  advertisements: Advertisement[];
  settings: PlatformSettings;
  wishlist: string[];
  viewShopId: string | null;
  viewProductId: string | null;
  viewPreferShopId: string | null;
  hydrated: boolean;
};

type Action =
  | { type: "hydrate"; payload: Partial<AppState> }
  | { type: "login"; userId: string }
  | { type: "logout" }
  | { type: "setNeighborhood"; neighborhoodId: string }
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
  | { type: "setListingStatus"; listingId: string; status: Listing["status"] }
  | { type: "setShopStatus"; shopId: string; status: Shop["status"] }
  | { type: "setOrderStatus"; orderId: string; status: Order["status"] }
  | { type: "assignPartner"; orderId: string; partnerId: string }
  | { type: "replyReview"; reviewId: string; body: string }
  | { type: "upsertCoupon"; coupon: Coupon }
  | { type: "setApplicationStatus"; applicationId: string; status: SellerApplication["status"] }
  | { type: "addApplication"; application: SellerApplication }
  | { type: "addTicket"; ticket: Ticket }
  | { type: "setTicketStatus"; ticketId: string; status: TicketStatus }
  | { type: "addTicketMessage"; ticketId: string; authorId: string; body: string }
  | { type: "addShopCategory"; shopId: string; categoryId: string }
  | { type: "removeShopCategory"; shopId: string; categoryId: string }
  | { type: "setListingTags"; listingId: string; tags: ProductTag[] }
  | { type: "upsertAd"; ad: Advertisement }
  | { type: "setViewShop"; shopId: string }
  | { type: "setViewProduct"; productId: string; preferShopId?: string | null };

const initialState: AppState = {
  sessionUserId: null,
  neighborhoodId: "cp",
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
  advertisements: seedAds,
  settings: defaultSettings,
  wishlist: [],
  viewShopId: null,
  viewProductId: null,
  viewPreferShopId: null,
  hydrated: false,
};

function persistable(state: AppState) {
  return {
    sessionUserId: state.sessionUserId,
    neighborhoodId: state.neighborhoodId,
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
    advertisements: state.advertisements,
    settings: state.settings,
    wishlist: state.wishlist,
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
    case "setNeighborhood":
      return { ...state, neighborhoodId: action.neighborhoodId };
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
      return { ...state, orders: [action.order, ...state.orders], cart: [] };
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
      return {
        ...state,
        listings: exists
          ? state.listings.map((l) =>
              l.id === action.listing.id ? action.listing : l,
            )
          : [action.listing, ...state.listings],
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
    case "setOrderStatus":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId ? { ...o, status: action.status } : o,
        ),
      };
    case "assignPartner":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId
            ? { ...o, partnerId: action.partnerId, status: "assigned" }
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
    case "upsertCoupon": {
      const exists = state.coupons.some((c) => c.id === action.coupon.id);
      return {
        ...state,
        coupons: exists
          ? state.coupons.map((c) => (c.id === action.coupon.id ? action.coupon : c))
          : [action.coupon, ...state.coupons],
      };
    }
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
      return { ...state, tickets: [action.ticket, ...state.tickets] };
    case "setTicketStatus":
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.ticketId ? { ...t, status: action.status } : t,
        ),
      };
    case "addTicketMessage":
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.ticketId
            ? {
                ...t,
                messages: [
                  ...t.messages,
                  {
                    id: `m-${Date.now()}`,
                    authorId: action.authorId,
                    body: action.body,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : t,
        ),
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
    case "setListingTags":
      return {
        ...state,
        listings: state.listings.map((l) =>
          l.id === action.listingId ? { ...l, tags: action.tags } : l,
        ),
      };
    case "upsertAd": {
      const exists = state.advertisements.some((a) => a.id === action.ad.id);
      return {
        ...state,
        advertisements: exists
          ? state.advertisements.map((a) => (a.id === action.ad.id ? action.ad : a))
          : [action.ad, ...state.advertisements],
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
  nearbyShops: NearbyShop[];
  shopRadiusKm: number;
  cartCount: number;
  cartTotal: number;
  shopById: (id: string) => Shop | undefined;
  listingById: (id: string) => Listing | undefined;
  catalogById: (id: string) => CatalogProduct | undefined;
  login: (email: string, password: string) => User | null;
  logout: () => void;
  switchRole: (role: Role) => void;
  selectShop: (shopId: string) => void;
  selectProduct: (productId: string, preferShopId?: string | null) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

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
            users: (parsed.users ?? initialState.users).map((u) => ({
              ...u,
              password: u.password || DEMO_PASSWORD,
              shopRadiusKm: clampShopRadiusKm(
                u.shopRadiusKm ?? defaultSettings.deliveryRadiusKm,
              ),
            })),
            advertisements: parsed.advertisements ?? seedAds,
            sessionUserId: parsed.sessionUserId ?? null,
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable(state)));
  }, [state]);

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
      neighborhoods.find((n) => n.id === state.neighborhoodId) ?? neighborhoods[0];
    const shopRadiusKm = clampShopRadiusKm(
      user?.shopRadiusKm ?? state.settings.deliveryRadiusKm ?? DEFAULT_DELIVERY_RADIUS_KM,
    );
    const nearbyShops = shopsInRadius(
      state.shops,
      neighborhood.coordinates,
      shopRadiusKm,
    );
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

    const login = (email: string, password: string) => {
      const found = authenticate(state.users, email, password);
      if (found) dispatch({ type: "login", userId: found.id });
      return found;
    };
    const logout = () => dispatch({ type: "logout" });

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

    return {
      state,
      dispatch,
      user,
      isAuthenticated,
      neighborhood,
      nearbyShops,
      shopRadiusKm,
      cartCount,
      cartTotal,
      shopById,
      listingById,
      catalogById,
      login,
      logout,
      switchRole,
      selectShop,
      selectProduct,
    };
  }, [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
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
