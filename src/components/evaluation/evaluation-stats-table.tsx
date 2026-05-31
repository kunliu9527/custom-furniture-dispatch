import { ORDER_STATUSES } from "@/lib/constants";
import {
  EvaluationTableScroll,
  TABLE_HEAD_STICKY_CLASS,
  TABLE_TH_CLASS,
} from "@/components/evaluation/evaluation-table-scroll";
import {
  formatEvaluationMetric,
  type WorkflowEvaluationRow,
} from "@/lib/evaluation-stats";

interface EvaluationStatsTableProps {
  nameColumnLabel: string;
  rows: WorkflowEvaluationRow[];
  emptyMessage?: string;
}

const thClass = TABLE_TH_CLASS;
const tdClass = "px-3 py-2 text-sm text-slate-700 whitespace-nowrap";

export function EvaluationStatsTable({
  nameColumnLabel,
  rows,
  emptyMessage = "暂无数据",
}: EvaluationStatsTableProps) {
  const dataRows = rows.filter((row) => !row.isWorkflowSummary);
  const workflowRow = rows.find((row) => row.isWorkflowSummary);

  const visibleStatuses = ORDER_STATUSES.filter(
    (status) =>
      rows.some((row) => row.byStatus[status] > 0) ||
      rows.some((row) => row.byStatusAmount[status] > 0),
  );
  const columns =
    visibleStatuses.length > 0 ? visibleStatuses : [...ORDER_STATUSES];

  if (dataRows.length === 0 && !workflowRow) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <EvaluationTableScroll>
      <table className="vi-data-table w-full min-w-[840px] border-collapse text-left">
        <thead>
          <tr className={`border-b-2 border-[var(--vi-border-strong)] bg-slate-50/80 ${TABLE_HEAD_STICKY_CLASS}`}>
            <th
              className={`${thClass} min-w-[120px] sticky left-0 z-20 bg-slate-50/95`}
            >
                {nameColumnLabel}
              </th>
              <th className={`${thClass} text-center`}>合计</th>
              {columns.map((status) => (
                <th key={status} className={`${thClass} text-center`}>
                  {status}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dataRows.map((row) => (
              <tr key={row.key} className="hover:bg-slate-50/50">
                <td
                  className={`${tdClass} sticky left-0 bg-white font-medium text-slate-900`}
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
                {columns.map((status) => (
                  <td
                    key={status}
                    className={`${tdClass} text-center text-xs ${
                      row.byStatus[status] > 0 || row.byStatusAmount[status] > 0
                        ? "text-slate-800"
                        : "text-slate-300"
                    }`}
                  >
                    {formatEvaluationMetric(
                      row.byStatus[status],
                      row.byStatusAmount[status],
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {workflowRow ? (
              <tr className="border-t-2 border-rose-100 bg-rose-50/40">
                <td
                  className={`${tdClass} sticky left-0 bg-rose-50/95 font-semibold text-rose-900`}
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
                {columns.map((status) => (
                  <td
                    key={status}
                    className={`${tdClass} text-center text-xs font-medium text-rose-900`}
                  >
                    {formatEvaluationMetric(
                      workflowRow.byStatus[status],
                      workflowRow.byStatusAmount[status],
                    )}
                  </td>
                ))}
              </tr>
            ) : null}
          </tbody>
        </table>
    </EvaluationTableScroll>
  );
}
