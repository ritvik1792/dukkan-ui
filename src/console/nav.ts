import { adminConsolePath, ROUTES, sellerConsolePath } from "@/lib/routes";
import type { SellerApplication, Shop, User } from "@/lib/types";

export const adminNav = [
  { href: ROUTES.consoleDashboard, label: "Analytics" },
  { href: adminConsolePath("/applications"), label: "Join requests" },
  { href: adminConsolePath("/sellers"), label: "Dukkans" },
  { href: adminConsolePath("/delivery"), label: "Delivery" },
  { href: adminConsolePath("/products"), label: "Products" },
  { href: adminConsolePath("/moderation"), label: "Moderation" },
  { href: adminConsolePath("/ads"), label: "Ads" },
  { href: adminConsolePath("/tags"), label: "Tags" },
  { href: adminConsolePath("/reviews"), label: "Reviews" },
  { href: adminConsolePath("/tickets"), label: "Support" },
  { href: adminConsolePath("/settings"), label: "Settings" },
];

export const sellerNav = [
  { href: ROUTES.consoleDashboard, label: "Dashboard" },
  { href: sellerConsolePath("/application"), label: "Application" },
  { href: sellerConsolePath("/categories"), label: "Categories" },
  { href: sellerConsolePath("/products"), label: "Inventory" },
  { href: sellerConsolePath("/moderation"), label: "Moderation" },
  { href: sellerConsolePath("/promos"), label: "Sales & coupons" },
  { href: sellerConsolePath("/orders"), label: "Orders" },
  { href: sellerConsolePath("/requests"), label: "Availability" },
  { href: sellerConsolePath("/reviews"), label: "Reviews" },
  { href: sellerConsolePath("/tickets"), label: "Complaints" },
  { href: sellerConsolePath("/delivery"), label: "Delivery" },
  { href: sellerConsolePath("/settings"), label: "Settings" },
];

const applicationHref = sellerConsolePath("/application");

export function sellerShouldShowApplication(
  user: Pick<User, "id" | "role" | "shopId">,
  shops: Shop[],
  applications: SellerApplication[],
) {
  const myApps = applications.filter((app) => app.userId === user.id);
  if (myApps.some((app) => app.status !== "approved")) return true;
  if (user.role === "admin") return false;
  const shop =
    shops.find((item) => item.id === user.shopId) ??
    shops.find((item) => item.ownerUserId === user.id);
  return !shop || shop.status === "pending";
}

export function sellerNavFor(
  user: Pick<User, "id" | "role" | "shopId"> | undefined,
  shops: Shop[],
  applications: SellerApplication[],
) {
  if (user && !sellerShouldShowApplication(user, shops, applications)) {
    return sellerNav.filter((link) => link.href !== applicationHref);
  }
  return sellerNav;
}
