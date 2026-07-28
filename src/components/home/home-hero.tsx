"use client";

import { useAuth } from "@/context/auth-context";
import { ACCESS_LEVEL_LABELS } from "@/lib/staff-access";

/** 仅登录后显示；未登录由 HomeGuestLanding 承接 */
export function HomeHero() {
  const { user, isHydrated } = useAuth();

  if (!isHydrated || !user) return null;

  const today = new Date().toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p
          className="text-[12px] font-medium"
          style={{ color: "var(--label-tertiary)" }}
        >
          {today} · 今日工作台
        </p>
        <h1
          className="mt-1 text-[22px] font-semibold tracking-tight sm:text-[24px]"
          style={{ color: "var(--label-primary)" }}
        >
          {user.displayName}
          <span
            className="ml-2 text-[14px] font-medium"
            style={{ color: "var(--label-secondary)" }}
          >
            {ACCESS_LEVEL_LABELS[user.accessLevel]}
          </span>
        </h1>
      </div>
      <p
        className="max-w-sm text-[13px] leading-snug"
        style={{ color: "var(--label-tertiary)" }}
      >
        下方履约分区可进入各环节；工作台用顶栏切换。
      </p>
    </div>
  );
}
