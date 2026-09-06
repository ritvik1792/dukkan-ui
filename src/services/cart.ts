import type {
  CartItem,
  CatalogProduct,
  DeliveryMode,
  Listing,
  Shop,
} from "@/lib/types";
import { deliveryFeeFor, shopDeliveryModes } from "@/services/pricing";

export type CartLine = {
  item: CartItem;
  listing: Listing;
  product: CatalogProduct;
  lineTotal: number;
};

/** One seller's items travel together, so each shipment is charged delivery once. */
export type CartShipment = {
  shop: Shop;
  deliveryMode: DeliveryMode;
  deliveryFee: number;
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  total: number;
};

export type CartLookups = {
  cart: CartItem[];
  listingById: (id: string) => Listing | undefined;
  shopById: (id: string) => Shop | undefined;
  catalogById: (id: string) => CatalogProduct | undefined;
};

export function listingCartQty(cart: CartItem[], listingId: string) {
  return cart
    .filter((item) => item.listingId === listingId)
    .reduce((sum, item) => sum + item.quantity, 0);
}

export function listingMaxQty(listing: Listing) {
  return Math.max(listing.moq, Math.min(Math.max(listing.stock, 0), 10));
}

export function cartShipments({
  cart,
  listingById,
  shopById,
  catalogById,
}: CartLookups): CartShipment[] {
  const byShop = new Map<string, CartShipment>();

  for (const item of cart) {
    const listing = listingById(item.listingId);
    const shop = listing ? shopById(listing.shopId) : undefined;
    const product = listing ? catalogById(listing.catalogProductId) : undefined;
    if (!listing || !shop || !product) continue;

    const line: CartLine = {
      item,
      listing,
      product,
      lineTotal: listing.sellerPrice * item.quantity,
    };

    const existing = byShop.get(shop.id);
    if (existing) {
      existing.lines.push(line);
      existing.itemCount += item.quantity;
      existing.subtotal += line.lineTotal;
      existing.total = existing.subtotal + existing.deliveryFee;
      continue;
    }

    const modes = shopDeliveryModes(shop);
    const deliveryMode = modes.includes(item.deliveryMode)
      ? item.deliveryMode
      : (modes[0] ?? item.deliveryMode);
    const deliveryFee = deliveryFeeFor(shop, deliveryMode);

    byShop.set(shop.id, {
      shop,
      deliveryMode,
      deliveryFee,
      lines: [line],
      itemCount: item.quantity,
      subtotal: line.lineTotal,
      total: line.lineTotal + deliveryFee,
    });
  }

  return [...byShop.values()];
}

export function cartSummary(shipments: CartShipment[]) {
  const subtotal = shipments.reduce((n, s) => n + s.subtotal, 0);
  const deliveryTotal = shipments.reduce((n, s) => n + s.deliveryFee, 0);
  return {
    deliveryCount: shipments.length,
    itemCount: shipments.reduce((n, s) => n + s.itemCount, 0),
    subtotal,
    deliveryTotal,
    total: subtotal + deliveryTotal,
  };
}

export function deliveryCountLabel(count: number) {
  if (count <= 1) return "1 delivery";
  return `${count} deliveries`;
}
