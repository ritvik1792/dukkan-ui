import type {
  CardBrand,
  CouponPayMethod,
  CouponRule,
  Listing,
  PaymentMethod,
  ProductTag,
  PromoTag,
  SaleRule,
  SavedCard,
  TagKind,
} from "@/lib/types";
import { formatInr, titleCase } from "@/lib/format";

export const COUPON_PAY_METHODS: { id: CouponPayMethod; label: string }[] = [
  { id: "credit_card", label: "Credit card" },
  { id: "debit_card", label: "Debit card" },
  { id: "wallet", label: "Wallet" },
  { id: "upi", label: "UPI" },
  { id: "net_banking", label: "Net banking" },
];

export const CARD_NETWORKS: { id: CardBrand; label: string }[] = [
  { id: "visa", label: "Visa" },
  { id: "mastercard", label: "Mastercard" },
  { id: "rupay", label: "RuPay" },
];

export function snapshotTag(tag: PromoTag): ProductTag {
  return {
    id: tag.id,
    label: tag.label,
    kind: tag.kind,
    code: tag.code,
    discountPercent:
      tag.kind === "sale"
        ? tag.sale?.discountPercent
        : tag.coupon?.discountType === "percent"
          ? tag.coupon.discountValue
          : undefined,
  };
}

export function eligiblePromoTags(
  tags: PromoTag[],
  shopId?: string,
  includeTakenDown = false,
) {
  return tags.filter((tag) => {
    if (!includeTakenDown && tag.status !== "active") return false;
    if (tag.owner === "admin") return true;
    return Boolean(shopId && tag.shopId === shopId);
  });
}

export function visibleListingTags(listing: Listing, tags: PromoTag[]): ProductTag[] {
  const hidden = new Set(tags.filter((tag) => tag.status === "taken_down").map((tag) => tag.id));
  return listing.tags.filter((tag) => !hidden.has(tag.id));
}

export function saleDiscount(amount: number, sale: SaleRule) {
  if (amount < sale.minAmount) return 0;
  return Math.min((amount * sale.discountPercent) / 100, sale.maxDiscount, amount);
}

export function couponDiscount(amount: number, coupon: CouponRule) {
  if (amount < coupon.minPrice) return 0;
  const raw =
    coupon.discountType === "percent" ? (amount * coupon.discountValue) / 100 : coupon.discountValue;
  return Math.min(raw, coupon.maxDiscount, amount);
}

export function checkoutPayMethod(method: PaymentMethod): CouponPayMethod | null {
  if (method === "card" || method === "credit_card") return "credit_card";
  if (method === "debit_card") return "debit_card";
  if (method === "upi" || method === "wallet" || method === "net_banking") return method;
  return null;
}

export function couponMatchesPayment(
  coupon: CouponRule,
  method: PaymentMethod,
  card?: Pick<SavedCard, "brand" | "name">,
) {
  const pay = checkoutPayMethod(method);
  if (!pay) return false;
  if (coupon.paymentMethods.length > 0 && !coupon.paymentMethods.includes(pay)) return false;
  if (pay === "credit_card" && coupon.creditCard) {
    if (coupon.creditCard.networks.length && card && !coupon.creditCard.networks.includes(card.brand)) {
      return false;
    }
    const banks = coupon.creditCard.banks
      .split(",")
      .map((bank) => bank.trim().toLowerCase())
      .filter(Boolean);
    if (banks.length && card?.name) {
      const hay = card.name.toLowerCase();
      if (!banks.some((bank) => hay.includes(bank))) return false;
    }
  }
  return true;
}

export function tagRuleSummary(tag: PromoTag) {
  if (tag.kind === "sale" && tag.sale) {
    return `${tag.sale.discountPercent}% off over ${formatInr(tag.sale.minAmount)}, max ${formatInr(tag.sale.maxDiscount)}`;
  }
  if (tag.kind === "coupon" && tag.coupon) {
    const off =
      tag.coupon.discountType === "percent"
        ? `${tag.coupon.discountValue}%`
        : formatInr(tag.coupon.discountValue);
    const pays = tag.coupon.paymentMethods.map((method) => titleCase(method)).join(", ");
    return `${off} off over ${formatInr(tag.coupon.minPrice)}, max ${formatInr(tag.coupon.maxDiscount)}${pays ? ` · ${pays}` : ""}`;
  }
  return titleCase(tag.kind);
}

export function syncTagsOntoListings(listings: Listing[], tag: PromoTag): Listing[] {
  const snap = snapshotTag(tag);
  return listings.map((listing) => {
    const shouldHave = tag.status === "active" && tag.listingIds.includes(listing.id);
    const has = listing.tags.some((item) => item.id === tag.id);
    if (shouldHave && !has) return { ...listing, tags: [...listing.tags, snap] };
    if (!shouldHave && has) return { ...listing, tags: listing.tags.filter((item) => item.id !== tag.id) };
    if (shouldHave && has) {
      return { ...listing, tags: listing.tags.map((item) => (item.id === tag.id ? snap : item)) };
    }
    return listing;
  });
}

export function syncListingsOntoTags(tags: PromoTag[], listing: Listing): PromoTag[] {
  const selected = new Set(listing.tags.map((tag) => tag.id));
  return tags.map((tag) => {
    const shouldHave = selected.has(tag.id);
    const has = tag.listingIds.includes(listing.id);
    if (shouldHave && !has) return { ...tag, listingIds: [...tag.listingIds, listing.id] };
    if (!shouldHave && has) {
      return { ...tag, listingIds: tag.listingIds.filter((id) => id !== listing.id) };
    }
    return tag;
  });
}

export function detachListingsFromTags(tags: PromoTag[], listingIds: string[]): PromoTag[] {
  const ids = new Set(listingIds);
  return tags.map((tag) => ({
    ...tag,
    listingIds: tag.listingIds.filter((id) => !ids.has(id)),
  }));
}

export function kindLabel(kind: TagKind) {
  return titleCase(kind);
}

export function listingSaleDiscount(listing: Listing, quantity: number, tags: PromoTag[]) {
  const amount = listing.sellerPrice * quantity;
  let best = 0;
  for (const tag of tags) {
    if (tag.status !== "active" || tag.kind !== "sale" || !tag.sale) continue;
    if (!tag.listingIds.includes(listing.id)) continue;
    best = Math.max(best, saleDiscount(amount, tag.sale));
  }
  return best;
}

export function findCouponTag(tags: PromoTag[], code: string, shopId: string) {
  const key = code.trim().toUpperCase();
  if (!key) return undefined;
  return tags.find((tag) => {
    if (tag.status !== "active" || tag.kind !== "coupon" || !tag.coupon) return false;
    if ((tag.code ?? "").toUpperCase() !== key) return false;
    if (tag.owner === "admin") return true;
    return tag.shopId === shopId;
  });
}

export function couponEligibleAmount(
  lines: { listing: Listing; quantity: number }[],
  tag: PromoTag,
) {
  return lines.reduce((sum, line) => {
    if (tag.listingIds.length && !tag.listingIds.includes(line.listing.id)) return sum;
    return sum + line.listing.sellerPrice * line.quantity;
  }, 0);
}
