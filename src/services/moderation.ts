import type {
  ModerationCase,
  ModerationCaseStatus,
  ModerationEventKind,
  ModerationReason,
} from "@/lib/types";

export const MODERATION_REASONS: { value: ModerationReason; label: string; hint: string }[] = [
  {
    value: "counterfeit",
    label: "Brand or authenticity",
    hint: "Listing claims a brand the photos or invoice do not back up.",
  },
  {
    value: "pricing",
    label: "Pricing",
    hint: "Base price, discount, or MRP looks wrong or misleading.",
  },
  { value: "images", label: "Images", hint: "Photos are stock, unclear, or not the product." },
  {
    value: "description",
    label: "Description",
    hint: "Missing or incorrect details buyers need before ordering.",
  },
  { value: "stock", label: "Stock or fulfilment", hint: "Repeated cancellations or stale stock." },
  { value: "policy", label: "Policy breach", hint: "Restricted item or platform rule violation." },
  { value: "other", label: "Other", hint: "Anything not covered above — explain it below." },
];

export function reasonLabel(reason: ModerationReason) {
  return MODERATION_REASONS.find((item) => item.value === reason)?.label ?? "Other";
}

export function caseStatusLabel(status: ModerationCaseStatus) {
  switch (status) {
    case "open":
      return "Waiting on seller";
    case "disputed":
      return "Disputed";
    case "republish_requested":
      return "Republish requested";
    case "approved":
      return "Republished";
    case "declined":
      return "Declined";
  }
}

export function eventLabel(kind: ModerationEventKind) {
  switch (kind) {
    case "opened":
      return "Action taken";
    case "dispute":
      return "Seller disputed";
    case "republish_request":
      return "Republish requested";
    case "approved":
      return "Admin republished";
    case "declined":
      return "Admin declined";
    case "note":
      return "Note";
  }
}

/** A case still needs someone to act unless admin has closed it out. */
export function isCaseOpen(item: ModerationCase) {
  return item.status !== "approved" && item.status !== "declined";
}

/** Admin's queue: the cases where the ball is in admin's court. */
export function needsAdminReply(item: ModerationCase) {
  return item.status === "disputed" || item.status === "republish_requested";
}

/** Seller's queue: cases the seller has not answered yet. */
export function needsSellerReply(item: ModerationCase) {
  return item.status === "open" || item.status === "declined";
}

/** Most recent case for a listing, which is the one both dashboards act on. */
export function latestCaseForListing(cases: ModerationCase[], listingId: string) {
  return cases
    .filter((item) => item.listingId === listingId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export function activeCaseForListing(cases: ModerationCase[], listingId: string) {
  const latest = latestCaseForListing(cases, listingId);
  return latest && isCaseOpen(latest) ? latest : undefined;
}

export function casesForShop(cases: ModerationCase[], shopId: string) {
  return cases.filter((item) => item.shopId === shopId);
}
