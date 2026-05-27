"use client";

import { useAuth } from "@/context/auth-context";
import { getDefaultPathForRole } from "@/lib/role-routes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** 已登录用户访问首页时自动进入角色默认板块 */
export function HomeRedirect() {
  const { user, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated || !user) return;
    router.replace(getDefaultPathForRole(user.role, user.accessLevel));
  }, [isHydrated, user, router]);

  return null;
}
