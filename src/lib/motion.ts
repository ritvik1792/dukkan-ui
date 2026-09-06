"use client";

import { useNavigationProgress } from "@/components/NavigationProgress";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

export function useMotionRouter() {
  const router = useRouter();
  const progress = useNavigationProgress();

  return useMemo(
    () => ({
      prefetch: router.prefetch.bind(router),
      refresh: router.refresh.bind(router),
      back: () => {
        progress?.start();
        router.back();
      },
      forward: () => {
        progress?.start();
        router.forward();
      },
      push: (href: string) => {
        progress?.start();
        router.push(href);
      },
      replace: (href: string) => {
        progress?.start();
        router.replace(href);
      },
    }),
    [router, progress],
  );
}
