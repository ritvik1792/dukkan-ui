"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { AdminDashboard } from "@/console/dashboards/AdminDashboard";
import { SellerDashboard } from "@/console/dashboards/SellerDashboard";
import { ConsoleLoginForm } from "@/console/LoginForm";
import { adminNav, sellerNavFor } from "@/console/nav";
import { useApp } from "@/context/AppContext";
import { ROUTES } from "@/lib/routes";

export default function ConsoleDashboardPage() {
  const { user, isAuthenticated, state } = useApp();

  if (!state.hydrated) {
    return <p className="p-8 text-sm text-stone-500">Loading…</p>;
  }

  if (!isAuthenticated || !user || user.role === "buyer") {
    return (
      <ConsoleLoginForm
        next={ROUTES.consoleDashboard}
        buyerBlocked={user?.role === "buyer"}
      />
    );
  }

  if (user.role === "admin") {
    return (
      <DashboardShell links={adminNav}>
        <AdminDashboard />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell links={sellerNavFor(user, state.shops, state.applications)}>
      <SellerDashboard />
    </DashboardShell>
  );
}
