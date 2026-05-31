"use client";

import { AuthSessionWatchdog } from "@/components/auth/auth-session-watchdog";
import { AuthProvider } from "@/context/auth-context";
import { OrdersProvider } from "@/context/orders-context";
import { StatusToastHost } from "@/components/ui/status-toast-host";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthSessionWatchdog />
      <OrdersProvider>
        {children}
        <StatusToastHost />
      </OrdersProvider>
    </AuthProvider>
  );
}
