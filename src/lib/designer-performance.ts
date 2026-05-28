import { buildEffectiveDesignerRoster } from "./personnel-roster";
import { buildDesignerHomeStoreIndex } from "./designer-staff-store";
import {
  classifyDispatcherOrder,
  formatOrderConversionRate,
} from "./evaluation-stats";
import { formatDispatchMoney } from "./dispatch-totals";
import {
  filterOrdersByPeriod,
  filterSupplementsByPeriod,
  formatPeriodLabel,
  getPeriodBounds,
  type PeriodSelection,
} from "./period-filter";
import { isRefundStatus } from "./order-utils";
import type { StaffRecord } from "./staff-roster";
import { summarizeDesignerActivity } from "./order-events";
import { getStageTimeoutAlert } from "./stage-intervals";
import type { FlowOrderStatus, Order, SupplementOrder } from "./types";

const IN_PROGRESS_STATUSES: FlowOrderStatus[] = [
  "待量尺",
  "已量尺",
  "已出图",
  "已签约",
];

const MIN_SAMPLE = 5;

export interface DesignerPerformanceRow {
  key: string;
  label: string;
  subtitle?: string;
  inProgressCount: number;
  orderedCount: number;
  orderedAmount: number;
  orderConversionRate: number | null;
  avgDrawDays: number | null;
  avgTotalDays: number | null;
  timeoutCount: number;
  transferOut: number;
  transferIn: number;
  refundCount: number;
  afterSalesAmount: number;
  contributionScore: number;
  activityTotal: number;
  activityAdvances: number;
  sampleTooSmall: boolean;
}

export interface MonthlyReportOverview {
  periodLabel: string;
  orderCount: number;
  orderedCount: number;
  orderedAmount: number;
  refundCount: number;
  supplementAmount: number;
  activeTimeoutCount: number;
  inProgressCount: number;
}

