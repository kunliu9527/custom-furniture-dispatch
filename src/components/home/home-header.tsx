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

  return (
    <header className="vi-glass-header relative min-w-0">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <Link
            href="/"
            className="flex min-h-[40px] min-w-0 items-center gap-2 text-sm font-semibold"
            style={{ color: "var(--label-primary)" }}
          >
            <span className="vi-logo-mark size-8 shrink-0 text-xs" aria-hidden>
              派
            </span>
            <span className="truncate sm:hidden">派单工作台</span>
            <span className="hidden truncate sm:inline">{headline}</span>
          </Link>
          <div className="shrink-0">
            <LoginPanel variant="home" />
          </div>
        </div>
        {user ? (
          <div className="min-w-0 w-full">
            <AppNav showAuth={false} />
          </div>
        ) : null}
      </div>
    </header>
  );
}
