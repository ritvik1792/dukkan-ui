"use client";

import { useApp } from "@/context/AppContext";
import { ROUTES } from "@/lib/routes";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LegacyShopRedirect() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { selectShop, state } = useApp();

  useEffect(() => {
    if (!state.hydrated || !params.id) return;
    selectShop(params.id);
    router.replace(ROUTES.shopDashboard);
  }, [state.hydrated, params.id, router, selectShop]);

  return <p className="p-8 text-sm text-stone-500">Opening dukkan…</p>;
}
