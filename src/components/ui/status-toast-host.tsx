"use client";

import { subscribeStatusToast } from "@/lib/status-toast";
import { useEffect, useState } from "react";

export function StatusToastHost() {
  const [toast, setToast] = useState<{ message: string; key: number } | null>(
    null,
  );

  useEffect(() => subscribeStatusToast((message) => {
    setToast({ message, key: Date.now() });
  }), []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      key={toast.key}
      className="pointer-events-none fixed inset-x-0 top-[calc(var(--eval-site-nav-h,3.5rem)+0.75rem)] z-[100] flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-md rounded-xl border border-emerald-200/80 bg-white/95 px-4 py-2.5 text-sm font-semibold tracking-tight text-emerald-900 shadow-[var(--vi-shadow-md)] backdrop-blur-md">
        {toast.message}
      </div>
    </div>
  );
}
