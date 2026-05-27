"use client";

import { useAuth } from "@/context/auth-context";
import { getVisibleNavLinks } from "@/lib/nav-access";
import Link from "next/link";

const boardMeta: Record<
  string,
  { title: string; description: string; accent: string }
> = {
  "/admin": {
    title: "门店派单",
    description: "录入订单、查找在途定单",
    accent: "from-indigo-500 to-violet-600",
  },
  "/designer": {
    title: "设计师工作台",
    description: "跟单、备注与状态更新",
    accent: "from-emerald-500 to-teal-600",
  },
  "/manager": {
    title: "设计经理看板",
    description: "门店汇总与设计师业绩",
    accent: "from-amber-500 to-orange-600",
  },
  "/evaluation": {
    title: "评价看板",
    description: "派单、设计师与门店排名",
    accent: "from-rose-500 to-pink-600",
  },
};

export function HomeBoardCards() {
  const { user, isHydrated } = useAuth();
  const loggedIn = Boolean(user);
  const links = loggedIn
    ? getVisibleNavLinks(user)
    : [
        { href: "/admin", label: "门店派单" },
        { href: "/designer", label: "设计师工作台" },
        { href: "/manager", label: "设计经理看板" },
        { href: "/evaluation", label: "评价看板" },
      ];

  return (
    <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {links.map((item) => {
        const meta = boardMeta[item.href];
        if (!meta) return null;

        const cardClass =
          "group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition";

        const accentBar = (
          <div
            className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${meta.accent}`}
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
              <h2 className="text-lg font-semibold text-slate-800">{meta.title}</h2>
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
              <span className="transition group-hover:translate-x-0.5" aria-hidden>
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
