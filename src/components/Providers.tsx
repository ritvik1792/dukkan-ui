"use client";

import { AppProvider } from "@/context/AppContext";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </AppProvider>
  );
}
