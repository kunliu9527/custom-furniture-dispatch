"use client";

import { TableAlgorithmCaption } from "@/components/shared/table-algorithm-caption";
import { formatDispatchMoney } from "@/lib/dispatch-totals";
import { DISPATCHER_CONTRIBUTION_FORMULA } from "@/lib/performance-algorithm-copy";
import type { DispatcherPerformanceRow } from "@/lib/dispatcher-performance";

interface DispatcherPerformanceTableProps {
  rows: DispatcherPerformanceRow[];
  emptyMessage?: string;
}

export function DispatcherPerformanceTable({
  rows,
  emptyMessage = "暂无派单人绩效数据",
}: DispatcherPerformanceTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="vi-data-table min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <TableAlgorithmCaption>
            按贡献分降序排名 · {DISPATCHER_CONTRIBUTION_FORMULA}
          </TableAlgorithmCaption>
          <tr>
            <th className="px-3 py-2.5">名次</th>
            <th className="px-3 py-2.5">派单人</th>
            <th className="px-3 py-2.5" title={DISPATCHER_CONTRIBUTION_FORMULA}>
              贡献分
            </th>
            <th className="px-3 py-2.5">定金</th>
            <th className="px-3 py-2.5">签约额</th>
            <th className="px-3 py-2.5">下单额</th>
            <th className="px-3 py-2.5">前置交定</th>
            <th className="px-3 py-2.5">签约超时</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.key} className="border-t border-slate-100">
              <td className="px-3 py-2 tabular-nums text-slate-500">{index + 1}</td>
              <td className="px-3 py-2 font-medium">{row.label}</td>
              <td className="px-3 py-2 font-semibold text-rose-700">{row.contributionScore}</td>
              <td className="px-3 py-2">{formatDispatchMoney(row.depositTotal)}</td>
              <td className="px-3 py-2">{formatDispatchMoney(row.signedContractAmount)}</td>
              <td className="px-3 py-2">{formatDispatchMoney(row.orderedAmount)}</td>
              <td className="px-3 py-2">{row.preMeasureDepositCount}</td>
              <td className="px-3 py-2">{row.signTimeoutCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
