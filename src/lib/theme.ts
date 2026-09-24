/**
 * Centralized Theme & Tag Color System
 * 
 * Edit colors, tags, and badge combinations in ONE place.
 * These match our pink brand palette paired with clean, accessible secondary tints (like Swiggy's green deals).
 */

export type ThemeTagKind =
  | "primary"
  | "secondary"
  | "sale"
  | "offer"
  | "coupon"
  | "badge"
  | "discount"
  | "deal"
  | "bank"
  | "rating"
  | "verified"
  | "closed"
  | "open";

export interface TagStyleDefinition {
  label?: string;
  className: string;
}

export const THEME_TAGS: Record<ThemeTagKind, TagStyleDefinition> = {
  primary: {
    className: "bg-rose-50 text-rose-600 border border-rose-200/80 ring-1 ring-rose-500/10",
  },
  secondary: {
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 ring-1 ring-emerald-500/10",
  },
  sale: {
    className: "bg-rose-50 text-rose-700 border border-rose-200/90 font-bold",
  },
  offer: {
    className: "bg-emerald-50 text-emerald-800 border border-emerald-200/90 font-semibold",
  },
  coupon: {
    className: "bg-amber-50 text-amber-800 border border-amber-200/90 font-semibold",
  },
  badge: {
    className: "bg-zinc-100 text-zinc-700 border border-zinc-200/80 font-medium",
  },
  discount: {
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold",
  },
  deal: {
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold",
  },
  bank: {
    className: "bg-blue-50 text-blue-700 border border-blue-200/80 font-medium",
  },
  rating: {
    className: "bg-emerald-700 text-white border-transparent font-bold",
  },
  verified: {
    className: "bg-blue-50 text-blue-700 border border-blue-200/80",
  },
  closed: {
    className: "bg-zinc-800 text-white border-transparent font-medium",
  },
  open: {
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium",
  },
};

export function getTagStyle(kind: string | undefined): string {
  if (!kind) return THEME_TAGS.primary.className;
  const key = kind.toLowerCase() as ThemeTagKind;
  return THEME_TAGS[key]?.className ?? THEME_TAGS.badge.className;
}
