"use client";

import { useAuth } from "@/context/auth-context";
import { DEFAULT_SITE_BRANDING } from "@/lib/site-branding";

const WORKFLOW_STEPS = [
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

export function HomeHero() {
  const { siteBranding } = useAuth();
  const badge = siteBranding.badgeLabel || DEFAULT_SITE_BRANDING.badgeLabel;
  const headline =
    siteBranding.headlineTitle || DEFAULT_SITE_BRANDING.headlineTitle;

  return (
    <>
      <div className="text-center">
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium tracking-wide text-indigo-700 ring-1 ring-indigo-600/10">
          {badge}
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          <span className="inline-block rounded-2xl bg-indigo-100 px-5 py-2.5 text-indigo-900 shadow-sm ring-1 ring-indigo-200/80">
            {headline}
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
          从销售录单、门店派单、设计跟单到安装验收与客户评价——全流程协同工作台，数据实时同步。
        </p>
      </div>

      <div className="mt-10 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          状态流转
        </p>
        <ol className="mt-3 flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
          {WORKFLOW_STEPS.map((step, index) => (
            <li key={step} className="flex items-center gap-1 sm:gap-1.5">
              <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 shadow-sm ring-1 ring-slate-200/80">
                {step}
              </span>
              {index < WORKFLOW_STEPS.length - 1 ? (
                <span className="text-slate-300 select-none" aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
