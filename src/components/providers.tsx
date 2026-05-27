"use client";

import { AuthProvider } from "@/context/auth-context";
import { OrdersProvider } from "@/context/orders-context";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <OrdersProvider>{children}</OrdersProvider>
    </AuthProvider>
  );
}
