import { countBadAcceptanceReviews } from "./acceptance-rating";
import { getAcceptanceEvaluationSummary } from "./acceptance-evaluation-stats";
import { formatDispatchMoney } from "./dispatch-totals";
import { classifyDispatcherOrder } from "./evaluation-stats";
import { AGGREGATE_KPI_LABEL } from "./metric-display-labels";
import { getManagerAlerts } from "./manager-alerts";
import {
  filterOrdersByPeriod,
  filterSupplementsByPeriod,
  formatPeriodLabel,
  getPeriodBounds,
  getPreviousPeriod,
  isWeekPeriod,
  type PeriodSelection,
} from "./period-filter";
import {
  countPendingAcceptanceScan,
  countPendingRefund,
  countSignTimeouts,
} from "./trend-series";
import {
  formatSecondaryCompareDelta,
  COMPARE_REF_PREV_MONTH,
  COMPARE_REF_PREV_WEEK,
  LAST_MONTH,
  resolveBriefComparisonContext,
  THIS_MONTH,
  type BriefComparisonContext,
} from "./brief-comparison";
import type { MonthlyCockpitSnapshot } from "./monthly-snapshot-types";
import { sumSupplementAmount } from "./supplement-utils";
import { filterOrdersByWeek, orderActiveInWeek } from "./week-filter";
import type { Order, SupplementOrder } from "./types";

export interface BriefKpi {
  id: string;
  label: string;
  /** 主展示：格式化的金额 */
  value: string;
  amount: number;
  count: number;
  detail?: string;
  deltaPercent: number | null;
  deltaLabel: string | null;
  yoyLabel?: string | null;
  wowLabel?: string | null;
}

export interface BriefAnomaly {
  id: string;
  label: string;
  count: number;
  hint?: string;
}

export interface OperationsBrief {
  periodLabel: string;
  previousPeriodLabel: string | null;
  isCumulative: boolean;
  secondaryCompareHint: string | null;
  kpis: BriefKpi[];
  anomalies: BriefAnomaly[];
}

interface PeriodMetrics {
  newDispatchCount: number;
  newDispatchAmount: number;
  signedContractAmount: number;
  signedCount: number;
  orderedAmount: number;
  orderedCount: number;
  refundCount: number;
  refundAmount: number;
  acceptedAmount: number;
  acceptedCount: number;
  acceptanceAvg: number | null;
  ratedCount: number;
}

const KPI_AMOUNT_KEYS: Record<string, keyof PeriodMetrics> = {
  dispatch: "newDispatchAmount",
  signed: "signedContractAmount",
  ordered: "orderedAmount",
  refund: "refundAmount",
};

function isCreatedInBounds(
  order: Order,
  bounds: { start: Date; end: Date },
): boolean {
  const t = new Date(order.createdAt).getTime();
  return (
    Number.isFinite(t) &&
    t >= bounds.start.getTime() &&
    t < bounds.end.getTime()
  );
}

function orderAmountParts(
  order: Order,
  supplements: SupplementOrder[],
): number {
  const parts = classifyDispatcherOrder(order, supplements);
  return (
    parts.notOrdered.amount +
    parts.ordered.amount +
    parts.pendingRefund.amount +
    parts.confirmedRefund.amount
  );
}

function aggregateOrderMetrics(
  periodOrders: Order[],
  supplements: SupplementOrder[],
  period: PeriodSelection,
): Omit<
  PeriodMetrics,
  "newDispatchCount" | "newDispatchAmount"
> {
  let orderedAmount = 0;
  let orderedCount = 0;
  let refundCount = 0;
  let refundAmount = 0;
  let signedContractAmount = 0;
  let signedCount = 0;
  let acceptedAmount = 0;
  let acceptedCount = 0;

  for (const order of periodOrders) {
    const parts = classifyDispatcherOrder(order, supplements);
    orderedAmount += parts.ordered.amount;
    orderedCount += parts.ordered.count;
    refundCount += parts.pendingRefund.count + parts.confirmedRefund.count;
    refundAmount += parts.pendingRefund.amount + parts.confirmedRefund.amount;
    if (signedInPeriod(order, period)) {
      signedContractAmount += order.contract?.contractAmount ?? 0;
      signedCount += 1;
    }
    if (order.status === "已验收") {
      acceptedCount += 1;
      const main =
        order.orderAmount != null && order.orderAmount > 0
          ? order.orderAmount
          : 0;
      acceptedAmount += main + sumSupplementAmount(supplements, order.id);
    }
  }

  const acceptance = getAcceptanceEvaluationSummary(periodOrders);

  return {
    signedContractAmount,
    signedCount,
    orderedAmount,
    orderedCount,
    refundCount,
    refundAmount,
    acceptedAmount,
    acceptedCount,
    acceptanceAvg: acceptance.ratedCount > 0 ? acceptance.avgOverall : null,
    ratedCount: acceptance.ratedCount,
  };
}

