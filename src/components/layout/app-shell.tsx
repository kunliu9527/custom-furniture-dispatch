import { AppNav } from "@/components/layout/app-nav";
import Link from "next/link";
import type { ReactNode } from "react";

interface AppShellProps {
  title: string;
  description?: string;
  badge?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function AppShell({
  title,
  description,
  badge,
  children,
  actions,
}: AppShellProps) {
  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm"
            >
              派
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
                {badge ? (
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    {badge}
                  </span>
                ) : null}
              </div>
              {description ? (
                <p className="mt-0.5 text-sm text-slate-500">{description}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AppNav />
            {actions}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
