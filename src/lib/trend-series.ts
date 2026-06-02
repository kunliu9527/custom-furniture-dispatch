import { getAcceptanceEvaluationSummary } from "./acceptance-evaluation-stats";
import { formatDispatchMoney } from "./dispatch-totals";
import { classifyDispatcherOrder } from "./evaluation-stats";
import { getManagerAlerts } from "./manager-alerts";
import {
  filterOrdersByPeriod,
  filterSupplementsByPeriod,
  formatPeriodLabel,
  getPeriodBounds,
  listRecentYearMonths,
  parseYearMonth,
  yearMonthToPeriod,
  type PeriodSelection,
} from "./period-filter";
import { getStageTimeoutAlert } from "./stage-intervals";
import type { MonthlyCockpitSnapshot } from "./monthly-snapshot-types";
import type { Order, SupplementOrder } from "./types";

export type TrendMonthSpan = 3 | 6 | 12;

export const TREND_MONTH_SPAN_OPTIONS: { value: TrendMonthSpan; label: string }[] =
  [
    { value: 3, label: "近3月" },
    { value: 6, label: "近6月" },
    { value: 12, label: "近12月" },
  ];

export interface TrendMonthPoint {
  yearMonth: string;
  label: string;
  newDispatchCount: number;
  signedContractAmount: number;
  orderedAmount: number;
  orderedCount: number;
  refundCount: number;
  refundAmount: number;
  acceptanceAvg: number | null;
  flowTimeoutCount: number;
  signTimeoutCount: number;
  pendingAcceptanceCount: number;
  /** 演示数据标记 */
  isDemo?: boolean;
}

export type RiskTrendMetricKey =
  | "flowTimeoutCount"
  | "signTimeoutCount"
  | "pendingAcceptanceCount";

export const RISK_TREND_METRIC_OPTIONS: {
  key: RiskTrendMetricKey;
  label: string;
  color: string;
}[] = [
  { key: "flowTimeoutCount", label: "流程超时", color: "#e11d48" },
  { key: "signTimeoutCount", label: "签约超时", color: "#c2410c" },
  { key: "pendingAcceptanceCount", label: "待扫码验收", color: "#9333ea" },
];

export type TrendMetricKey =
  | "newDispatchCount"
  | "signedContractAmount"
  | "orderedAmount"
  | "refundCount"
  | "refundAmount"
  | "acceptanceAvg";

export const TREND_COUNT_METRICS: TrendMetricKey[] = [
  "newDispatchCount",
  "refundCount",
  "acceptanceAvg",
];

export const TREND_AMOUNT_METRICS: TrendMetricKey[] = [
  "signedContractAmount",
  "orderedAmount",
  "refundAmount",
];

export function isCountTrendMetric(key: TrendMetricKey): boolean {
  return (TREND_COUNT_METRICS as string[]).includes(key);
}

export const TREND_METRIC_OPTIONS: {
  key: TrendMetricKey;
  label: string;
  format: (v: number) => string;
  color: string;
  axis: "count" | "amount";
}[] = [
  {
    key: "newDispatchCount",
    label: "新派单",
    format: (v) => `${v} 笔`,
    color: "#4f46e5",
    axis: "count",
  },
  {
    key: "signedContractAmount",
    label: "签约额",
    format: (v) => formatDispatchMoney(v),
    color: "#0d9488",
    axis: "amount",
  },
  {
    key: "orderedAmount",
    label: "下单额",
    format: (v) => formatDispatchMoney(v),
    color: "#2563eb",
    axis: "amount",
  },
  {
    key: "refundCount",
    label: "退单笔数",
    format: (v) => `${v} 笔`,
    color: "#f43f5e",
    axis: "count",
  },
  {
    key: "refundAmount",
    label: "退单金额",
    format: (v) => formatDispatchMoney(v),
    color: "#be123c",
    axis: "amount",
  },
  {
    key: "acceptanceAvg",
    label: "验收均分",
    format: (v) => (v > 0 ? `${v.toFixed(1)} 星` : "—"),
    color: "#d97706",
    axis: "count",
  },
];

function formatMonthLabel(yearMonth: string): string {
  const parsed = parseYearMonth(yearMonth);
  if (!parsed) return yearMonth;
  return `${parsed.month}月`;
}

function signedInPeriod(order: Order, period: PeriodSelection): boolean {
  const at = order.contract?.signedAt;
  if (!at) return false;
  return filterOrdersByPeriod([order], period).length > 0;
}

function countPendingAcceptanceAt(orders: Order[], monthEnd: Date): number {
  return orders.filter((o) => {
    if (o.status !== "已安装") return false;
    const installedAt = o.statusEnteredAt?.["已安装"];
    if (!installedAt) return true;
    const t = new Date(installedAt).getTime();
    return Number.isFinite(t) && t <= monthEnd.getTime();
  }).length;
}

