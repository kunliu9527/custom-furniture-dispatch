"use client";

import type { FunnelStage } from "@/lib/conversion-funnel";

interface FunnelBarChartProps {
  stages: FunnelStage[];
}

export function FunnelBarChart({ stages }: FunnelBarChartProps) {
  if (stages.length === 0 || stages[0]!.count === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        当前周期暂无新派单，无法计算转化漏斗
      </p>
    );
  }

  const top = stages[0]!.count;

  return (
    <div className="space-y-2.5">
      {stages.map((stage) => {
        const widthPct = top > 0 ? Math.max(8, (stage.count / top) * 100) : 0;
        return (
          <div key={stage.key} className="grid grid-cols-[72px_1fr_auto] items-center gap-3">
            <span className="text-xs font-medium text-slate-600">{stage.label}</span>
            <div className="h-7 overflow-hidden rounded-md bg-slate-100">
              <div
                className="flex h-full items-center rounded-md bg-gradient-to-r from-indigo-500 to-indigo-400 px-2 text-[11px] font-medium text-white transition-all"
                style={{ width: `${widthPct}%` }}
              >
                {stage.count > 0 && widthPct > 18 ? stage.count : null}
              </div>
            </div>
            <span className="text-xs tabular-nums text-slate-500">
              {stage.count} 笔
              {stage.rate != null && stage.key !== "dispatch"
                ? ` · ${stage.rate}%`
                : null}
            </span>
          </div>
        );
      })}
      <p className="text-[11px] text-slate-400">
        以当期新派单为 cohort，百分比为相对新派单的到达率
      </p>
    </div>
  );
}
