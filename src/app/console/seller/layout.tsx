"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { RequireConsoleAuth } from "@/console/RequireAuth";
import { sellerNavFor } from "@/console/nav";
import { useApp } from "@/context/AppContext";
import { Suspense, type ReactNode } from "react";

function SellerShell({ children }: { children: ReactNode }) {
  const { user, state } = useApp();
  return (
    <DashboardShell links={sellerNavFor(user ?? undefined, state.shops, state.applications)}>
      <Suspense fallback={<p className="text-sm text-stone-500">Loading…</p>}>{children}</Suspense>
    </DashboardShell>
  );
}

export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <RequireConsoleAuth roles={["seller", "admin"]}>
      <SellerShell>{children}</SellerShell>
    </RequireConsoleAuth>
  );
}
