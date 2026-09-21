"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { RequireConsoleAuth } from "@/console/RequireAuth";
import { adminNav } from "@/console/nav";
import { Suspense, type ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireConsoleAuth roles={["admin"]}>
      <DashboardShell links={adminNav}>
        <Suspense fallback={<p className="text-sm text-stone-500">Loading…</p>}>{children}</Suspense>
      </DashboardShell>
    </RequireConsoleAuth>
  );
}