function aggregateMonthPoint(
  orders: Order[],
  supplements: SupplementOrder[],
  yearMonth: string,
): TrendMonthPoint {
  const period = yearMonthToPeriod(yearMonth);
  const periodOrders = filterOrdersByPeriod(orders, period);
  const periodSupplements = filterSupplementsByPeriod(supplements, period);

  let orderedAmount = 0;
  let orderedCount = 0;
  let refundCount = 0;
  let refundAmount = 0;
  let signedContractAmount = 0;

  for (const order of periodOrders) {
    const parts = classifyDispatcherOrder(order, periodSupplements);
    orderedAmount += parts.ordered.amount;
    orderedCount += parts.ordered.count;
    refundCount += parts.pendingRefund.count + parts.confirmedRefund.count;
    refundAmount += parts.pendingRefund.amount + parts.confirmedRefund.amount;
    if (signedInPeriod(order, period)) {
      signedContractAmount += order.contract?.contractAmount ?? 0;
    }
  }

  const bounds = getPeriodBounds(period);
  const newDispatchCount = bounds
    ? orders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return (
          Number.isFinite(t) &&
          t >= bounds.start.getTime() &&
          t < bounds.end.getTime()
        );
      }).length
    : 0;

  const acceptance = getAcceptanceEvaluationSummary(periodOrders);

  const monthEnd = bounds
    ? new Date(bounds.end.getTime() - 1)
    : new Date();
  const periodOrderIds = new Set(periodOrders.map((o) => o.id));
  const flowTimeoutCount = getManagerAlerts(orders, monthEnd).filter((a) =>
    periodOrderIds.has(a.orderId),
  ).length;
  let signTimeoutCount = 0;
  for (const order of orders) {
    if (!periodOrderIds.has(order.id)) continue;
    if (order.status === "待签约" && getStageTimeoutAlert(order, monthEnd)) {
      signTimeoutCount += 1;
    }
  }

  return {
    yearMonth,
    label: formatMonthLabel(yearMonth),
    newDispatchCount,
    signedContractAmount,
    orderedAmount,
    orderedCount,
    refundCount,
    refundAmount,
    acceptanceAvg: acceptance.ratedCount > 0 ? acceptance.avgOverall : null,
    flowTimeoutCount,
    signTimeoutCount,
    pendingAcceptanceCount: countPendingAcceptanceAt(orders, monthEnd),
  };
}

export function buildMonthlyTrendSeries(
  orders: Order[],
  supplements: SupplementOrder[],
  monthCount: TrendMonthSpan | number = 6,
  ref = new Date(),
): TrendMonthPoint[] {
  return listRecentYearMonths(monthCount, ref).map((ym) =>
    aggregateMonthPoint(orders, supplements, ym),
  );
}

export function mergeTrendPointWithSnapshot(
  point: TrendMonthPoint,
  cockpit: MonthlyCockpitSnapshot | null | undefined,
): TrendMonthPoint {
  if (!cockpit) return point;
  return {
    ...point,
    newDispatchCount: Math.max(point.newDispatchCount, cockpit.newDispatchCount),
    signedContractAmount: Math.max(
      point.signedContractAmount,
      cockpit.signedContractAmount,
    ),
    orderedAmount: Math.max(point.orderedAmount, cockpit.orderedAmount),
    refundCount: Math.max(point.refundCount, cockpit.refundCount),
    refundAmount: Math.max(point.refundAmount, cockpit.refundAmount ?? 0),
    acceptanceAvg: point.acceptanceAvg ?? cockpit.acceptanceAvg,
    pendingAcceptanceCount: Math.max(
      point.pendingAcceptanceCount,
      cockpit.pendingAcceptanceCount ?? 0,
    ),
  };
}

export async function enrichTrendSeriesWithArchives(
  points: TrendMonthPoint[],
  fetchSnapshot: (yearMonth: string) => Promise<{
    cockpit?: MonthlyCockpitSnapshot;
    scopeLabel?: string;
  } | null>,
  options?: { scopeLabel?: string | null },
): Promise<TrendMonthPoint[]> {
  return Promise.all(
    points.map(async (point) => {
      const snap = await fetchSnapshot(point.yearMonth);
      if (!snap?.cockpit) return point;
      if (options?.scopeLabel) {
        if (snap.scopeLabel !== options.scopeLabel) return point;
      } else if (snap.scopeLabel) {
        return point;
      }
      return mergeTrendPointWithSnapshot(point, snap.cockpit);
    }),
  );
}

export function periodLabelForYearMonth(yearMonth: string): string {
  return formatPeriodLabel(yearMonthToPeriod(yearMonth));
}

export function countSignTimeouts(orders: Order[], now = new Date()): number {
  let count = 0;
  for (const order of orders) {
    if (order.status === "待签约" && getStageTimeoutAlert(order, now)) {
      count += 1;
    }
  }
  return count;
}

export function countPendingAcceptanceScan(orders: Order[]): number {
  return orders.filter((o) => o.status === "已安装").length;
}

export function countPendingRefund(orders: Order[]): number {
  return orders.filter((o) => o.status === "待退单").length;
}
