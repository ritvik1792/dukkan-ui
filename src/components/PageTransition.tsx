"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const frame = useRef<HTMLDivElement>(null);
  const firstPath = useRef(true);

  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    const node = frame.current;
    if (!node) return;
    node.classList.remove("page-enter");
    void node.offsetWidth;
    node.classList.add("page-enter");
  }, [pathname]);

  return (
    <div ref={frame} className="page-enter flex min-h-0 flex-1 flex-col">
      {children}
    </div>
  );
}
