import { normalizeDispatcherName } from "./admin-stats";
import { formatDispatchMoney } from "./dispatch-totals";
import { sumPreMeasureDepositBonus } from "./deposit-contribution";
import { getEffectiveDispatcherRoster } from "./dispatchers";
import { getStageTimeoutAlert } from "./stage-intervals";
import { isRefundStatus } from "./order-utils";
import { sumSupplementAmount } from "./supplement-utils";
import {
  filterOrdersByPeriod,
  getPeriodBounds,
  type PeriodSelection,
} from "./period-filter";
import type { StaffRecord } from "./staff-roster";
import type { Order, SupplementOrder } from "./types";

export interface DispatcherPerformanceRow {
  key: string;
  label: string;
  subtitle?: string;
  newDispatchCount: number;
  depositTotal: number;
  signedContractAmount: number;
  orderedAmount: number;
  preMeasureDepositCount: number;
  refundBudget: number;
  signTimeoutCount: number;
  contributionScore: number;
  preMeasureBonus: number;
}

/**
 * 派单人贡献分（销售面，金额为主）
 * 签约超时权重最低（×50）；下单权重较低（×0.15）
 */
export function computeDispatcherContributionScore(input: {
  depositTotal: number;
  signedContractAmount: number;
  orderedAmount: number;
  preMeasureDepositCount: number;
  refundBudget: number;
  signTimeoutCount: number;
  preMeasureBonus?: number;
}): number {
  return Math.round(
    input.depositTotal * 0.4 +
      input.signedContractAmount * 0.3 +
      input.orderedAmount * 0.15 +
      input.preMeasureDepositCount * 200 -
      input.refundBudget * 0.3 -
      input.signTimeoutCount * 50 +
      (input.preMeasureBonus ?? 0),
  );
}

function contractSignedInPeriod(
  order: Order,
  bounds: { start: Date; end: Date } | null,
): boolean {
  const at = order.contract?.signedAt;
  if (!at) return false;
  if (!bounds) return Boolean(order.contract?.signedAt);
  const t = new Date(at).getTime();
  return t >= bounds.start.getTime() && t < bounds.end.getTime();
}

export function buildDispatcherPerformanceRow(
  dispatcher: string,
  periodOrders: Order[],
  supplements: SupplementOrder[],
  subtitle?: string,
  period?: PeriodSelection,
  allOrdersForTimeout?: Order[],
): DispatcherPerformanceRow {
  const bounds =
    period && period.preset !== "all" ? getPeriodBounds(period) : null;
  const personOrders = periodOrders.filter(
    (o) => normalizeDispatcherName(o.dispatcherName) === dispatcher,
  );

  let depositTotal = 0;
  let signedContractAmount = 0;
  let orderedAmount = 0;
  let preMeasureDepositCount = 0;
  let refundBudget = 0;

  for (const order of personOrders) {
    depositTotal += Math.max(0, order.deposit);
    if (order.preMeasureDeposit) preMeasureDepositCount += 1;
    if (isRefundStatus(order.status)) {
      refundBudget += order.budget;
    }
    if (contractSignedInPeriod(order, bounds)) {
      signedContractAmount += order.contract?.contractAmount ?? 0;
    }
    if (
      order.status === "已下单" ||
      order.status === "已安装" ||
      order.status === "已验收"
    ) {
      orderedAmount +=
        (order.orderAmount ?? 0) + sumSupplementAmount(supplements, order.id);
    }
  }

  const timeoutOrders = (allOrdersForTimeout ?? periodOrders).filter(
    (o) => normalizeDispatcherName(o.dispatcherName) === dispatcher,
  );
  let signTimeoutCount = 0;
  for (const order of timeoutOrders) {
    if (order.status === "待签约" && getStageTimeoutAlert(order)) {
      signTimeoutCount += 1;
    }
  }

  const preMeasureBonus = sumPreMeasureDepositBonus(personOrders, "dispatcher");

  const contributionScore = computeDispatcherContributionScore({
    depositTotal,
    signedContractAmount,
    orderedAmount,
    preMeasureDepositCount,
    refundBudget,
    signTimeoutCount,
    preMeasureBonus,
  });

  const newDispatchCount = personOrders.filter((o) => {
    if (!bounds) return true;
    const t = new Date(o.createdAt).getTime();
    return t >= bounds.start.getTime() && t < bounds.end.getTime();
  }).length;

  return {
    key: dispatcher,
    label: dispatcher,
    subtitle,
    newDispatchCount,
    depositTotal,
    signedContractAmount,
    orderedAmount,
    preMeasureDepositCount,
    refundBudget,
    signTimeoutCount,
    contributionScore,
    preMeasureBonus,
  };
}

export function getDispatcherPerformanceRows(
  orders: Order[],
  supplements: SupplementOrder[],
  dispatcherNames: string[] | null,
  staffRecords: StaffRecord[] = [],
  period?: PeriodSelection,
): DispatcherPerformanceRow[] {
  const periodOrders = period ? filterOrdersByPeriod(orders, period) : orders;
  const roster = getEffectiveDispatcherRoster(staffRecords);
  const names =
    dispatcherNames ??
    [
      ...new Set(
        periodOrders.map((o) => normalizeDispatcherName(o.dispatcherName)),
      ),
    ].filter(Boolean);
  const rosterSet = new Set(roster.map((d) => d.name));
  const orderedNames = [
    ...roster.filter((d) => names.includes(d.name)).map((d) => d.name),
    ...names.filter((n) => !rosterSet.has(n)),
  ];

  return orderedNames
    .map((name) => {
      const profile = roster.find((d) => d.name === name);
      return buildDispatcherPerformanceRow(
        name,
        periodOrders,
        supplements,
        profile?.homeStore,
        period,
        orders,
      );
    })
    .sort((a, b) => b.contributionScore - a.contributionScore);
}

export function formatDispatcherWeeklyDigest(
  rows: DispatcherPerformanceRow[],
  weekLabel: string,
): string {
  const top = rows.filter((r) => r.contributionScore > 0).slice(0, 5);
  const lines = [
    `【派单人绩效周报】${weekLabel}`,
    "",
    `参与统计：${rows.length} 人`,
  ];
  if (top.length > 0) {
    lines.push("", "贡献榜：");
    for (let i = 0; i < top.length; i++) {
      const r = top[i]!;
      lines.push(
        `${i + 1}. ${r.label} · 贡献 ${r.contributionScore} · 定金 ${formatDispatchMoney(r.depositTotal)} · 签约 ${formatDispatchMoney(r.signedContractAmount)} · 下单 ${formatDispatchMoney(r.orderedAmount)}`,
      );
    }
  }
  return lines.join("\n");
}
