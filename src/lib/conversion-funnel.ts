import {
  filterOrdersByPeriod,
  formatPeriodLabel,
  getPeriodBounds,
  getPreviousPeriod,
  type PeriodSelection,
} from "./period-filter";
import { LAST_MONTH, THIS_MONTH, COMPARE_REF_PREV_WEEK } from "./brief-comparison";
import type { FlowOrderStatus, Order, OrderStatus } from "./types";

const FLOW_ORDER: FlowOrderStatus[] = [
  "未派单",
  "待量尺",
  "已量尺",
  "已出图",
  "待签约",
  "已签约",
  "已下单",
  "已安装",
  "已验收",
];

export interface FunnelStage {
  key: string;
  label: string;
  count: number;
  rate: number | null;
}

function statusRank(status: OrderStatus): number {
  if (status === "待退单" || status === "已退单") return -1;
  return FLOW_ORDER.indexOf(status as FlowOrderStatus);
}

function orderReachedStage(order: Order, target: FlowOrderStatus): boolean {
  const targetRank = FLOW_ORDER.indexOf(target);
  if (targetRank < 0) return false;

  if (target === "已签约" && order.contract?.signedAt) {
    return true;
  }

  const current = statusRank(order.status);
  if (current >= 0 && current >= targetRank) return true;

  const entered = order.statusEnteredAt;
  if (!entered) return false;
  for (const status of FLOW_ORDER) {
    if (FLOW_ORDER.indexOf(status) >= targetRank && entered[status]) {
      return true;
    }
  }
  return false;
}

function cohortCreatedInPeriod(
  orders: Order[],
  period: PeriodSelection,
): Order[] {
  const bounds = getPeriodBounds(period);
  if (!bounds) return orders;
  return orders.filter((o) => {
    const t = new Date(o.createdAt).getTime();
    return (
      Number.isFinite(t) &&
      t >= bounds.start.getTime() &&
      t < bounds.end.getTime()
    );
  });
}

/** 当期新派单 cohort 的主流程转化漏斗 */
export function buildConversionFunnel(
  orders: Order[],
  period: PeriodSelection,
): FunnelStage[] {
  const scoped = filterOrdersByPeriod(orders, period);
  const cohort =
    period.preset === "all"
      ? scoped
      : cohortCreatedInPeriod(orders, period);

  const stages: { key: string; label: string; target: FlowOrderStatus | "dispatch" }[] = [
    { key: "dispatch", label: "新派单", target: "dispatch" },
    { key: "measured", label: "已量尺", target: "已量尺" },
    { key: "drawn", label: "已出图", target: "已出图" },
    { key: "signed", label: "已签约", target: "已签约" },
    { key: "ordered", label: "已下单", target: "已下单" },
    { key: "accepted", label: "已验收", target: "已验收" },
  ];

  const top = cohort.length;
  const result: FunnelStage[] = [];

  for (const stage of stages) {
    const count =
      stage.target === "dispatch"
        ? top
        : cohort.filter((o) =>
            orderReachedStage(o, stage.target as FlowOrderStatus),
          ).length;
    result.push({
      key: stage.key,
      label: stage.label,
      count,
      rate: top > 0 ? Math.round((count / top) * 100) : null,
    });
  }

  return result;
}

export interface FunnelCompare {
  current: FunnelStage[];
  previous: FunnelStage[];
  currentLabel: string;
  previousLabel: string;
}

export function buildFunnelCompare(
  orders: Order[],
  period: PeriodSelection,
): FunnelCompare {
  if (period.preset === "all") {
    return {
      current: buildConversionFunnel(orders, THIS_MONTH),
      previous: buildConversionFunnel(orders, LAST_MONTH),
      currentLabel: formatPeriodLabel(THIS_MONTH),
      previousLabel: formatPeriodLabel(LAST_MONTH),
    };
  }

  const current = buildConversionFunnel(orders, period);
  const previousPeriod = getPreviousPeriod(period);
  const previous = previousPeriod
    ? buildConversionFunnel(orders, previousPeriod)
    : [];
  return {
    current,
    previous,
    currentLabel: formatPeriodLabel(period),
    previousLabel: previousPeriod
      ? period.preset === "thisWeek"
        ? COMPARE_REF_PREV_WEEK
        : formatPeriodLabel(previousPeriod)
      : "上月",
  };
}
