"use client";

import { LoginPanel } from "@/components/auth/login-panel";
import { SyncRefreshButton } from "@/components/sync/sync-refresh-button";
import { SyncStatusBadge } from "@/components/sync/sync-status-badge";
import { useAuth } from "@/context/auth-context";
import { DEFAULT_SITE_BRANDING } from "@/lib/site-branding";
import Link from "next/link";

export function HomeHeader() {
  const { siteBranding } = useAuth();
  const headline =
    siteBranding.headlineTitle || DEFAULT_SITE_BRANDING.headlineTitle;
  const shortTitle =
    headline.length > 4 ? `${headline.slice(0, 4)}…` : headline;

  return (
    <header className="relative z-10 border-b border-slate-200/70 bg-white/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-sm font-semibold text-slate-900 transition hover:opacity-90"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700 ring-1 ring-indigo-200/80">
            派
          </span>
          <span className="hidden rounded-lg bg-indigo-100 px-2.5 py-1 text-indigo-900 ring-1 ring-indigo-200/80 sm:inline">
            {headline}
          </span>
          <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-indigo-900 ring-1 ring-indigo-200/80 sm:hidden">
            {shortTitle}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LoginPanel variant="home" />
        </div>
      </div>
    </header>
  );
}
