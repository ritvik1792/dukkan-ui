"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { RequireConsoleAuth } from "@/console/RequireAuth";
import { sellerAwaitingApproval, sellerNavFor } from "@/console/nav";
import { useApp } from "@/context/AppContext";
import { ROUTES, sellerConsolePath } from "@/lib/routes";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";

function SellerShell({ children }: { children: ReactNode }) {
  const { user, state } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const awaiting = sellerAwaitingApproval(user ?? undefined, state.shops, state.applications);
  const supportPath = sellerConsolePath("/tickets");
  const onSupport = pathname === supportPath || pathname.startsWith(`${supportPath}/`);

  useEffect(() => {
    if (awaiting && !onSupport) router.replace(ROUTES.consoleDashboard);
  }, [awaiting, onSupport, router]);

  return (
    <DashboardShell links={sellerNavFor(user ?? undefined, state.shops, state.applications)}>
      {awaiting && !onSupport ? (
        <p className="text-sm text-stone-500">Loading…</p>
      ) : (
        <Suspense fallback={<p className="text-sm text-stone-500">Loading…</p>}>{children}</Suspense>
      )}
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
