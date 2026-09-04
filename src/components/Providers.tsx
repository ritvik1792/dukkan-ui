"use client";

import { AppProvider } from "@/context/AppContext";
import { AlertProvider } from "@/components/ui/AlertMessage";
import { Breadcrumbs } from "./Breadcrumbs";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Suspense } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AlertProvider>
        <Header />
        <Suspense fallback={null}>
          <Breadcrumbs />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Footer />
      </AlertProvider>
    </AppProvider>
  );
}
