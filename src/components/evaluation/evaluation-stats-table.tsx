import { ORDER_STATUSES } from "@/lib/constants";
import {
  formatEvaluationMetric,
  type WorkflowEvaluationRow,
} from "@/lib/evaluation-stats";

interface EvaluationStatsTableProps {
  nameColumnLabel: string;
  rows: WorkflowEvaluationRow[];
  emptyMessage?: string;
}

const thClass =
  "px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 whitespace-nowrap";
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
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th
                className={`${thClass} min-w-[120px] sticky left-0 bg-slate-50/95`}
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
      </div>
      <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-400">
        共 {dataRows.length} 条 · 按流程状态 · 单元格为 数量 / 金额 · 末行为流程累计
      </p>
    </div>
  );
}
