"use client";

import { useAuthDialog } from "@/components/auth/AuthDialog";
import { useApp } from "@/context/AppContext";
import { useMotionRouter } from "@/lib/motion";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function PhoneAuthRedirect() {
  const { isAuthenticated, state } = useApp();
  const { openAuth } = useAuthDialog();
  const router = useMotionRouter();
  const params = useSearchParams();
  const next = params.get("next") || "";

  useEffect(() => {
    if (!state.hydrated) return;
    if (isAuthenticated) {
      router.replace(next || "/");
      return;
    }
    openAuth();
  }, [state.hydrated, isAuthenticated, openAuth, router, next]);

  return (
    <div className="mx-auto max-w-sm px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Sign in with phone</h1>
      <p className="mt-2 text-sm text-stone-500">
        A popup will ask for your mobile number. New numbers create a buyer account.
      </p>
      <button
        type="button"
        onClick={() => openAuth()}
        className="mt-6 rounded-full bg-ink px-5 py-2 text-sm text-lime"
      >
        Continue
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Loading…</p>}>
      <PhoneAuthRedirect />
    </Suspense>
  );
}
