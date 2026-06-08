"use client";

import {
  EvaluationTableScroll,
  EVAL_DATA_TABLE_CLASS,
  TABLE_FOOTER_CLASS,
  TABLE_HEAD_STICKY_CLASS,
  TABLE_NAME_TD_CLASS,
  TABLE_NAME_TH_CLASS,
  TABLE_TD_CLASS,
  TABLE_TH_CLASS,
} from "@/components/evaluation/evaluation-table-scroll";
import { SortableTh } from "@/components/shared/sortable-table-header";
import { TableAlgorithmCaption } from "@/components/shared/table-algorithm-caption";
import {
  AGGREGATE_LABEL,
  aggregateRefundTotal,
} from "@/lib/metric-display-labels";
import {
  defaultAggregateSortDirection,
  sortDispatcherEvaluationDataRows,
  type AggregateSortColumn,
} from "@/lib/evaluation-table-sort";
import {
  DESIGNER_EXTENDED_RANK_RULES,
  EVALUATION_AMOUNT_RULES,
} from "@/lib/performance-algorithm-copy";
import {
  formatAfterSalesTotal,
  formatAverageOrderAmount,
  formatEvaluationMetric,
  formatOrderConversionRate,
  type DispatcherEvaluationRow,
} from "@/lib/evaluation-stats";
import { nextTableSortState, type TableSortState } from "@/lib/table-sort";
import type { BoardSnapshotConfig } from "@/lib/board-snapshot-types";
import { useMemo, useState } from "react";

interface DispatcherEvaluationTableProps {
  nameColumnLabel: string;
  rows: DispatcherEvaluationRow[];
  emptyMessage?: string;
  footnote?: string;
  designerExtendedMetrics?: boolean;
  snapshot?: BoardSnapshotConfig;
}

const thClass = TABLE_TH_CLASS;
const tdClass = TABLE_TD_CLASS;

const amountColumns: {
  key: "notOrdered" | "ordered" | "pendingRefund" | "confirmedRefund";
  label: string;
}[] = [
  { key: "notOrdered", label: AGGREGATE_LABEL.notOrdered },
  { key: "ordered", label: AGGREGATE_LABEL.ordered },
  { key: "pendingRefund", label: AGGREGATE_LABEL.pendingRefund },
  { key: "confirmedRefund", label: AGGREGATE_LABEL.confirmedRefund },
];

const designerExtraColumns: { key: AggregateSortColumn; label: string }[] = [
  { key: "conversion", label: "下单转化率" },
  { key: "average", label: "平均下单额" },
  { key: "afterSales", label: "售后金额" },
];

