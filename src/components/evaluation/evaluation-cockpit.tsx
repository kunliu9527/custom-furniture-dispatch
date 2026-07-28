"use client";

import type { AutoSnapshotResult } from "@/lib/evaluation-auto-snapshot";
import type { OperationsBrief } from "@/lib/operations-brief";
import {
  managerFocusHref,
  type ManagerFocus,
} from "@/lib/manager-deep-link";
import Link from "next/link";

interface EvaluationCockpitProps {
  brief: OperationsBrief;
  scopeLabel: string | null;
  snapshotStatus?: AutoSnapshotResult | null;
  isDemoTrend?: boolean;
}

export function EvaluationCockpit({
  brief,
  scopeLabel,
  snapshotStatus = null,
  isDemoTrend = false,
}: EvaluationCockpitProps) {
  const metaSubtitle = (
    <>
      {brief.periodLabel}
      {brief.isCumulative ? " · 累计" : null}
      {scopeLabel ? ` · 所属：${scopeLabel}` : " · 全公司"}
      {brief.previousPeriodLabel
        ? ` · 环比参照 ${brief.previousPeriodLabel}`
        : null}
      {brief.secondaryCompareHint ? ` · ${brief.secondaryCompareHint}` : null}
      {snapshotStatus === "saved" ? " · 本月快照已自动归档" : null}
      {snapshotStatus === "exists" ? " · 快照已存在" : null}
      {isDemoTrend ? " · 含演示趋势（非正式数据）" : null}
    </>
  );

  return (
    <div className="space-y-4">
      {/* KPI 区：滚动时固定在站点导航下方 */}
      <section className="vi-panel">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">管理驾驶舱</h2>
              <p className="mt-0.5 text-xs text-slate-500">{metaSubtitle}</p>
            </div>
            <Link
              href={managerFocusHref("flow-timeout")}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              前往项目进程管理处理异常 →
            </Link>
          </div>

          {isDemoTrend ? (
            <div
              className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950"
              role="status"
            >
              <span className="font-semibold">演示趋势数据</span>
              ：当前环境注入了示例趋势/问题标签，仅供界面验收，
              <span className="font-semibold">请勿当作真实经营指标</span>。
            </div>
          ) : null}

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {brief.kpis.map((kpi) => {
              const hasCompare =
                kpi.deltaLabel || kpi.wowLabel || kpi.yoyLabel;
              const deltaTone =
                kpi.id === "refund"
                  ? kpi.deltaPercent != null && kpi.deltaPercent > 0
                    ? "text-rose-600"
                    : "text-emerald-600"
                  : kpi.id === "acceptance"
                    ? kpi.deltaLabel?.includes("↑")
                      ? "text-emerald-600"
                      : kpi.deltaLabel?.includes("↓")
                        ? "text-rose-600"
                        : "text-slate-500"
                    : kpi.deltaPercent != null && kpi.deltaPercent < 0
                      ? "text-rose-600"
                      : "text-emerald-600";

              return (
                <div
                  key={kpi.id}
                  className="flex min-h-[7.5rem] flex-col rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                >
                  <p className="text-xs text-slate-500">{kpi.label}</p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
                    {kpi.value}
                    {brief.isCumulative && kpi.id !== "acceptance" ? (
                      <span className="ml-1 text-xs font-normal text-slate-400">
                        累计
                      </span>
                    ) : null}
                  </p>
                  <p className="min-h-[1rem] text-[11px] text-slate-400">
                    {kpi.detail ?? "\u00A0"}
                  </p>
                  <div
                    className={`mt-auto flex min-h-[2rem] flex-wrap items-center gap-x-2 gap-y-0.5 pt-1 text-[11px] ${
                      hasCompare ? "" : "invisible"
                    }`}
                  >
                    {kpi.deltaLabel ? (
                      <span className={deltaTone}>{kpi.deltaLabel}</span>
                    ) : null}
                    {kpi.wowLabel ? (
                      <span className="text-blue-600">{kpi.wowLabel}</span>
                    ) : null}
                    {kpi.yoyLabel ? (
                      <span className="text-slate-500">{kpi.yoyLabel}</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3">
            {brief.anomalies.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2">
                <span className="text-xs font-medium text-amber-900">
                  工单待办
                </span>
                {brief.anomalies.map((a) => (
                  <Link
                    key={a.id}
                    href={managerFocusHref(a.id as ManagerFocus)}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200 transition hover:bg-amber-100"
                  >
                    {a.label}
                    <span className="font-semibold text-rose-600">
                      {a.count}
                    </span>
                    {a.hint ? (
                      <span className="font-normal text-amber-700/80">
                        {a.hint}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-700">
                当前无流程超时、待扫码验收等待办异常
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