function newDispatchMetrics(
  orders: Order[],
  supplements: SupplementOrder[],
  bounds: { start: Date; end: Date } | null,
): { count: number; amount: number } {
  let count = 0;
  let amount = 0;
  for (const order of orders) {
    if (bounds && !isCreatedInBounds(order, bounds)) continue;
    count += 1;
    amount += orderAmountParts(order, supplements);
  }
  return { count, amount };
}

function signedInPeriod(order: Order, period: PeriodSelection): boolean {
  const at = order.contract?.signedAt;
  if (!at) return false;
  return filterOrdersByPeriod([order], period).length > 0;
}

function signedInBounds(
  iso: string | undefined,
  bounds: { start: Date; end: Date },
): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return (
    Number.isFinite(t) &&
    t >= bounds.start.getTime() &&
    t < bounds.end.getTime()
  );
}

function metricsForPeriod(
  orders: Order[],
  supplements: SupplementOrder[],
  period: PeriodSelection,
): PeriodMetrics {
  const periodOrders = filterOrdersByPeriod(orders, period);
  const periodSupplements = filterSupplementsByPeriod(supplements, period);
  const bounds = getPeriodBounds(period);
  const aggregated = aggregateOrderMetrics(
    periodOrders,
    periodSupplements,
    period,
  );
  const newDispatch = newDispatchMetrics(
    bounds ? orders : periodOrders,
    periodSupplements,
    bounds,
  );

  return {
    newDispatchCount: newDispatch.count,
    newDispatchAmount: newDispatch.amount,
    ...aggregated,
  };
}

function metricsForWeekRef(
  orders: Order[],
  supplements: SupplementOrder[],
  ref: Date,
): PeriodMetrics {
  const { bounds } = filterOrdersByWeek(orders, ref);
  const periodOrders = orders.filter((o) => orderActiveInWeek(o, bounds));

  let orderedAmount = 0;
  let orderedCount = 0;
  let refundCount = 0;
  let refundAmount = 0;
  let signedContractAmount = 0;
  let signedCount = 0;
  let acceptedAmount = 0;
  let acceptedCount = 0;

  for (const order of periodOrders) {
    const parts = classifyDispatcherOrder(order, supplements);
    orderedAmount += parts.ordered.amount;
    orderedCount += parts.ordered.count;
    refundCount += parts.pendingRefund.count + parts.confirmedRefund.count;
    refundAmount += parts.pendingRefund.amount + parts.confirmedRefund.amount;
    if (signedInBounds(order.contract?.signedAt, bounds)) {
      signedContractAmount += order.contract?.contractAmount ?? 0;
      signedCount += 1;
    }
    if (order.status === "已验收") {
      acceptedCount += 1;
      const main =
        order.orderAmount != null && order.orderAmount > 0
          ? order.orderAmount
          : 0;
      acceptedAmount += main + sumSupplementAmount(supplements, order.id);
    }
  }

  const acceptance = getAcceptanceEvaluationSummary(periodOrders);
  const newDispatch = newDispatchMetrics(orders, supplements, bounds);

  return {
    newDispatchCount: newDispatch.count,
    newDispatchAmount: newDispatch.amount,
    signedContractAmount,
    signedCount,
    orderedAmount,
    orderedCount,
    refundCount,
    refundAmount,
    acceptedAmount,
    acceptedCount,
    acceptanceAvg: acceptance.ratedCount > 0 ? acceptance.avgOverall : null,
    ratedCount: acceptance.ratedCount,
  };
}

