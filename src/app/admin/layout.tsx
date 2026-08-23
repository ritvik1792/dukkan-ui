"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useApp();
  const pathname = usePathname();

  if (user.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Admin only</h1>
        <p className="mt-2 text-sm text-stone-500">
          Switch to the admin demo role to moderate shops and catalogues.
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm underline">
          Choose a role
        </Link>
      </div>
    );
  }

  const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/sellers", label: "Sellers" },
    { href: "/admin/products", label: "Catalogue" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap gap-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-full px-4 py-2 text-sm ${
              pathname === l.href ? "bg-ink text-lime" : "bg-white"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
