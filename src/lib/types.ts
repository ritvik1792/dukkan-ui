export type Role = "buyer" | "seller" | "admin";

export type DeliveryMode = "partner" | "shop";

export type ProductStatus = "pending" | "approved" | "rejected";

export type OrderStatus =
  | "placed"
  | "accepted"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type Coordinates = {
  lat: number;
  lng: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  shopId?: string;
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
  category: string;
  description: string;
  address: string;
  coordinates: Coordinates;
  rating: number;
  reviews: number;
  verified: boolean;
  gstin?: string;
  yearStarted: number;
  deliveryModes: DeliveryMode[];
  status: "pending" | "active" | "suspended";
};

export type Product = {
  id: string;
  shopId: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  mrp: number;
  unit: string;
  stock: number;
  rating: number;
  reviews: number;
  imageLabel: string;
  imageHue: number;
  moq: number;
  status: ProductStatus;
  deliveryModes: DeliveryMode[];
};

export type CartItem = {
  productId: string;
  quantity: number;
  deliveryMode: DeliveryMode;
};

export type Order = {
  id: string;
  buyerId: string;
  shopId: string;
  items: CartItem[];
  deliveryMode: DeliveryMode;
  status: OrderStatus;
  total: number;
  createdAt: string;
  address: string;
};

export type Category = {
  id: string;
  name: string;
  emoji: string;
};
