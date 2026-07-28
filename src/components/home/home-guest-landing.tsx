"use client";

import { useAuth } from "@/context/auth-context";
import { BOARD_META } from "@/lib/board-meta";
import { DEFAULT_SITE_BRANDING } from "@/lib/site-branding";
import type { NavHref } from "@/lib/nav-access";

const WORKFLOW = [
  "未派单",
  "待量尺",
  "已量尺",
  "已出图",
  "待签约",
  "已签约",
  "已下单",
  "已安装",
  "已验收",
] as const;

const MODULES: { href: NavHref; accentGradient: string }[] = [
  { href: "/admin", accentGradient: "from-indigo-500 to-violet-600" },
  { href: "/designer", accentGradient: "from-emerald-500 to-teal-600" },
  { href: "/manager", accentGradient: "from-amber-500 to-orange-600" },
  { href: "/delivery", accentGradient: "from-cyan-500 to-sky-600" },
  { href: "/evaluation", accentGradient: "from-rose-500 to-pink-600" },
];

/** 未登录门户首页（对齐历史落地页视觉：居中标题 + 流程 pill + 彩色顶边卡片） */
export function HomeGuestLanding() {
  const { user, isHydrated, siteBranding } = useAuth();
  const headline =
    siteBranding.headlineTitle || DEFAULT_SITE_BRANDING.headlineTitle;
  const badge = siteBranding.badgeLabel || DEFAULT_SITE_BRANDING.badgeLabel;

  if (!isHydrated || user) return null;

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-0 h-[min(100%,42rem)] w-screen -translate-x-1/2 bg-gradient-to-b from-indigo-50/70 via-slate-50 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-0 h-80 w-screen -translate-x-1/2 bg-[radial-gradient(ellipse_80%_55%_at_50%_-8%,rgba(99,102,241,0.16),transparent)]"
        aria-hidden
      />

      <div className="relative z-[1] mx-auto max-w-5xl pt-6 pb-10 sm:pt-10 sm:pb-14">
        <div className="text-center">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium tracking-wide text-indigo-700 ring-1 ring-indigo-600/10">
            {badge}
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="inline-block rounded-2xl bg-indigo-100 px-5 py-2.5 text-indigo-900 shadow-sm ring-1 ring-indigo-200/80">
              {headline}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
            从销售录单、门店派单、设计跟单到安装验收与客户评价——全流程协同工作台。登录后按权限进入各板块；数据按部署环境同步（本机或云端）。
          </p>
        </div>

        <div className="mt-10 text-center">
          <ol className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
            {WORKFLOW.map((step, index) => (
              <li key={step} className="flex items-center gap-1 sm:gap-1.5">
                <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 shadow-sm ring-1 ring-slate-200/80">
                  {step}
                </span>
                {index < WORKFLOW.length - 1 ? (
                  <span className="select-none text-slate-300" aria-hidden>
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {MODULES.map((item) => {
            const meta = BOARD_META[item.href];
            if (!meta) return null;
            return (
              <div
                key={item.href}
                className="group relative overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                aria-disabled
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${item.accentGradient}`}
                  aria-hidden
                />
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
          })}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          请使用右上角登录进入工作台
        </p>
      </div>
    </div>
  );
}
