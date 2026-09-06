"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import type { ReactNode } from "react";

const links = [
  { href: "/admin", label: "Analytics" },
  { href: "/admin/applications", label: "Join requests" },
  { href: "/admin/sellers", label: "Dukkans" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/ads", label: "Ads" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/tickets", label: "Support" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth roles={["admin"]}>
      <DashboardShell links={links}>{children}</DashboardShell>
    </RequireAuth>
  );
}