function isInProgress(order: Order): boolean {
  return IN_PROGRESS_STATUSES.includes(order.status as FlowOrderStatus);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** 贡献分：下单与增补正向，售后/退单/超时负向（可调参） */
export function computeContributionScore(input: {
  orderedAmount: number;
  supplementAmount: number;
  afterSalesAmount: number;
  refundedAmount: number;
  timeoutCount: number;
}): number {
  return Math.round(
    input.orderedAmount +
      input.supplementAmount * 0.8 -
      input.afterSalesAmount * 1.2 -
      input.refundedAmount * 0.5 -
      input.timeoutCount * 3000,
  );
}

function countTransfersInPeriod(
  order: Order,
  bounds: { start: Date; end: Date } | null,
  designer: string,
): { out: number; transferIn: number } {
  let out = 0;
  let transferIn = 0;
  for (const tr of order.transferRecords) {
    const t = new Date(tr.transferredAt).getTime();
    if (bounds) {
      if (
        !Number.isFinite(t) ||
        t < bounds.start.getTime() ||
        t >= bounds.end.getTime()
      ) {
        continue;
      }
    }
    if (tr.fromDesigner === designer) out += 1;
    if (tr.toDesigner === designer) transferIn += 1;
  }
  return { out, transferIn };
}

export function buildDesignerPerformanceRow(
  designer: string,
  periodOrders: Order[],
  supplements: SupplementOrder[],
  subtitle?: string,
  period?: PeriodSelection,
  allOrdersForLoad?: Order[],
): DesignerPerformanceRow {
  const loadOrders = (allOrdersForLoad ?? periodOrders).filter(
    (o) => o.designer === designer,
  );
  const personOrders = periodOrders.filter((o) => o.designer === designer);
  const bounds =
    period && period.preset !== "all" ? getPeriodBounds(period) : null;

  let orderedAmount = 0;
  let supplementAmount = 0;
  let refundedAmount = 0;
  let refundCount = 0;
  let afterSalesAmount = 0;
  const drawDays: number[] = [];
  const totalDays: number[] = [];
  let timeoutCount = 0;

  for (const order of personOrders) {
    const parts = classifyDispatcherOrder(order, supplements);
    orderedAmount += parts.ordered.amount;
    if (parts.refunded.count > 0) {
      refundCount += 1;
      refundedAmount += parts.refunded.amount;
    }
    if (order.afterSalesAmount != null && order.afterSalesAmount > 0) {
      afterSalesAmount += order.afterSalesAmount;
    }
    if (order.stageIntervalDays?.toDrawn != null) {
      drawDays.push(order.stageIntervalDays.toDrawn);
    }
    if (order.totalElapsedDays != null) {
      totalDays.push(order.totalElapsedDays);
    }
    for (const s of supplements) {
      if (s.parentOrderId === order.id && s.designer === designer) {
        supplementAmount += s.supplementAmount;
      }
    }
  }

  for (const order of loadOrders) {
    if (getStageTimeoutAlert(order)) timeoutCount += 1;
  }

  const inProgressCount = loadOrders.filter(isInProgress).length;
  const orderedCount = personOrders.filter(
    (o) => !isRefundStatus(o.status) && (o.status === "已下单" || o.status === "已安装"),
  ).length;

  const totalAmount =
    partsSum(personOrders, supplements) || 0;
  const orderConversionRate =
    totalAmount > 0 ? (orderedAmount / totalAmount) * 100 : null;

  const transferSource = allOrdersForLoad ?? periodOrders;
  const transfers = transferSource.reduce(
    (acc, o) => {
      const c = countTransfersInPeriod(o, bounds, designer);
      return {
        out: acc.out + c.out,
        transferIn: acc.transferIn + c.transferIn,
      };
    },
    { out: 0, transferIn: 0 },
  );

  const contributionScore = computeContributionScore({
    orderedAmount,
    supplementAmount,
    afterSalesAmount,
    refundedAmount,
    timeoutCount,
  });

  const activity = summarizeDesignerActivity(
    allOrdersForLoad ?? periodOrders,
    designer,
    period ?? { preset: "all" },
  );

  return {
    key: designer,
    label: designer,
    subtitle,
    inProgressCount,
    orderedCount,
    orderedAmount,
    orderConversionRate,
    avgDrawDays: average(drawDays) != null ? round1(average(drawDays)!) : null,
    avgTotalDays: average(totalDays) != null ? round1(average(totalDays)!) : null,
    timeoutCount,
    transferOut: transfers.out,
    transferIn: transfers.transferIn,
    refundCount,
    afterSalesAmount,
    contributionScore,
    activityTotal: activity.total,
    activityAdvances: activity.advances,
    sampleTooSmall: personOrders.length > 0 && personOrders.length < MIN_SAMPLE,
  };
}

function partsSum(orders: Order[], supplements: SupplementOrder[]): number {
  let total = 0;
  for (const order of orders) {
    const parts = classifyDispatcherOrder(order, supplements);
    total +=
      parts.notOrdered.amount + parts.ordered.amount + parts.refunded.amount;
  }
  return total;
}

export function getDesignerPerformanceRows(
  orders: Order[],
  supplements: SupplementOrder[],
  nameFilter: string[] | null,
  resolveSubtitle?: (name: string) => string | undefined,
  staffRecords: StaffRecord[] = [],
  period: PeriodSelection = { preset: "all" },
): DesignerPerformanceRow[] {
  const filteredOrders = filterOrdersByPeriod(orders, period);
  const filteredSupplements = filterSupplementsByPeriod(supplements, period);
  const allowedNames = nameFilter ? new Set(nameFilter) : null;
  const designerIndex = buildDesignerHomeStoreIndex(staffRecords);
  const roster = buildEffectiveDesignerRoster(staffRecords, designerIndex);
  const seen = new Set<string>();
  const rows: DesignerPerformanceRow[] = [];

  for (const profile of roster) {
    if (allowedNames && !allowedNames.has(profile.name)) continue;
    seen.add(profile.name);
    rows.push(
      buildDesignerPerformanceRow(
        profile.name,
        filteredOrders,
        filteredSupplements,
        resolveSubtitle?.(profile.name) ?? profile.homeStore,
        period,
        orders,
      ),
    );
  }

  for (const order of filteredOrders) {
    if (!seen.has(order.designer)) {
      if (allowedNames && !allowedNames.has(order.designer)) continue;
      seen.add(order.designer);
      rows.push(
        buildDesignerPerformanceRow(
          order.designer,
          filteredOrders,
          filteredSupplements,
          resolveSubtitle?.(order.designer),
          period,
          orders,
        ),
      );
    }
  }

  return rows.sort(
    (a, b) =>
      b.contributionScore - a.contributionScore ||
      a.label.localeCompare(b.label, "zh-CN"),
  );
}

export function getMonthlyReportOverview(
  orders: Order[],
  supplements: SupplementOrder[],
  period: PeriodSelection,
): MonthlyReportOverview {
  const filteredOrders = filterOrdersByPeriod(orders, period);
  const filteredSupplements = filterSupplementsByPeriod(supplements, period);

  let orderedCount = 0;
  let orderedAmount = 0;
  let refundCount = 0;
  let supplementAmount = 0;

  for (const order of filteredOrders) {
    const parts = classifyDispatcherOrder(order, filteredSupplements);
    orderedCount += parts.ordered.count;
    orderedAmount += parts.ordered.amount;
    refundCount += parts.refunded.count;
  }

  for (const s of filteredSupplements) {
    supplementAmount += s.supplementAmount;
  }

  const activeTimeoutCount = orders.filter((o) =>
    getStageTimeoutAlert(o),
  ).length;
  const inProgressCount = orders.filter(isInProgress).length;

  return {
    periodLabel: formatPeriodLabel(period),
    orderCount: filteredOrders.length,
    orderedCount,
    orderedAmount,
    refundCount,
    supplementAmount,
    activeTimeoutCount,
    inProgressCount,
  };
}

export function formatAvgDays(days: number | null): string {
  if (days == null) return "—";
  return Number.isInteger(days) ? `${days} 天` : `${days} 天`;
}

export function formatContributionScore(score: number): string {
  if (score === 0) return "0";
  return formatDispatchMoney(score).replace("¥", "");
}

export type PerformanceRankKind =
  | "contribution"
  | "orderedAmount"
  | "efficiency"
  | "quality";

export function sortPerformanceRows(
  rows: DesignerPerformanceRow[],
  kind: PerformanceRankKind,
): DesignerPerformanceRow[] {
  const copy = [...rows];
  switch (kind) {
    case "orderedAmount":
      return copy.sort((a, b) => b.orderedAmount - a.orderedAmount);
    case "efficiency":
      return copy.sort((a, b) => {
        const ae = a.avgTotalDays ?? 999;
        const be = b.avgTotalDays ?? 999;
        if (ae !== be) return ae - be;
        return b.orderedCount - a.orderedCount;
      });
    case "quality":
      return copy.sort((a, b) => {
        const aq = a.timeoutCount + a.refundCount * 2 + a.transferOut;
        const bq = b.timeoutCount + b.refundCount * 2 + b.transferOut;
        if (aq !== bq) return aq - bq;
        return b.orderedAmount - a.orderedAmount;
      });
    case "contribution":
    default:
      return copy.sort((a, b) => b.contributionScore - a.contributionScore);
  }
}

export function formatPerformanceConversion(rate: number | null): string {
  return formatOrderConversionRate(rate);
}
