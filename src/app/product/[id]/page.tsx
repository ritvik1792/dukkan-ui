"use client";

import { useApp } from "@/context/AppContext";
import { ROUTES } from "@/lib/routes";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function LegacyProductRedirect() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { selectProduct, state } = useApp();
  const shop = searchParams.get("shop");

  useEffect(() => {
    if (!state.hydrated || !params.id) return;
    selectProduct(params.id, shop);
    router.replace(ROUTES.productInfo);
  }, [state.hydrated, params.id, shop, router, selectProduct]);

  return <p className="p-8 text-sm text-stone-500">Opening product…</p>;
}

export default function LegacyProductPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-stone-500">Opening product…</p>}>
      <LegacyProductRedirect />
    </Suspense>
  );
}
