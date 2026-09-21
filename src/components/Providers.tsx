"use client";

import { AppProvider } from "@/context/AppContext";
import { AlertProvider } from "@/components/ui/AlertMessage";
import { NotificationWatcher } from "@/components/notifications/NotificationWatcher";
import { AuthDialogProvider } from "@/components/auth/AuthDialog";
import { LocationDialogProvider } from "@/components/location/LocationDialog";
import { NavigationProgressProvider } from "@/components/NavigationProgress";
import { PageTransition } from "@/components/PageTransition";
import { Breadcrumbs } from "./Breadcrumbs";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Suspense } from "react";
import { usePathname } from "next/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AlertProvider>
        <NotificationWatcher />
        <AuthDialogProvider>
          <LocationDialogProvider>
            <Suspense fallback={null}>
              <NavigationProgressProvider>
                <AppShell>{children}</AppShell>
              </NavigationProgressProvider>
            </Suspense>
          </LocationDialogProvider>
        </AuthDialogProvider>
      </AlertProvider>
    </AppProvider>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/console")) {
    return <PageTransition>{children}</PageTransition>;
  }

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
