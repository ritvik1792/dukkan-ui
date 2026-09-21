"use client";

import { ConsoleLoginForm } from "@/console/LoginForm";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ConsoleLogin() {
  const params = useSearchParams();
  return (
    <ConsoleLoginForm
      next={params.get("next")}
      buyerBlocked={params.get("error") === "buyer"}
    />
  );
}

export default function ConsoleLoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-stone-500">Loading…</p>}>
      <ConsoleLogin />
    </Suspense>
  );
}
