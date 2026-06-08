"use client";

import { SortableTh } from "@/components/shared/sortable-table-header";
import {
  formatAvgDays,
  formatContributionScore,
  formatPerformanceConversion,
  type DesignerPerformanceRow,
} from "@/lib/designer-performance";
import {
  defaultDesignerPerformanceSortDirection,
  sortDesignerPerformanceRowsByColumn,
  type DesignerPerformanceSortColumn,
} from "@/lib/evaluation-table-sort";
import { formatDispatchMoney } from "@/lib/dispatch-totals";
import {
  DESIGNER_CONTRIBUTION_FORMULA,
  DESIGNER_PERFORMANCE_RANK_TABS,
} from "@/lib/performance-algorithm-copy";
import { nextTableSortState, type TableSortState } from "@/lib/table-sort";
import { useMemo, useState } from "react";

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
  const [sort, setSort] = useState<TableSortState<DesignerPerformanceSortColumn>>({
    column: "contributionScore",
    direction: "desc",
  });

  const sorted = useMemo(
    () => sortDesignerPerformanceRowsByColumn(rows, sort),
    [rows, sort],
  );

  const handleSort = (column: string) => {
    const col = column as DesignerPerformanceSortColumn;
    setSort((current) =>
      nextTableSortState(
        current,
        col,
        defaultDesignerPerformanceSortDirection(col),
      ),
    );
  };

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
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
                {DESIGNER_PERFORMANCE_RANK_TABS} · 点击列标题排序（笔数/金额列优先金额） · {DESIGNER_CONTRIBUTION_FORMULA}
              </th>
            </tr>
            <tr className="vi-table-head-row">
              <th className="px-3 py-2.5 font-bold">#</th>
              <SortableTh
                label="设计师"
                column="label"
                activeColumn={sort.column}
                direction={sort.direction}
                onSort={handleSort}
                align="left"
                className="px-3 py-2.5"
              />
              <SortableTh
                label="在途"
                column="inProgressCount"
                activeColumn={sort.column}
                direction={sort.direction}
                onSort={handleSort}
                className="px-3 py-2.5 tabular-nums"
              />
              <SortableTh
                label="下单数"
                column="orderedCount"
                activeColumn={sort.column}
                direction={sort.direction}
                onSort={handleSort}
                className="px-3 py-2.5 tabular-nums"
              />
              <SortableTh
                label="下单额"
                column="orderedAmount"
                activeColumn={sort.column}
                direction={sort.direction}
                onSort={handleSort}
                className="px-3 py-2.5 tabular-nums"
              />
              <SortableTh
                label="转化率"
                column="orderConversionRate"
                activeColumn={sort.column}
                direction={sort.direction}
                onSort={handleSort}
                className="px-3 py-2.5 tabular-nums"
              />
              <SortableTh
                label="均出图"
                column="avgDrawDays"
                activeColumn={sort.column}
                direction={sort.direction}
                onSort={handleSort}
                className="px-3 py-2.5 tabular-nums"
              />
              <SortableTh
                label="均总周期"
                column="avgTotalDays"
                activeColumn={sort.column}
                direction={sort.direction}
                onSort={handleSort}
                className="px-3 py-2.5 tabular-nums"
              />
              <SortableTh
                label="超时"
                column="timeoutCount"
                activeColumn={sort.column}
                direction={sort.direction}
                onSort={handleSort}
                className="px-3 py-2.5 tabular-nums"
              />
              <SortableTh
                label="转派出/入"
                column="transfer"
                activeColumn={sort.column}
                direction={sort.direction}
                onSort={handleSort}
                className="px-3 py-2.5 tabular-nums"
              />
              <SortableTh
                label="月操作"
                column="activityTotal"
                activeColumn={sort.column}
                direction={sort.direction}
                onSort={handleSort}
                className="px-3 py-2.5 tabular-nums"
              />
              <SortableTh
                label="月推进"
                column="activityAdvances"
                activeColumn={sort.column}
                direction={sort.direction}
                onSort={handleSort}
                className="px-3 py-2.5 tabular-nums"
              />
              <SortableTh
                label="贡献分"
                column="contributionScore"
                activeColumn={sort.column}
                direction={sort.direction}
                onSort={handleSort}
                className="px-3 py-2.5 tabular-nums"
                title={DESIGNER_CONTRIBUTION_FORMULA}
              />
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
