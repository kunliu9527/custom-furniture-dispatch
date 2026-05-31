"use client";

import { LoginPanel } from "@/components/auth/login-panel";
import { ManagerNotificationBell } from "@/components/manager/manager-notification-bell";
import { useAuth } from "@/context/auth-context";
import { BOARD_META } from "@/lib/board-meta";
import { getVisibleNavLinks } from "@/lib/nav-access";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const links = getVisibleNavLinks(user);

  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm">
      <div className="flex flex-wrap items-center gap-0.5 rounded-xl border border-[var(--vi-border-strong)] bg-white/90 p-1 shadow-[var(--vi-shadow-sm)] backdrop-blur-sm">
        {links.map((item) => {
          const isActive = pathname === item.href;
          const meta = BOARD_META[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`vi-nav-pill whitespace-nowrap ${
                isActive
                  ? meta?.navActiveClass ?? "vi-nav-pill-active"
                  : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <ManagerNotificationBell />
      <LoginPanel variant="inline" redirectOnLogin={false} />
    </nav>
  );
}
