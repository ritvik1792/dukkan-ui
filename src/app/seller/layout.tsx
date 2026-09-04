"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import type { ReactNode } from "react";

const links = [
  { href: "/seller", label: "Dashboard" },
  { href: "/seller/application", label: "Application" },
  { href: "/seller/categories", label: "Categories" },
  { href: "/seller/products", label: "Products" },
  { href: "/seller/promos", label: "Sales & coupons" },
  { href: "/seller/orders", label: "Orders" },
  { href: "/seller/reviews", label: "Reviews" },
  { href: "/seller/tickets", label: "Complaints" },
  { href: "/seller/settings", label: "Delivery" },
];

export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth roles={["seller", "admin"]}>
      <DashboardShell links={links}>{children}</DashboardShell>
    </RequireAuth>
  );
}