export function DispatcherEvaluationTable({
  nameColumnLabel,
  rows,
  emptyMessage = "暂无数据",
  footnote = EVALUATION_AMOUNT_RULES,
  designerExtendedMetrics = false,
  snapshot,
}: DispatcherEvaluationTableProps) {
  const [sort, setSort] = useState<TableSortState<AggregateSortColumn>>({
    column: null,
    direction: "desc",
  });

  const dataRows = rows.filter((row) => !row.isWorkflowSummary);
  const workflowRow = rows.find((row) => row.isWorkflowSummary);
  const sortedDataRows = useMemo(
    () => sortDispatcherEvaluationDataRows(dataRows, sort),
    [dataRows, sort],
  );
  const workflowRefundTotal = workflowRow
    ? aggregateRefundTotal(
        workflowRow.pendingRefund,
        workflowRow.confirmedRefund,
      )
    : null;

  const handleSort = (column: string) => {
    const col = column as AggregateSortColumn;
    setSort((current) =>
      nextTableSortState(current, col, defaultAggregateSortDirection(col)),
    );
  };

  if (dataRows.length === 0 && !workflowRow) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  function renderDesignerExtras(row: DispatcherEvaluationRow, emphasis = false) {
    const textClass = emphasis
      ? "font-medium text-rose-900"
      : "text-slate-800";
    return designerExtraColumns.map((col) => {
      let content = "—";
      if (col.key === "conversion") {
        content = formatOrderConversionRate(row.orderConversionRate);
      } else if (col.key === "average") {
        content = formatAverageOrderAmount(row.averageOrderAmount);
      } else {
        content = formatAfterSalesTotal(row.afterSalesAmount);
      }
      const empty =
        content === "—"
          ? "text-slate-300"
          : col.key === "afterSales"
            ? "text-amber-800"
            : textClass;
      return (
        <td
          key={col.key}
          className={`${tdClass} text-center text-xs ${empty}`}
        >
          {content}
        </td>
      );
    });
  }

  return (
    <EvaluationTableScroll
      snapshot={snapshot}
      footer={
        <p className={TABLE_FOOTER_CLASS}>
          共 {dataRows.length} 条 · 点击列标题排序（优先金额） · {footnote}
          {designerExtendedMetrics ? ` · ${DESIGNER_EXTENDED_RANK_RULES}` : ""}
        </p>
      }
    >
      <table className={EVAL_DATA_TABLE_CLASS}>
        <thead>
          <TableAlgorithmCaption>
            {footnote}
            {designerExtendedMetrics ? ` · ${DESIGNER_EXTENDED_RANK_RULES}` : ""}
          </TableAlgorithmCaption>
          <tr className={`vi-table-head-row ${TABLE_HEAD_STICKY_CLASS}`}>
            <SortableTh
              label={nameColumnLabel}
              column="label"
              activeColumn={sort.column}
              direction={sort.direction}
              onSort={handleSort}
              align="left"
              className={`${TABLE_NAME_TH_CLASS} sticky left-0 z-20 vi-table-head-cell shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]`}
            />
            <SortableTh
              label={AGGREGATE_LABEL.total}
              column="total"
              activeColumn={sort.column}
              direction={sort.direction}
              onSort={handleSort}
              className={thClass}
            />
            {amountColumns.map((col) => (
              <SortableTh
                key={col.key}
                label={col.label}
                column={col.key}
                activeColumn={sort.column}
                direction={sort.direction}
                onSort={handleSort}
                className={thClass}
              />
            ))}
            <th className={`${thClass} text-center`}>
              {AGGREGATE_LABEL.refundTotal}
            </th>
            {designerExtendedMetrics
              ? designerExtraColumns.map((col) => (
                  <SortableTh
                    key={col.key}
                    label={col.label}
                    column={col.key}
                    activeColumn={sort.column}
                    direction={sort.direction}
                    onSort={handleSort}
                    className={thClass}
                  />
                ))
              : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedDataRows.map((row) => (
            <tr key={row.key} className="hover:bg-slate-50/50">
              <td
                className={`${TABLE_NAME_TD_CLASS} sticky left-0 z-[1] bg-white font-medium text-slate-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.04)]`}
              >
                <div>{row.label}</div>
                {row.subtitle ? (
                  <div className="text-xs font-normal text-slate-500">
                    {row.subtitle}
                  </div>
                ) : null}
              </td>
              <td
                className={`${tdClass} text-center font-semibold text-indigo-700`}
              >
                {formatEvaluationMetric(row.total, row.totalAmount)}
              </td>
              {amountColumns.map((col) => {
                const cell = row[col.key];
                return (
                  <td
                    key={col.key}
                    className={`${tdClass} text-center text-xs ${
                      cell.count > 0 || cell.amount > 0
                        ? col.key === "pendingRefund"
                          ? "text-amber-800"
                          : col.key === "confirmedRefund"
                            ? "text-red-700"
                            : "text-slate-800"
                        : "text-slate-300"
                    }`}
                  >
                    {formatEvaluationMetric(cell.count, cell.amount)}
                  </td>
                );
              })}
              <td className={`${tdClass} text-center text-xs text-slate-300`}>
                —
              </td>
              {designerExtendedMetrics ? renderDesignerExtras(row) : null}
            </tr>
          ))}
          {workflowRow ? (
            <tr className="border-t-2 border-rose-100 bg-rose-50/40">
              <td
                className={`${TABLE_NAME_TD_CLASS} sticky left-0 z-[1] bg-rose-50/95 font-semibold text-rose-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.04)]`}
              >
                {workflowRow.label}
              </td>
              <td
                className={`${tdClass} text-center font-semibold text-rose-800`}
              >
                {formatEvaluationMetric(
                  workflowRow.total,
                  workflowRow.totalAmount,
                )}
              </td>
              {amountColumns.map((col) => {
                const cell = workflowRow[col.key];
                return (
                  <td
                    key={col.key}
                    className={`${tdClass} text-center text-xs font-medium text-rose-900`}
                  >
                    {formatEvaluationMetric(cell.count, cell.amount)}
                  </td>
                );
              })}
              <td
                className={`${tdClass} text-center text-xs font-medium text-rose-900`}
              >
                {workflowRefundTotal
                  ? formatEvaluationMetric(
                      workflowRefundTotal.count,
                      workflowRefundTotal.amount,
                    )
                  : "—"}
              </td>
              {designerExtendedMetrics
                ? renderDesignerExtras(workflowRow, true)
                : null}
            </tr>
          ) : null}
        </tbody>
      </table>
    </EvaluationTableScroll>
  );
}
