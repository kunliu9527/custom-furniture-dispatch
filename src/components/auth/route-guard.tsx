"use client";

import { useAuth } from "@/context/auth-context";
import { getDefaultPathForRole } from "@/lib/role-routes";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";

interface RouteGuardProps {
  canAccess: boolean;
  children: ReactNode;
}

/** 无权限访问当前路由时跳转到角色默认板块 */
export function RouteGuard({ canAccess, children }: RouteGuardProps) {
  const { user, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated || canAccess) return;
    router.replace(
      user
        ? getDefaultPathForRole(user.role, user.accessLevel)
        : "/",
    );
  }, [isHydrated, canAccess, user, router]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
        加载中…
      </div>
    );
  }

  if (!canAccess) return null;

  return <>{children}</>;
}
