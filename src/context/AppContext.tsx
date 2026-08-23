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
import { DELIVERY_RADIUS_KM, STORAGE_KEY } from "@/lib/constants";
import { distanceKm } from "@/lib/geo";
import {
  neighborhoods,
  products as seedProducts,
  seedOrders,
  shops as seedShops,
  users,
} from "@/lib/mock-data";
import type {
  CartItem,
  DeliveryMode,
  Neighborhood,
  Order,
  Product,
  Role,
  Shop,
  User,
} from "@/lib/types";

type State = {
  userId: string;
  neighborhoodId: string;
  products: Product[];
  shops: Shop[];
  cart: CartItem[];
  orders: Order[];
  hydrated: boolean;
};

type Action =
  | { type: "hydrate"; payload: Partial<State> }
  | { type: "setUser"; userId: string }
  | { type: "setNeighborhood"; neighborhoodId: string }
  | { type: "addToCart"; item: CartItem }
  | { type: "setQty"; productId: string; quantity: number }
  | { type: "setCartDelivery"; productId: string; deliveryMode: DeliveryMode }
  | { type: "clearCart" }
  | { type: "placeOrder"; order: Order }
  | { type: "addProduct"; product: Product }
  | { type: "updateProduct"; product: Product }
  | { type: "setProductStatus"; productId: string; status: Product["status"] }
  | { type: "setShopStatus"; shopId: string; status: Shop["status"] }
  | { type: "setOrderStatus"; orderId: string; status: Order["status"] };

const initialState: State = {
  userId: "u-buyer",
  neighborhoodId: "cp",
  products: seedProducts,
  shops: seedShops,
  cart: [],
  orders: seedOrders,
  hydrated: false,
};

function persistable(state: State) {
  return {
    userId: state.userId,
    neighborhoodId: state.neighborhoodId,
    products: state.products,
    shops: state.shops,
    cart: state.cart,
    orders: state.orders,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.payload, hydrated: true };
    case "setUser":
      return { ...state, userId: action.userId };
    case "setNeighborhood":
      return { ...state, neighborhoodId: action.neighborhoodId };
    case "addToCart": {
      const existing = state.cart.find(
        (c) =>
          c.productId === action.item.productId &&
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
            c.productId === action.productId
              ? { ...c, quantity: action.quantity }
              : c,
          )
          .filter((c) => c.quantity > 0),
      };
    case "setCartDelivery":
      return {
        ...state,
        cart: state.cart.map((c) =>
          c.productId === action.productId
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
      };
    case "addProduct":
      return { ...state, products: [action.product, ...state.products] };
    case "updateProduct":
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.product.id ? action.product : p,
        ),
      };
    case "setProductStatus":
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.productId ? { ...p, status: action.status } : p,
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
    default:
      return state;
  }
}

type AppContextValue = {
  state: State;
  dispatch: Dispatch<Action>;
  user: User;
  neighborhood: Neighborhood;
  nearbyShops: (Shop & { distanceKm: number })[];
  nearbyProducts: (Product & { distanceKm: number; shop: Shop })[];
  cartCount: number;
  cartTotal: number;
  shopById: (id: string) => Shop | undefined;
  productById: (id: string) => Product | undefined;
  switchRole: (role: Role) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<State>;
        dispatch({
          type: "hydrate",
          payload: {
            userId: parsed.userId ?? initialState.userId,
            neighborhoodId:
              parsed.neighborhoodId ?? initialState.neighborhoodId,
            products: parsed.products ?? initialState.products,
            shops: parsed.shops ?? initialState.shops,
            cart: parsed.cart ?? [],
            orders: parsed.orders ?? initialState.orders,
          },
        });
        return;
      }
    } catch {
      /* ignore */
    }
    dispatch({ type: "hydrate", payload: {} });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable(state)));
  }, [state]);

  const value = useMemo((): AppContextValue => {
    const user = users.find((u) => u.id === state.userId) ?? users[0];
    const neighborhood =
      neighborhoods.find((n) => n.id === state.neighborhoodId) ??
      neighborhoods[0];

    const nearbyShops = state.shops
      .map((shop) => ({
        ...shop,
        distanceKm: distanceKm(neighborhood.coordinates, shop.coordinates),
      }))
      .filter(
        (shop) =>
          shop.status === "active" && shop.distanceKm <= DELIVERY_RADIUS_KM,
      )
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const nearbyIds = new Set(nearbyShops.map((s) => s.id));
    const nearbyProducts = state.products
      .filter((p) => p.status === "approved" && nearbyIds.has(p.shopId))
      .map((p) => {
        const shop = nearbyShops.find((s) => s.id === p.shopId)!;
        return { ...p, distanceKm: shop.distanceKm, shop };
      });

    const shopById = (id: string) => state.shops.find((s) => s.id === id);
    const productById = (id: string) => state.products.find((p) => p.id === id);

    const cartCount = state.cart.reduce((n, i) => n + i.quantity, 0);
    const cartTotal = state.cart.reduce((sum, item) => {
      const product = productById(item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    const switchRole = (role: Role) => {
      const next = users.find((u) => u.role === role);
      if (next) dispatch({ type: "setUser", userId: next.id });
    };

    return {
      state,
      dispatch,
      user,
      neighborhood,
      nearbyShops,
      nearbyProducts,
      cartCount,
      cartTotal,
      shopById,
      productById,
      switchRole,
    };
  }, [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