function makeMoneyKpi(
  id: string,
  label: string,
  amount: number,
  count: number,
  previousAmount: number | null,
  compareRefLabel: string | null,
  extraDetail?: string,
): BriefKpi {
  const detailParts = [`${count} 笔`];
  if (extraDetail) detailParts.push(extraDetail);
  const deltaPct = deltaPercent(amount, previousAmount);
  return {
    id,
    label,
    value: formatDispatchMoney(amount),
    amount,
    count,
    detail: detailParts.join(" · "),
    deltaPercent: deltaPct,
    deltaLabel: formatDelta(deltaPct, compareRefLabel),
  };
}

function deltaPercent(current: number, previous: number | null): number | null {
  if (previous == null) return null;
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function formatDelta(pct: number | null, previousLabel: string | null): string | null {
  if (pct == null || !previousLabel) return null;
  if (pct === 0) return `较${previousLabel} 持平`;
  const arrow = pct > 0 ? "↑" : "↓";
  return `较${previousLabel} ${arrow}${Math.abs(pct)}%`;
}

export function buildOperationsBrief(
  orders: Order[],
  supplements: SupplementOrder[],
  period: PeriodSelection,
  now = new Date(),
): OperationsBrief {
  const current = metricsForPeriod(orders, supplements, period);
  const previousPeriod = getPreviousPeriod(period);
  const previous = previousPeriod
    ? metricsForPeriod(orders, supplements, previousPeriod)
    : null;
  const previousPeriodLabel = previousPeriod
    ? formatPeriodLabel(previousPeriod)
    : null;
  const compareRefLabel = previousPeriod
    ? isWeekPeriod(period)
      ? COMPARE_REF_PREV_WEEK
      : COMPARE_REF_PREV_MONTH
    : null;

  const alerts = getManagerAlerts(orders, now);

  const kpis: BriefKpi[] = [
    makeMoneyKpi(
      "dispatch",
      "新派单",
      current.newDispatchAmount,
      current.newDispatchCount,
      previous?.newDispatchAmount ?? null,
      compareRefLabel,
    ),
    makeMoneyKpi(
      "signed",
      "签约额",
      current.signedContractAmount,
      current.signedCount,
      previous?.signedContractAmount ?? null,
      compareRefLabel,
    ),
    makeMoneyKpi(
      "ordered",
      AGGREGATE_KPI_LABEL.ordered,
      current.orderedAmount,
      current.orderedCount,
      previous?.orderedAmount ?? null,
      compareRefLabel,
    ),
    makeMoneyKpi(
      "refund",
      AGGREGATE_KPI_LABEL.refundTotal,
      current.refundAmount,
      current.refundCount,
      previous?.refundAmount ?? null,
      compareRefLabel,
    ),
    {
      id: "acceptance",
      label: "验收均分",
      value:
        current.ratedCount > 0
          ? `${current.acceptanceAvg!.toFixed(1)} 星`
          : "—",
      amount: current.acceptanceAvg ?? 0,
      count: current.ratedCount,
      detail:
        current.ratedCount > 0 ? `${current.ratedCount} 单已评` : "暂无评价",
      deltaPercent: null,
      deltaLabel:
        current.acceptanceAvg != null && previous?.acceptanceAvg != null
          ? `较${compareRefLabel ?? COMPARE_REF_PREV_MONTH} ${yoyArrow(current.acceptanceAvg, previous.acceptanceAvg)}${Math.abs(current.acceptanceAvg - previous.acceptanceAvg).toFixed(1)}`
          : null,
    },
  ];

  const anomalies: BriefAnomaly[] = [
    {
      id: "flow-timeout",
      label: "流程超时",
      count: alerts.length,
      hint: "量尺/出图/下单",
    },
    {
      id: "sign-timeout",
      label: "签约超时",
      count: countSignTimeouts(orders, now),
    },
    {
      id: "pending-acceptance",
      label: "待扫码验收",
      count: countPendingAcceptanceScan(orders),
    },
    {
      id: "pending-refund",
      label: AGGREGATE_KPI_LABEL.pendingRefund,
      count: countPendingRefund(orders),
    },
    {
      id: "bad-acceptance",
      label: "验收差评",
      count: countBadAcceptanceReviews(orders),
      hint: "综合均分低于3星",
    },
  ].filter((a) => a.count > 0);

  const comparison = resolveBriefComparisonContext(period);

  return {
    periodLabel: formatPeriodLabel(period),
    previousPeriodLabel,
    isCumulative: comparison.isCumulative,
    secondaryCompareHint: comparison.secondaryCompareHint,
    kpis,
    anomalies,
  };
}

function yoyArrow(current: number, previous: number): string {
  if (current > previous) return "↑";
  if (current < previous) return "↓";
  return "→";
}

/** 用去年同月存档 cockpit 数据补充同比（统一按金额） */
export function enrichBriefWithYoY(
  brief: OperationsBrief,
  lastYearLabel: string | null,
  lastYear?: MonthlyCockpitSnapshot | null,
): OperationsBrief {
  if (!lastYear || !lastYearLabel) return brief;

  const kpis = brief.kpis.map((kpi) => {
    if (kpi.id === "acceptance") {
      if (kpi.value === "—" || lastYear.acceptanceAvg == null) {
        return { ...kpi, yoyLabel: null };
      }
      const current = kpi.amount;
      const prev = lastYear.acceptanceAvg;
      const yoyLabel = `同比${lastYearLabel} ${yoyArrow(current, prev)}${Math.abs(current - prev).toFixed(1)}`;
      return { ...kpi, yoyLabel };
    }

    const lastYearAmount: Record<string, number | null | undefined> = {
      dispatch: lastYear.newDispatchAmount,
      signed: lastYear.signedContractAmount,
      ordered: lastYear.orderedAmount,
      refund: lastYear.refundAmount,
    };
    const previous = lastYearAmount[kpi.id];
    if (previous == null) return { ...kpi, yoyLabel: null };
    const current = kpi.amount;
    const yoyLabel = `同比${lastYearLabel} ${yoyArrow(current, previous)}${formatDispatchMoney(Math.abs(current - previous)).replace("¥", "")}`;
    return { ...kpi, yoyLabel };
  });

  return { ...brief, kpis };
}

function previousWeekRef(ref: Date): Date {
  const d = new Date(ref);
  d.setDate(d.getDate() - 7);
  return d;
}

function applySecondaryCompareToKpis(
  kpis: BriefKpi[],
  context: BriefComparisonContext,
  orders: Order[],
  supplements: SupplementOrder[],
  ref: Date,
): BriefKpi[] {
  if (context.secondaryCompare === "none") {
    return kpis.map((kpi) => ({ ...kpi, wowLabel: null }));
  }

  let current: PeriodMetrics;
  let previous: PeriodMetrics;
  let refLabel: string;
  let suffix: string;

  if (context.secondaryCompare === "month-active") {
    current = metricsForPeriod(orders, supplements, THIS_MONTH);
    previous = metricsForPeriod(orders, supplements, LAST_MONTH);
    refLabel = COMPARE_REF_PREV_MONTH;
    suffix = context.secondarySuffix;
  } else {
    current = metricsForWeekRef(orders, supplements, ref);
    previous = metricsForWeekRef(orders, supplements, previousWeekRef(ref));
    refLabel = "上周";
    suffix = "";
  }

  return kpis.map((kpi) => {
    const key = KPI_AMOUNT_KEYS[kpi.id];
    if (!key) return { ...kpi, wowLabel: null };
    return {
      ...kpi,
      wowLabel: formatSecondaryCompareDelta(
        current[key] as number,
        previous[key] as number,
        refLabel,
        suffix,
      ),
    };
  });
}

/** 按统计周期补充 KPI 次级对照（本月→较上周；全部→较上月·本月活跃） */
export function enrichBriefWithSecondaryCompare(
  brief: OperationsBrief,
  period: PeriodSelection,
  orders: Order[],
  supplements: SupplementOrder[],
  ref = new Date(),
): OperationsBrief {
  const context = resolveBriefComparisonContext(period);
  return {
    ...brief,
    isCumulative: context.isCumulative,
    secondaryCompareHint: context.secondaryCompareHint,
    kpis: applySecondaryCompareToKpis(
      brief.kpis,
      context,
      orders,
      supplements,
      ref,
    ),
  };
}
