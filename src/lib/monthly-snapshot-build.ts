import {
  getDesignerPerformanceRows,
  getMonthlyReportOverview,
} from "./designer-performance";
import { aggregateIssueTags } from "./issue-tag-stats";
import type { StaffRecord } from "./staff-roster";
import type { PeriodSelection } from "./period-filter";
import type { Order, SupplementOrder } from "./types";
import type { MonthlyMetricsSnapshot } from "./monthly-snapshot-types";

export function buildMonthlyMetricsSnapshot(
  orders: Order[],
  supplements: SupplementOrder[],
  period: PeriodSelection,
  options?: {
    savedBy?: string;
    scopeLabel?: string;
    designerNames?: string[] | null;
    staffRecords?: StaffRecord[];
  },
): MonthlyMetricsSnapshot {
  const overview = getMonthlyReportOverview(orders, supplements, period);
  const rows = getDesignerPerformanceRows(
    orders,
    supplements,
    options?.designerNames ?? null,
    undefined,
    options?.staffRecords ?? [],
    period,
  );

  const yearMonth =
    period.preset === "custom" && period.yearMonth
      ? period.yearMonth
      : period.preset === "lastMonth"
        ? lastMonthYm()
        : period.preset === "thisMonth"
          ? currentMonthYm()
          : currentMonthYm();

  return {
    yearMonth,
    savedAt: new Date().toISOString(),
    savedBy: options?.savedBy,
    scopeLabel: options?.scopeLabel,
    overview,
    designers: rows.map((r) => ({
      key: r.key,
      label: r.label,
      orderedCount: r.orderedCount,
      orderedAmount: r.orderedAmount,
      contributionScore: r.contributionScore,
      timeoutCount: r.timeoutCount,
      refundCount: r.refundCount,
    })),
    issueTagStats: aggregateIssueTags(orders, period),
  };
}

function currentMonthYm(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function lastMonthYm(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export interface MonthCompareDelta {
  label: string;
  current: number;
  previous: number | null;
  delta: number | null;
}

export function compareMonthlyOverview(
  current: MonthlyMetricsSnapshot,
  previous: MonthlyMetricsSnapshot | null,
): MonthCompareDelta[] {
  const prev = previous?.overview;
  const cur = current.overview;
  return [
    {
      label: "周期订单",
      current: cur.orderCount,
      previous: prev?.orderCount ?? null,
      delta:
        prev != null ? cur.orderCount - prev.orderCount : null,
    },
    {
      label: "已下单",
      current: cur.orderedCount,
      previous: prev?.orderedCount ?? null,
      delta:
        prev != null ? cur.orderedCount - prev.orderedCount : null,
    },
    {
      label: "下单金额",
      current: cur.orderedAmount,
      previous: prev?.orderedAmount ?? null,
      delta:
        prev != null ? cur.orderedAmount - prev.orderedAmount : null,
    },
    {
      label: "退单",
      current: cur.refundCount,
      previous: prev?.refundCount ?? null,
      delta: prev != null ? cur.refundCount - prev.refundCount : null,
    },
  ];
}
