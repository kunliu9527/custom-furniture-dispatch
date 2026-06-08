"use client";

import { SortableTh } from "@/components/shared/sortable-table-header";
import { TableAlgorithmCaption } from "@/components/shared/table-algorithm-caption";
import { formatDispatchMoney } from "@/lib/dispatch-totals";
import type { DispatcherPerformanceRow } from "@/lib/dispatcher-performance";
import {
  defaultDispatcherPerformanceSortDirection,
  sortDispatcherPerformanceRowsByColumn,
  type DispatcherPerformanceSortColumn,
} from "@/lib/evaluation-table-sort";
import { DISPATCHER_CONTRIBUTION_FORMULA } from "@/lib/performance-algorithm-copy";
import { nextTableSortState, type TableSortState } from "@/lib/table-sort";
import { useMemo, useState } from "react";

interface DispatcherPerformanceTableProps {
  rows: DispatcherPerformanceRow[];
  emptyMessage?: string;
}

export function DispatcherPerformanceTable({
  rows,
  emptyMessage = "暂无派单人绩效数据",
}: DispatcherPerformanceTableProps) {
  const [sort, setSort] = useState<TableSortState<DispatcherPerformanceSortColumn>>({
    column: "contributionScore",
    direction: "desc",
  });

  const sorted = useMemo(
    () => sortDispatcherPerformanceRowsByColumn(rows, sort),
    [rows, sort],
  );

  const handleSort = (column: string) => {
    const col = column as DispatcherPerformanceSortColumn;
    setSort((current) =>
      nextTableSortState(
        current,
        col,
        defaultDispatcherPerformanceSortDirection(col),
      ),
    );
  };

  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="vi-data-table min-w-full text-left text-sm">
        <thead>
          <TableAlgorithmCaption>
            点击列标题排序 · {DISPATCHER_CONTRIBUTION_FORMULA}
          </TableAlgorithmCaption>
          <tr className="vi-table-head-row">
            <th className="px-3 py-2.5">名次</th>
            <SortableTh
              label="派单人"
              column="label"
              activeColumn={sort.column}
              direction={sort.direction}
              onSort={handleSort}
              align="left"
              className="px-3 py-2.5"
            />
            <SortableTh
              label="贡献分"
              column="contributionScore"
              activeColumn={sort.column}
              direction={sort.direction}
              onSort={handleSort}
              className="px-3 py-2.5"
              title={DISPATCHER_CONTRIBUTION_FORMULA}
            />
            <SortableTh
              label="定金"
              column="depositTotal"
              activeColumn={sort.column}
              direction={sort.direction}
              onSort={handleSort}
              className="px-3 py-2.5"
            />
            <SortableTh
              label="签约额"
              column="signedContractAmount"
              activeColumn={sort.column}
              direction={sort.direction}
              onSort={handleSort}
              className="px-3 py-2.5"
            />
            <SortableTh
              label="下单额"
              column="orderedAmount"
              activeColumn={sort.column}
              direction={sort.direction}
              onSort={handleSort}
              className="px-3 py-2.5"
            />
            <SortableTh
              label="前置交定"
              column="preMeasureDepositCount"
              activeColumn={sort.column}
              direction={sort.direction}
              onSort={handleSort}
              className="px-3 py-2.5"
            />
            <SortableTh
              label="签约超时"
              column="signTimeoutCount"
              activeColumn={sort.column}
              direction={sort.direction}
              onSort={handleSort}
              className="px-3 py-2.5"
            />
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, index) => (
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
