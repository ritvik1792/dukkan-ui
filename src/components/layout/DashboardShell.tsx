"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type NavLink = { href: string; label: string };

export function DashboardNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  return (
    <aside className="w-full shrink-0 md:w-52">
      <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
        {links.map((l) => {
          const active =
            l.href === "/seller" || l.href === "/admin"
              ? pathname === l.href
              : pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm ${
                active ? "bg-ink text-lime" : "bg-white hover:bg-stone-100"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function DashboardShell({
  links,
  children,
}: {
  links: NavLink[];
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row">
      <DashboardNav links={links} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
