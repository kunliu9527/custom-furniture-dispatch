import {
  computeAggregateTotalAmount,
  computeOrderAmountConversionRate,
} from "./aggregate-metric-rates";
import { computePreMeasureDepositBonus } from "./deposit-contribution";
import { buildDesignerHomeStoreIndex } from "./designer-staff-store";
import {
  classifyDispatcherOrder,
  formatOrderConversionRate,
} from "./evaluation-stats";
import { formatDispatchMoney, getOrderTotalDispatch } from "./dispatch-totals";
import {
  filterOrdersByPeriod,
  filterSupplementsByPeriod,
  formatPeriodLabel,
  getPeriodBounds,
  type PeriodSelection,
} from "./period-filter";
import { isRefundStatus } from "./order-utils";
import { buildEffectiveDesignerRoster } from "./personnel-roster";
import {
  countReportInProgress,
  isReportStockOrder,
  measureReportOrderedReached,
} from "./report-metric-definitions";
import { buildResignedStaffNameSet, type StaffRecord } from "./staff-roster";
import { summarizeDesignerActivity } from "./order-events";
import { getStageTimeoutAlert } from "./stage-intervals";
import type { FlowOrderStatus, Order, SupplementOrder } from "./types";

export const IN_PROGRESS_STATUSES: FlowOrderStatus[] = [
  "待量尺",
  "已量尺",
  "已出图",
  "待签约",
  "已签约",
];

const MIN_SAMPLE = 5;

export interface DesignerPerformanceRow {
  key: string;
  label: string;
  subtitle?: string;
  /** 进行中主流程（待量尺→已签约）单数：设计师负荷判断口径 */
  inProgressCount: number;
  /** 报表「在途」：非退单且未验收（未派单→已安装），当前快照口径 */
  unfinishedCount: number;
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
  /** 进行中主流程（待量尺→已签约）单数：负荷口径 */
  inProgressCount: number;
  /** 报表「在途」：非退单且未验收（未派单→已安装），当前快照口径 */
  unfinishedCount: number;
  /** 报表「存量」：非退单且未下单（未派单→已签约） */
  stockCount: number;
  stockAmount: number;
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
    if (parts.pendingRefund.count > 0 || parts.confirmedRefund.count > 0) {
      refundCount += 1;
      refundedAmount +=
        parts.pendingRefund.amount + parts.confirmedRefund.amount;
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
  const unfinishedCount = countReportInProgress(loadOrders);
  const orderedCount = personOrders.filter(
    (o) =>
      !isRefundStatus(o.status) &&
      (o.status === "已下单" || o.status === "已安装" || o.status === "已验收"),
  ).length;

  const totalAmount = partsSum(personOrders, supplements) || 0;
  const orderConversionRate = computeOrderAmountConversionRate(
    orderedAmount,
    totalAmount,
  );

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

  const preMeasureBonus = personOrders.reduce(
    (sum, o) => sum + computePreMeasureDepositBonus(o).designer,
    0,
  );

  const contributionScore =
    computeContributionScore({
      orderedAmount,
      supplementAmount,
      afterSalesAmount,
      refundedAmount,
      timeoutCount,
    }) + preMeasureBonus;

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
    unfinishedCount,
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
    total += computeAggregateTotalAmount({
      notOrderedAmount: parts.notOrdered.amount,
      orderedAmount: parts.ordered.amount,
      pendingRefundAmount: parts.pendingRefund.amount,
      confirmedRefundAmount: parts.confirmedRefund.amount,
    });
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
  const resignedNames = buildResignedStaffNameSet(staffRecords);
  const seen = new Set<string>();
  const rows: DesignerPerformanceRow[] = [];

  for (const profile of roster) {
    if (allowedNames && !allowedNames.has(profile.name)) continue;
    if (resignedNames.has(profile.name)) continue;
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
    if (!order.designer || seen.has(order.designer)) continue;
    if (allowedNames && !allowedNames.has(order.designer)) continue;
    if (resignedNames.has(order.designer)) continue;
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

  // 本期已下单量 = 本期「到达过」已下单的订单（节点口径），与本期安装/验收一致；
  // 不再用「本期有活动 ∩ 当前状态已下单」，避免把早于/晚于本期下单的订单算进本期。
  const orderedReached = measureReportOrderedReached(orders, supplements, period);

  let refundCount = 0;
  let supplementAmount = 0;

  for (const order of filteredOrders) {
    const parts = classifyDispatcherOrder(order, filteredSupplements);
    refundCount += parts.pendingRefund.count + parts.confirmedRefund.count;
  }

  for (const s of filteredSupplements) {
    supplementAmount += s.supplementAmount;
  }

  const activeTimeoutCount = orders.filter((o) =>
    getStageTimeoutAlert(o),
  ).length;
  const inProgressCount = orders.filter(isInProgress).length;
  const unfinishedCount = countReportInProgress(orders);
  const stockOrders = orders.filter(isReportStockOrder);
  const stockCount = stockOrders.length;
  const stockAmount = stockOrders.reduce(
    (sum, order) => sum + getOrderTotalDispatch(order, supplements),
    0,
  );

  return {
    periodLabel: formatPeriodLabel(period),
    orderCount: filteredOrders.length,
    orderedCount: orderedReached.count,
    orderedAmount: orderedReached.amount,
    refundCount,
    supplementAmount,
    activeTimeoutCount,
    inProgressCount,
    unfinishedCount,
    stockCount,
    stockAmount,
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
