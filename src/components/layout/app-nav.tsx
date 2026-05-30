"use client";

import { LoginPanel } from "@/components/auth/login-panel";
import { SyncRefreshButton } from "@/components/sync/sync-refresh-button";
import { SyncStatusBadge } from "@/components/sync/sync-status-badge";
import { ManagerNotificationBell } from "@/components/manager/manager-notification-bell";
import { useAuth } from "@/context/auth-context";
import { getVisibleNavLinks } from "@/lib/nav-access";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const links = getVisibleNavLinks(user);

  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm">
      <div className="flex flex-wrap items-center gap-0.5 rounded-xl border border-[var(--vi-border)] bg-white/60 p-1 shadow-[var(--vi-shadow-xs)] backdrop-blur-sm">
        {links.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`vi-nav-pill whitespace-nowrap ${
                isActive
                  ? "vi-nav-pill-active"
                  : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <SyncStatusBadge />
      <SyncRefreshButton />
      <ManagerNotificationBell />
      <LoginPanel variant="inline" redirectOnLogin={false} />
    </nav>
  );
}
