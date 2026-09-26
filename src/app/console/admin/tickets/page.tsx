"use client";

import { IssuesDesk } from "@/components/issues/IssuesDesk";
import { Suspense } from "react";

export default function AdminTickets() {
  return (
    <Suspense fallback={<p className="text-sm text-stone-500">Loading issues…</p>}>
      <IssuesDesk mode="admin" />
    </Suspense>
  );
}
