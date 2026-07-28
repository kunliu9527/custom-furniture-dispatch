"use client";

import type { MonthlyReportOverview } from "@/lib/designer-performance";
import { formatDispatchMoney } from "@/lib/dispatch-totals";
import { AGGREGATE_KPI_LABEL } from "@/lib/metric-display-labels";
import type { OrderIssueTag } from "@/lib/types";

interface MonthlyOverviewCardProps {
  overview: MonthlyReportOverview;
  issueTagStats?: { tag: OrderIssueTag; count: number }[];
}

export function MonthlyOverviewCard({
  overview,
  issueTagStats = [],
}: MonthlyOverviewCardProps) {
  const items = [
    { label: "周期订单", value: String(overview.orderCount) },
    { label: AGGREGATE_KPI_LABEL.ordered, value: String(overview.orderedCount) },
    {
      label: `${AGGREGATE_KPI_LABEL.ordered}金额`,
      value: formatDispatchMoney(overview.orderedAmount),
    },
    { label: AGGREGATE_KPI_LABEL.refundTotal, value: String(overview.refundCount) },
    {
      label: "增补",
      value: formatDispatchMoney(overview.supplementAmount),
    },
    { label: "当前超时", value: String(overview.activeTimeoutCount) },
    { label: "在途合计", value: String(overview.inProgressCount) },
  ];

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
      <p className="text-sm font-semibold text-blue-900">
        {overview.periodLabel} · 总览
      </p>
      <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-[11px] text-blue-600/80">{item.label}</dt>
            <dd className="text-sm font-semibold tabular-nums text-slate-900">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
      {issueTagStats.length > 0 ? (
        <div className="mt-3 border-t border-blue-100/80 pt-3">
          <p className="text-[11px] font-medium text-blue-700">问题标签</p>
          <p className="mt-1 flex flex-wrap gap-2 text-xs text-blue-900">
            {issueTagStats.map((t) => (
              <span
                key={t.tag}
                className="rounded-md bg-white/80 px-2 py-0.5 ring-1 ring-blue-100"
              >
                {t.tag} {t.count}
              </span>
            ))}
          </p>
        </div>
      ) : null}
    </div>
  );
}
