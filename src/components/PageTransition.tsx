"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

function enterClass(pathname: string) {
  return pathname.startsWith("/product") ? "page-slide-in" : "page-enter";
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const frame = useRef<HTMLDivElement>(null);
  const firstPath = useRef(true);

  useEffect(() => {
    const node = frame.current;
    if (!node) return;
    const next = enterClass(pathname);
    if (firstPath.current) {
      firstPath.current = false;
      node.classList.add(next);
      return;
    }
    node.classList.remove("page-enter", "page-slide-in");
    void node.offsetWidth;
    node.classList.add(next);
  }, [pathname]);

  return (
    <div ref={frame} className="flex min-h-0 flex-1 flex-col">
      {children}
    </div>
  );
}
