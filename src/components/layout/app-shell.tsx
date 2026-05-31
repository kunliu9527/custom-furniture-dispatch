import { AppNav } from "@/components/layout/app-nav";
import { SyncFooterStatus } from "@/components/sync/sync-footer-status";
import Link from "next/link";
import type { ReactNode } from "react";

interface AppShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  mainClassName?: string;
}

export function AppShell({
  title,
  description,
  children,
  actions,
  mainClassName = "mx-auto max-w-6xl px-4 py-8 sm:px-6",
}: AppShellProps) {
  return (
    <div className="vi-app-bg flex h-dvh flex-col overflow-hidden">
      <header className="vi-glass-header sticky top-0 z-50 shrink-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3.5">
            <Link
              href="/"
              className="vi-logo-mark h-9 w-9 shrink-0 rounded-xl text-sm transition-transform hover:scale-[1.03]"
            >
              派
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="vi-heading-section truncate text-base sm:text-lg">
                  {title}
                </h1>
              </div>
              {description ? (
                <p className="mt-0.5 truncate text-xs text-zinc-500 sm:text-sm">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AppNav />
            {actions}
          </div>
        </div>
      </header>
      <main className={`min-h-0 flex-1 overflow-hidden ${mainClassName}`}>
        {children}
      </main>
      <SyncFooterStatus />
    </div>
  );
}
