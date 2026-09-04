import { VIEW_STORAGE_KEY } from "./constants";

export type ViewSelection = {
  shopId: string | null;
  productId: string | null;
  preferShopId: string | null;
};

export const emptyViewSelection: ViewSelection = {
  shopId: null,
  productId: null,
  preferShopId: null,
};

export function readViewSelection(): ViewSelection {
  if (typeof window === "undefined") return emptyViewSelection;
  try {
    const raw = sessionStorage.getItem(VIEW_STORAGE_KEY);
    if (!raw) return emptyViewSelection;
    const parsed = JSON.parse(raw) as Partial<ViewSelection>;
    return {
      shopId: parsed.shopId ?? null,
      productId: parsed.productId ?? null,
      preferShopId: parsed.preferShopId ?? null,
    };
  } catch {
    return emptyViewSelection;
  }
}

export function writeViewSelection(selection: ViewSelection) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(selection));
}
