"use client";

import { useAuth } from "@/context/auth-context";
import { BOARD_META } from "@/lib/board-meta";
import { getVisibleNavLinks } from "@/lib/nav-access";
import Link from "next/link";

export function HomeBoardCards() {
  const { user, isHydrated } = useAuth();
  const loggedIn = Boolean(user);
  const links = loggedIn
    ? getVisibleNavLinks(user)
    : [
        { href: "/admin" as const, label: "新客户开发" },
        { href: "/designer" as const, label: "设计师工作台" },
        { href: "/manager" as const, label: "项目进程管理" },
        { href: "/delivery" as const, label: "验收与交付" },
        { href: "/evaluation" as const, label: "综合系统看板" },
      ];

  return (
    <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {links.map((item) => {
        const meta = BOARD_META[item.href];
        if (!meta) return null;

        const cardClass =
          "vi-card vi-card-hover group relative overflow-hidden p-6";

        const accentBar = (
          <div
            className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${meta.accentGradient}`}
            aria-hidden
          />
        );

        if (!loggedIn) {
          return (
            <div
              key={item.href}
              className={`${cardClass} cursor-default opacity-95 hover:border-slate-300 hover:shadow-md`}
              aria-disabled
            >
              {accentBar}
              <h2 className="text-lg font-semibold text-slate-800">
                {meta.title}
              </h2>
              <p className="mt-1.5 text-sm leading-snug text-slate-500">
                {meta.description}
              </p>
              <span className="mt-5 inline-flex text-sm text-slate-400">
                请登录后进入
              </span>
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${cardClass} hover:-translate-y-0.5 hover:border-indigo-200/80 hover:shadow-md hover:shadow-indigo-100/50`}
          >
            {accentBar}
            <h2 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-700">
              {meta.title}
            </h2>
            <p className="mt-1.5 text-sm leading-snug text-slate-500 group-hover:text-slate-600">
              {meta.description}
            </p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
              进入
              <span
                className="transition group-hover:translate-x-0.5"
                aria-hidden
              >
                →
              </span>
            </span>
          </Link>
        );
      })}
      {!isHydrated ? (
        <p className="col-span-full text-center text-xs text-slate-400">
          加载登录状态…
        </p>
      ) : null}
    </div>
  );
}
