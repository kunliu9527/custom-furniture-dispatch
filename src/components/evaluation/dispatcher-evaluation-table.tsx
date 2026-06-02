import {
  EvaluationTableScroll,
  TABLE_HEAD_STICKY_CLASS,
  TABLE_TH_CLASS,
} from "@/components/evaluation/evaluation-table-scroll";
import { TableAlgorithmCaption } from "@/components/shared/table-algorithm-caption";
import {
  AGGREGATE_LABEL,
  aggregateRefundTotal,
} from "@/lib/metric-display-labels";
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

interface DispatcherEvaluationTableProps {
  nameColumnLabel: string;
  rows: DispatcherEvaluationRow[];
  emptyMessage?: string;
  footnote?: string;
  designerExtendedMetrics?: boolean;
}

const thClass = TABLE_TH_CLASS;
const tdClass = "px-3 py-2 text-sm text-slate-700 whitespace-nowrap";

const amountColumns = [
  { key: "notOrdered" as const, label: AGGREGATE_LABEL.notOrdered },
  { key: "ordered" as const, label: AGGREGATE_LABEL.ordered },
  { key: "pendingRefund" as const, label: AGGREGATE_LABEL.pendingRefund },
  { key: "confirmedRefund" as const, label: AGGREGATE_LABEL.confirmedRefund },
];

const designerExtraColumns = [
  { key: "conversion" as const, label: "下单转化率" },
  { key: "average" as const, label: "平均下单额" },
  { key: "afterSales" as const, label: "售后金额" },
] as const;

export function DispatcherEvaluationTable({
  nameColumnLabel,
  rows,
  emptyMessage = "暂无数据",
  footnote = EVALUATION_AMOUNT_RULES,
  designerExtendedMetrics = false,
}: DispatcherEvaluationTableProps) {
  const dataRows = rows.filter((row) => !row.isWorkflowSummary);
  const workflowRow = rows.find((row) => row.isWorkflowSummary);
  const workflowRefundTotal = workflowRow
    ? aggregateRefundTotal(
        workflowRow.pendingRefund,
        workflowRow.confirmedRefund,
      )
    : null;

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

  const minWidth = designerExtendedMetrics ? "min-w-[1280px]" : "min-w-[1000px]";

  return (
    <EvaluationTableScroll
      footer={
        <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-400">
          共 {dataRows.length} 条 · {footnote}
          {designerExtendedMetrics ? ` · ${DESIGNER_EXTENDED_RANK_RULES}` : ""}
        </p>
      }
    >
      <table className={`vi-data-table w-full ${minWidth} border-collapse text-left`}>
        <thead>
          <TableAlgorithmCaption>
            {footnote}
            {designerExtendedMetrics ? ` · ${DESIGNER_EXTENDED_RANK_RULES}` : ""}
          </TableAlgorithmCaption>
          <tr className={`vi-table-head-row ${TABLE_HEAD_STICKY_CLASS}`}>
            <th
              className={`${thClass} min-w-[120px] sticky left-0 z-20 vi-table-head-cell shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]`}
            >
              {nameColumnLabel}
            </th>
            <th className={`${thClass} text-center`}>{AGGREGATE_LABEL.total}</th>
            {amountColumns.map((col) => (
              <th key={col.key} className={`${thClass} text-center`}>
                {col.label}
              </th>
            ))}
            <th className={`${thClass} text-center`}>
              {AGGREGATE_LABEL.refundTotal}
            </th>
            {designerExtendedMetrics
              ? designerExtraColumns.map((col) => (
                  <th key={col.key} className={`${thClass} text-center`}>
                    {col.label}
                  </th>
                ))
              : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {dataRows.map((row) => (
            <tr key={row.key} className="hover:bg-slate-50/50">
              <td
                className={`${tdClass} sticky left-0 z-[1] bg-white font-medium text-slate-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.04)]`}
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
                className={`${tdClass} sticky left-0 z-[1] bg-rose-50/95 font-semibold text-rose-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.04)]`}
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
