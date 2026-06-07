"use client";

import { useAuth } from "@/context/auth-context";
import { useOrders } from "@/context/orders-context";
import { buildRoleDailyTodos } from "@/lib/daily-todos";
import Link from "next/link";
import { useMemo } from "react";

export function TodayTodosPanel() {
  const { user } = useAuth();
  const { orders, isHydrated } = useOrders();

  const snapshot = useMemo(
    () => buildRoleDailyTodos(user, orders, user?.username),
    [user, orders],
  );

  if (!user || !isHydrated) return null;

  return (
    <section className="mt-8 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="vi-label-caps text-amber-800/80">今日必做</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            {snapshot.totalCount > 0
              ? `${snapshot.totalCount} 项待跟进`
              : "暂无紧急待办"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{snapshot.headline}</p>
        </div>
        {snapshot.totalCount > 0 ? (
          <Link
            href={
              user.accessLevel === "design_manager" ||
              user.accessLevel === "general_manager" ||
              user.accessLevel === "admin" ||
              user.accessLevel === "store_manager"
                ? "/manager?section=reports"
                : user.role === "designer"
                  ? "/designer"
                  : user.role === "dispatcher"
                    ? "/admin?view=orderLookup"
                    : "/delivery"
            }
            className="vi-btn vi-btn-secondary shrink-0 text-sm"
          >
            查看全部
          </Link>
        ) : null}
      </div>

      {snapshot.items.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {snapshot.items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 transition hover:shadow-sm ${
                  item.urgent
                    ? "border-red-200/80 bg-red-50/50 hover:border-red-300"
                    : "border-slate-200/80 bg-white hover:border-amber-200"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{item.title}</p>
                  {item.subtitle ? (
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {item.subtitle}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs font-medium text-indigo-600">
                  处理 →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-amber-200/80 bg-white/70 px-4 py-6 text-center text-sm text-slate-500">
          当前没有需要立即处理的事项，可从下方进入各工作台。
        </p>
      )}
    </section>
  );
}
