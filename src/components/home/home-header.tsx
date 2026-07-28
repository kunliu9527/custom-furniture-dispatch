"use client";

import { LoginPanel } from "@/components/auth/login-panel";
import { AppNav } from "@/components/layout/app-nav";
import { useAuth } from "@/context/auth-context";
import { DEFAULT_SITE_BRANDING } from "@/lib/site-branding";
import Link from "next/link";

export function HomeHeader() {
  const { user, siteBranding } = useAuth();
  const headline =
    siteBranding.headlineTitle || DEFAULT_SITE_BRANDING.headlineTitle;
  const shortTitle =
    headline.length > 4 ? `${headline.slice(0, 4)}…` : headline;

  return (
    <header className="vi-glass-header relative">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex min-h-[44px] items-center gap-2.5 text-sm font-semibold"
          style={{ color: "var(--label-primary)" }}
        >
          <span className="vi-logo-mark size-8 text-xs" aria-hidden>
            派
          </span>
          <span className="hidden sm:inline">{headline}</span>
          <span className="sm:hidden">{shortTitle}</span>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {user ? <AppNav showAuth={false} /> : null}
          <LoginPanel variant="home" />
        </div>
      </div>
    </header>
  );
}
