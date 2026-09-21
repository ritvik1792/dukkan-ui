export const ROUTES = {
  home: "/",
  search: "/search",
  cart: "/cart",
  checkout: "/checkout",
  shopDashboard: "/shop/dashboard",
  productInfo: "/product/info",
  request: "/request",
  console: "/console",
  signup: "/signup",
  consoleLogin: "/console/login",
  consoleDashboard: "/console/dashboard",
  sellerConsole: "/console/seller",
  adminConsole: "/console/admin",
} as const;

export function sellerConsolePath(path = "") {
  return `${ROUTES.sellerConsole}${path}`;
}

export function adminConsolePath(path = "") {
  return `${ROUTES.adminConsole}${path}`;
}

export function defaultConsolePath(role?: string) {
  if (role === "admin" || role === "seller") return ROUTES.consoleDashboard;
  return ROUTES.consoleLogin;
}

export function isStaffRole(role?: string | null) {
  return role === "admin" || role === "seller";
}

/** Same-origin storefront path (console and shop share dukkan-ui). */
export function storefrontUrl(path = "/") {
  return path.startsWith("/") ? path : `/${path}`;
}

export function requestPath(id: string) {
  return `${ROUTES.request}/${encodeURIComponent(id)}`;
}

export function orderDetailPath(orderId: string, role?: string) {
  const id = encodeURIComponent(orderId);
  if (role === "admin") return adminConsolePath(`/orders/${id}`);
  if (role === "seller") return sellerConsolePath(`/orders/${id}`);
  return `/account/orders/${id}`;
}

export function safeConsoleNext(next: string | null | undefined, role?: string) {
  const path = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  if (!path.startsWith("/console")) return defaultConsolePath(role);
  if (role === "admin") return path;
  if (role === "seller") {
    if (path.startsWith("/console/admin")) return ROUTES.consoleDashboard;
    return path;
  }
  return ROUTES.consoleLogin;
}
