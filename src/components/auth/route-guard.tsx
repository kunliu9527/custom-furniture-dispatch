"use client";

import { useAuth } from "@/context/auth-context";
import { getDefaultPathForSession } from "@/lib/role-routes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

interface RouteGuardProps {
  canAccess: boolean;
  children: ReactNode;
}

/** 无权限访问当前路由时提示并回到角色默认入口 */
export function RouteGuard({ canAccess, children }: RouteGuardProps) {
  const { user, isHydrated } = useAuth();
  const router = useRouter();
  const [deniedPath, setDeniedPath] = useState("/");

  useEffect(() => {
    if (!isHydrated || canAccess) return;
    const fallback = user ? getDefaultPathForSession(user) : "/";
    setDeniedPath(fallback);
    const timer = window.setTimeout(() => {
      router.replace(fallback);
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [isHydrated, canAccess, user, router]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
        加载中…
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-base font-semibold text-slate-900">
          没有权限访问此板块
        </p>
        <p className="text-sm leading-relaxed text-slate-500">
          {user
            ? "当前账号无权打开该工作台。将返回你的默认入口；也可从顶栏进入有权限的板块。"
            : "请先登录后再访问工作台。"}
        </p>
        <Link
          href={deniedPath}
          className="mt-1 inline-flex min-h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {user ? "返回工作台" : "返回首页"}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
