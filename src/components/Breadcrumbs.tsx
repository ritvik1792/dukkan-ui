"use client";

import { useApp } from "@/context/AppContext";
import { categories } from "@/data/seed";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type Crumb = {
  href?: string;
  label: string;
};

const SEGMENT_LABELS: Record<string, string> = {
  search: "Search",
  product: "Products",
  shop: "Shops",
  dashboard: "Dashboard",
  info: "Product",
  cart: "Cart",
  wishlist: "Wishlist",
  checkout: "Checkout",
  login: "Login",
  signup: "Sign up",
  account: "Account",
  orders: "Orders",
  tickets: "Support",
  sell: "Sell on Dukkan",
  seller: "Seller",
  admin: "Admin",
  application: "Application",
  applications: "Join requests",
  categories: "Categories",
  products: "Listings",
  new: "New listing",
  promos: "Sales & coupons",
  reviews: "Reviews",
  settings: "Settings",
  ads: "Ads",
  sellers: "Dukkans",
};

function humanize(segment: string) {
  return SEGMENT_LABELS[segment] ?? segment.replaceAll("-", " ");
}

function useAutoCrumbs(): Crumb[] {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { catalogById, shopById, listingById, state } = useApp();
  const parts = pathname.split("/").filter(Boolean);

  if (parts.length === 0) return [];

  if (parts[0] === "product" && parts[1] === "info") {
    const product = state.viewProductId ? catalogById(state.viewProductId) : undefined;
    const category = categories.find((c) => c.id === product?.categoryId);
    const crumbs: Crumb[] = [{ href: "/", label: "Home" }];
    if (category) {
      crumbs.push({ href: `/search?category=${category.id}`, label: category.name });
    } else {
      crumbs.push({ href: "/search", label: "Search" });
    }
    if (state.viewPreferShopId) {
      const shop = shopById(state.viewPreferShopId);
      crumbs.push({
        href: ROUTES.shopDashboard,
        label: shop?.name ?? "Shop",
      });
    }
    crumbs.push({ label: product?.name ?? "Product" });
    return crumbs;
  }

  if (parts[0] === "shop" && parts[1] === "dashboard") {
    const shop = state.viewShopId ? shopById(state.viewShopId) : undefined;
    return [
      { href: "/", label: "Home" },
      { label: shop?.name ?? "Dukkan" },
    ];
  }

  if (parts[0] === "search") {
    const crumbs: Crumb[] = [
      { href: "/", label: "Home" },
      { href: "/search", label: "Search" },
    ];
    const q = searchParams.get("q")?.trim();
    const categoryId = searchParams.get("category");
    const category = categories.find((c) => c.id === categoryId);
    if (category) crumbs.push({ label: category.name });
    if (q) crumbs.push({ label: `“${q}”` });
    if (crumbs.length === 2) crumbs[1] = { label: "Search" };
    return crumbs;
  }

  const crumbs: Crumb[] = [{ href: "/", label: "Home" }];
  let acc = "";

  parts.forEach((segment, index) => {
    acc += `/${segment}`;
    const isLast = index === parts.length - 1;
    const prev = parts[index - 1];
    let label = humanize(segment);

    if (prev === "products" && parts[0] === "seller" && segment !== "new") {
      const listing = listingById(segment);
      const product = listing ? catalogById(listing.catalogProductId) : undefined;
      label = product?.name ?? "Listing";
    }

    crumbs.push({
      href: isLast ? undefined : acc,
      label,
    });
  });

  return crumbs;
}

export function Breadcrumbs({ items }: { items?: Crumb[] }) {
  const auto = useAutoCrumbs();
  const crumbs = items ?? auto;
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="border-b border-stone-200/70 bg-white/70">
      <ol className="page-shell flex flex-wrap items-center gap-x-1.5 gap-y-1 py-2 text-xs text-stone-500">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && (
                <span aria-hidden className="text-stone-300">
                  ›
                </span>
              )}
              {crumb.href && !last ? (
                <Link href={crumb.href} className="truncate hover:text-ink hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page" className="truncate font-medium text-ink">
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
