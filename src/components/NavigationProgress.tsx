"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type NavigationProgressValue = {
  pending: boolean;
  start: () => void;
};

const NavigationProgressContext = createContext<NavigationProgressValue | null>(null);

export function useNavigationProgress() {
  return useContext(NavigationProgressContext);
}

export function NavigationProgressProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, setPending] = useState(false);
  const start = useCallback(() => setPending(true), []);

  useEffect(() => {
    setPending(false);
  }, [pathname, search]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor || anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      let url: URL;
      try {
        url = new URL(anchor.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      const next = `${url.pathname}${url.search}`;
      const current = `${window.location.pathname}${window.location.search}`;
      if (next === current) return;
      setPending(true);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <NavigationProgressContext.Provider value={{ pending, start }}>
      {pending && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-0.5 overflow-hidden bg-white/30">
          <div className="nav-progress h-full w-1/3 rounded-full bg-lime" />
        </div>
      )}
      {children}
    </NavigationProgressContext.Provider>
  );
}
