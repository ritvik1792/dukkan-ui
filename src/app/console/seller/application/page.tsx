"use client";

import { StatusPill } from "@/components/ui/StatCard";
import { useApp } from "@/context/AppContext";
import { formatDate, titleCase } from "@/lib/format";
import Link from "next/link";

export default function SellerApplicationPage() {
  const { user, state } = useApp();
  if (!user) return null;
  const apps = state.applications.filter(
    (a) => a.userId === user.id || user.role === "admin",
  );

  if (apps.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Application</h1>
        <p className="mt-2 text-sm text-stone-500">No application on file.</p>
        <Link href="/sell" className="mt-4 inline-block text-sm underline">
          Apply now
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Application tracker</h1>
      <ul className="mt-6 space-y-4">
        {apps.map((app) => (
          <li key={app.id} className="rounded-2xl bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{app.businessName}</p>
                <p className="text-sm text-stone-500">
                  {app.ownerName} · {app.email}
                </p>
              </div>
              <StatusPill>{titleCase(app.status)}</StatusPill>
            </div>
            <p className="mt-3 text-sm">{app.address}</p>
            <p className="mt-1 text-xs text-stone-500">
              Submitted {formatDate(app.submittedAt)}
            </p>
            {app.notes && <p className="mt-2 text-sm text-stone-600">{app.notes}</p>}
            <ol className="mt-4 space-y-1 text-sm text-stone-600">
              <li>1. Submitted</li>
              <li>2. Ops review {app.status === "under_review" || app.status === "approved" ? "✓" : ""}</li>
              <li>3. Dukkan live {app.status === "approved" ? "✓" : ""}</li>
            </ol>
          </li>
        ))}
      </ul>
    </div>
  );
}
