import { adminConsolePath, ROUTES, sellerConsolePath } from "@/lib/routes";
import type { SellerApplication, Shop, User } from "@/lib/types";

export const adminNav = [
  { href: ROUTES.consoleDashboard, label: "Analytics" },
  { href: adminConsolePath("/applications"), label: "Join requests" },
  { href: adminConsolePath("/sellers"), label: "Providers" },
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
  { href: sellerConsolePath("/products"), label: "Inventory", requires: "products" as const },
  { href: sellerConsolePath("/services"), label: "Services", requires: "services" as const },
  { href: sellerConsolePath("/moderation"), label: "Moderation" },
  { href: sellerConsolePath("/promos"), label: "Sales & coupons" },
  { href: sellerConsolePath("/orders"), label: "Orders", requires: "orders" as const },
  { href: sellerConsolePath("/bookings"), label: "Bookings", requires: "bookings" as const },
  {
    href: sellerConsolePath("/service-requests"),
    label: "Service requests",
    requires: "serviceRequests" as const,
  },
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

function sellerShop(user: Pick<User, "id" | "shopId"> | undefined, shops: Shop[]) {
  if (!user) return undefined;
  return (
    shops.find((item) => item.id === user.shopId) ??
    shops.find((item) => item.ownerUserId === user.id)
  );
}

export function sellerNavFor(
  user: Pick<User, "id" | "role" | "shopId"> | undefined,
  shops: Shop[],
  applications: SellerApplication[],
) {
  let links = sellerNav;
  if (user && !sellerShouldShowApplication(user, shops, applications)) {
    links = links.filter((link) => link.href !== applicationHref);
  }
  const shop = sellerShop(user, shops);
  if (!shop || user?.role === "admin") {
    return links.map(({ requires: _r, ...link }) => link);
  }
  return links
    .filter((link) => {
      if (!link.requires) return true;
      if (link.requires === "products") return shop.productsAllowed !== false;
      if (link.requires === "orders") return shop.ordersAllowed !== false;
      if (link.requires === "services") return Boolean(shop.servicesAllowed);
      if (link.requires === "bookings") return Boolean(shop.bookingsAllowed);
      if (link.requires === "serviceRequests") return Boolean(shop.serviceRequestsAllowed);
      return true;
    })
    .map(({ requires: _r, ...link }) => link);
}
