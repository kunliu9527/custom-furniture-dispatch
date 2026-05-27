"use client";

import { LoginPanel } from "@/components/auth/login-panel";
import { SyncStatusBadge } from "@/components/sync/sync-status-badge";
import { useAuth } from "@/context/auth-context";
import { getVisibleNavLinks } from "@/lib/nav-access";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const links = getVisibleNavLinks(user);

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm">
      {links.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-2 transition ${
              isActive
                ? "bg-indigo-50 font-medium text-indigo-700 ring-1 ring-indigo-200"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <SyncStatusBadge />
      <LoginPanel variant="inline" redirectOnLogin={false} />
    </nav>
  );
}
