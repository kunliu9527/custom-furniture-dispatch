"use client";

import {
  formatAvgDays,
  formatContributionScore,
  formatPerformanceConversion,
  sortPerformanceRows,
  type DesignerPerformanceRow,
  type PerformanceRankKind,
} from "@/lib/designer-performance";
import { formatDispatchMoney } from "@/lib/dispatch-totals";
import {
  DESIGNER_CONTRIBUTION_FORMULA,
  DESIGNER_PERFORMANCE_RANK_TABS,
} from "@/lib/performance-algorithm-copy";
import { useMemo, useState } from "react";

const rankTabs: { id: PerformanceRankKind; label: string }[] = [
  { id: "contribution", label: "贡献分" },
  { id: "orderedAmount", label: "下单金额" },
  { id: "efficiency", label: "周期效率" },
  { id: "quality", label: "质量（超时/退单）" },
];

interface DesignerPerformanceTableProps {
  rows: DesignerPerformanceRow[];
  emptyMessage: string;
  periodLabel: string;
  onExportReport?: () => void;
}

export function DesignerPerformanceTable({
  rows,
  emptyMessage,
  periodLabel,
  onExportReport,
}: DesignerPerformanceTableProps) {
  const [rankKind, setRankKind] = useState<PerformanceRankKind>("contribution");

  const sorted = useMemo(
    () => sortPerformanceRows(rows, rankKind),
    [rows, rankKind],
  );

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="vi-segmented flex-wrap">
          {rankTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRankKind(tab.id)}
              className={`vi-segmented-item px-2.5 py-1 text-xs ${
                rankKind === tab.id ? "vi-segmented-item-active" : ""
              }`}
            >
              按{tab.label}排序
            </button>
          ))}
        </div>
        {onExportReport ? (
          <button
            type="button"
            onClick={onExportReport}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            导出{periodLabel}绩效报告 CSV
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="vi-data-table min-w-full text-left text-xs">
          <thead>
            <tr>
              <th
                colSpan={13}
                className="px-3 py-2 text-left text-[11px] font-normal leading-relaxed text-slate-500"
              >
                {DESIGNER_PERFORMANCE_RANK_TABS} · {DESIGNER_CONTRIBUTION_FORMULA}
              </th>
            </tr>
            <tr className="vi-table-head-row">
              <th className="px-3 py-2.5 font-bold">#</th>
              <th className="px-3 py-2.5 font-bold">设计师</th>
              <th className="px-3 py-2.5 font-bold tabular-nums">在途</th>
              <th className="px-3 py-2.5 font-bold tabular-nums">下单数</th>
              <th className="px-3 py-2.5 font-bold tabular-nums">下单额</th>
              <th className="px-3 py-2.5 font-bold tabular-nums">转化率</th>
              <th className="px-3 py-2.5 font-bold tabular-nums">均出图</th>
              <th className="px-3 py-2.5 font-bold tabular-nums">均总周期</th>
              <th className="px-3 py-2.5 font-bold tabular-nums">超时</th>
              <th className="px-3 py-2.5 font-bold tabular-nums">转派出/入</th>
              <th className="px-3 py-2.5 font-bold tabular-nums">月操作</th>
              <th className="px-3 py-2.5 font-bold tabular-nums">月推进</th>
              <th
                className="px-3 py-2.5 font-semibold tabular-nums"
                title={DESIGNER_CONTRIBUTION_FORMULA}
              >
                贡献分
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-800">
            {sorted.map((row, index) => (
              <tr key={row.key} className="hover:bg-slate-50/80">
                <td className="px-3 py-2.5 tabular-nums text-slate-400">
                  {index + 1}
                </td>
                <td className="px-3 py-2.5">
                  <span className="font-medium text-slate-900">{row.label}</span>
                  {row.subtitle ? (
                    <span className="ml-1 text-slate-400">{row.subtitle}</span>
                  ) : null}
                  {row.sampleTooSmall ? (
                    <span className="ml-1 rounded bg-amber-50 px-1 py-0.5 text-[10px] text-amber-700">
                      样本少
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2.5 tabular-nums">{row.inProgressCount}</td>
                <td className="px-3 py-2.5 tabular-nums">{row.orderedCount}</td>
                <td className="px-3 py-2.5 tabular-nums font-medium text-indigo-700">
                  {row.orderedAmount > 0
                    ? formatDispatchMoney(row.orderedAmount)
                    : "—"}
                </td>
                <td className="px-3 py-2.5 tabular-nums">
                  {formatPerformanceConversion(row.orderConversionRate)}
                </td>
                <td className="px-3 py-2.5 tabular-nums">
                  {formatAvgDays(row.avgDrawDays)}
                </td>
                <td className="px-3 py-2.5 tabular-nums">
                  {formatAvgDays(row.avgTotalDays)}
                </td>
                <td
                  className={`px-3 py-2.5 tabular-nums ${
                    row.timeoutCount > 0 ? "font-semibold text-rose-600" : ""
                  }`}
                >
                  {row.timeoutCount}
                </td>
                <td className="px-3 py-2.5 tabular-nums text-slate-600">
                  {row.transferOut}/{row.transferIn}
                </td>
                <td className="px-3 py-2.5 tabular-nums">{row.activityTotal}</td>
                <td className="px-3 py-2.5 tabular-nums">{row.activityAdvances}</td>
                <td className="px-3 py-2.5 tabular-nums font-semibold text-violet-700">
                  {formatContributionScore(row.contributionScore)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-400">
        月操作/月推进来自操作日志（自本功能上线后累计）。
        在途为当前进行中主流程单；超时为当前环节已超 SLA 的在途单。
        均出图/均总周期仅统计本周期内已有记录的订单。
      </p>
    </div>
  );
}
