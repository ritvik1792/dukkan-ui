const PENDING_KEY = "dukkan-pending-offer-checkout";

export type PendingOfferCheckout = {
  requestId: string;
  offerId: string;
  listingId: string;
  unitPrice: number;
  shopId: string;
  quantity?: number;
};

export function stashOfferCheckout(input: PendingOfferCheckout) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(input));
}

export function readOfferCheckout(): PendingOfferCheckout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingOfferCheckout) : null;
  } catch {
    return null;
  }
}

export function clearOfferCheckout() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_KEY);
}
