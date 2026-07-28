"use client";

import { LoginPanel } from "@/components/auth/login-panel";
import { ManagerNotificationBell } from "@/components/manager/manager-notification-bell";
import { useAuth } from "@/context/auth-context";
import { getVisibleNavLinks } from "@/lib/nav-access";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppNavProps {
  /** 首页等已有独立登录区时关闭，避免重复 */
  showAuth?: boolean;
}

export function AppNav({ showAuth = true }: AppNavProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const links = getVisibleNavLinks(user);

  return (
    <nav className="flex w-full min-w-0 flex-col gap-2 sm:max-w-full sm:flex-row sm:flex-wrap sm:items-center">
      {/* 多角色导航项多：小屏横向滑动，避免把整页撑破 */}
      <div className="vi-nav-segment w-max max-w-full flex-nowrap overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] sm:w-auto sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        {links.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`vi-nav-pill whitespace-nowrap ${
                isActive ? "vi-nav-pill-active" : ""
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <ManagerNotificationBell />
        {showAuth ? (
          <LoginPanel variant="inline" redirectOnLogin={false} />
        ) : null}
      </div>
    </nav>
  );
}
