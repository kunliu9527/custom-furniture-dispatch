"use client";

import type { FunnelCompare } from "@/lib/conversion-funnel";

interface FunnelCompareChartProps {
  compare: FunnelCompare;
}

export function FunnelCompareChart({ compare }: FunnelCompareChartProps) {
  const { current, previous, currentLabel, previousLabel } = compare;

  if (current.length === 0 || current[0]!.count === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        当前周期暂无新派单，无法计算转化漏斗
      </p>
    );
  }

  const top = current[0]!.count;
  const prevTop = previous[0]?.count ?? 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[72px_1fr_1fr] gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span />
        <span className="text-center font-medium text-blue-700">{currentLabel}</span>
        <span className="text-center font-medium text-slate-600">{previousLabel}</span>
      </div>

      {current.map((stage, index) => {
        const prevStage = previous[index];
        const widthCurrent =
          top > 0 ? Math.max(6, (stage.count / top) * 100) : 0;
        const widthPrevious =
          prevTop > 0 && prevStage
            ? Math.max(6, (prevStage.count / prevTop) * 100)
            : 0;

        return (
          <div
            key={stage.key}
            className="grid grid-cols-[72px_1fr_1fr] items-center gap-3"
          >
            <span className="text-xs font-medium text-slate-600">
              {stage.label}
            </span>
            <div className="space-y-0.5">
              <div className="h-6 overflow-hidden rounded-md bg-slate-100">
                <div
                  className="h-full rounded-md bg-gradient-to-r from-blue-500 to-blue-400"
                  style={{ width: `${widthCurrent}%` }}
                />
              </div>
              <p className="text-[11px] tabular-nums text-slate-500">
                {stage.count} 笔
                {stage.rate != null && stage.key !== "dispatch"
                  ? ` · ${stage.rate}%`
                  : null}
              </p>
            </div>
            <div className="space-y-0.5">
              <div className="h-6 overflow-hidden rounded-md bg-slate-100">
                <div
                  className="h-full rounded-md bg-gradient-to-r from-slate-400 to-slate-300"
                  style={{ width: `${widthPrevious}%` }}
                />
              </div>
              <p className="text-[11px] tabular-nums text-slate-500">
                {prevStage ? (
                  <>
                    {prevStage.count} 笔
                    {prevStage.rate != null && prevStage.key !== "dispatch"
                      ? ` · ${prevStage.rate}%`
                      : null}
                  </>
                ) : (
                  "—"
                )}
              </p>
            </div>
          </div>
        );
      })}

      <p className="text-[11px] text-slate-400">
        左：{currentLabel} 新派单 cohort · 右：{previousLabel} 对比（均为相对各自新派单的到达率）
      </p>
    </div>
  );
}
