"use client";

import { AppProvider } from "@/context/AppContext";
import { AlertProvider } from "@/components/ui/AlertMessage";
import { AuthDialogProvider } from "@/components/auth/AuthDialog";
import { NavigationProgressProvider } from "@/components/NavigationProgress";
import { PageTransition } from "@/components/PageTransition";
import { Breadcrumbs } from "./Breadcrumbs";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Suspense } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AlertProvider>
        <AuthDialogProvider>
          <Suspense fallback={null}>
            <NavigationProgressProvider>
              <AppShell>{children}</AppShell>
            </NavigationProgressProvider>
          </Suspense>
        </AuthDialogProvider>
      </AlertProvider>
    </AppProvider>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="site-chrome">
        <Header />
        <Suspense fallback={null}>
          <Breadcrumbs />
        </Suspense>
      </div>
      <main className="flex min-h-0 flex-1 flex-col">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </>
  );
}
