"use client";

import { ApplicationTracker } from "@/components/seller/ApplicationTracker";
import { sellerShouldShowApplication } from "@/console/nav";
import { useApp } from "@/context/AppContext";
import { useMotionRouter } from "@/lib/motion";
import { ROUTES, storefrontUrl } from "@/lib/routes";
import Link from "next/link";
import { useEffect } from "react";

export default function SellerApplicationPage() {
  const { user, state } = useApp();
  const router = useMotionRouter();
  const showApplication = user
    ? sellerShouldShowApplication(user, state.shops, state.applications)
    : false;

  useEffect(() => {
    if (user && !showApplication) router.replace(ROUTES.consoleDashboard);
  }, [user, showApplication, router]);

  if (!user || !showApplication) return null;
  const apps = state.applications.filter(
    (a) => a.userId === user.id || user.role === "admin",
  );

  if (apps.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Application</h1>
        <p className="mt-2 text-sm text-stone-500">No application on file.</p>
        <Link href={storefrontUrl("/sell")} className="mt-4 inline-block text-sm underline">
          Apply on the storefront
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Application</h1>
      <p className="mt-1 text-sm text-stone-500">
        Open a step to see what you submitted, what ops asked you to change, and the live status.
        The submission id is how you and admin track the same request.
      </p>
      <div className="mt-6 space-y-4">
        {apps.map((app) => (
          <ApplicationTracker key={app.id} application={app} mode="seller" />
        ))}
      </div>
    </div>
  );
}
