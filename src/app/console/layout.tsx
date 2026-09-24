import { ConsoleHeader } from "@/console/ConsoleHeader";
import { ShopPeekProvider } from "@/components/shops/ShopPeek";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pink Carrot Console",
  description: "Provider and admin console for Pink Carrot.",
};

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <ShopPeekProvider>
      <ConsoleHeader />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </ShopPeekProvider>
  );
}
