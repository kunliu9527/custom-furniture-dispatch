import { getOrderedReachedAmount } from "./order-amount";
import { getPeriodBounds, type PeriodSelection } from "./period-filter";
import {
  isCumulativeOrderedOrder,
  isCumulativeUnfinished,
  isStockOrder,
} from "./store-summary-metrics";
import type { Order, SupplementOrder } from "./types";

/**
 * 报表口径的单一事实来源。
 *
 * 报表里的「在途」= 未完结单快照：非退单且尚未验收（未派单 → 已安装），
 * 回答「本周/本月还要做的还有哪些」；
 * 「存量」= 非退单且尚未下单（未派单 → 已签约），即未下单量，
 * 剔除退单之后仍未落单的部分。
 *
 * 二者都在当前订单快照上统计，不随统计周期变化（见 report-period-sync）。
 * 与「进行中主流程」（待量尺→已签约，用于设计师负荷判断）不是同一口径。
 *
 * 「本期已下单量」= 本期「到达过」已下单的订单，即 statusEnteredAt['已下单']
 * 落在统计期内；与「本期安装 / 本期验收」同为流程节点口径，不看到期末订单停在哪。
 */
export const REPORT_METRIC_DEFINITIONS = {
  inProgress: {
    label: "在途",
    definition: "非退单且尚未验收（未派单 → 已安装），当前快照口径",
  },
  stock: {
    label: "存量",
    definition: "非退单且尚未下单（未派单 → 已签约），等于未下单量",
  },
  ordered: {
    label: "下单",
    definition:
      "本期到达过「已下单」的订单：已下单节点落在统计期内，不看到期末停在哪一步",
  },
  refund: {
    label: "退单",
    definition: "待退单 + 已退单",
  },
} as const;

/** 报表口径「在途」：非退单且未验收 */
export function isReportInProgressOrder(order: Order): boolean {
  return isCumulativeUnfinished(order);
}

/** 报表口径「存量」：非退单且未下单 */
export function isReportStockOrder(order: Order): boolean {
  return isStockOrder(order);
}

export function countReportInProgress(orders: Order[]): number {
  return orders.filter(isReportInProgressOrder).length;
}

export function countReportStock(orders: Order[]): number {
  return orders.filter(isReportStockOrder).length;
}

/**
 * 本期「到达过」已下单的订单：以 statusEnteredAt['已下单'] 落在统计期内为准。
 * 已下单后又退单的仍计入（到达过即算），故不与「本期退单量」互斥。
 *
 * 统计周期为「全部」时不看节点日期，退化为「所有到达过已下单的订单」= 累计下单：
 * 2025-12~2026-01 导入批次的老单没有「已下单」节点，只能用当前状态（已下单/已安装/已验收）
 * 反推它确实到达过，否则累计口径会凭空少掉这批单。
 */
export function filterReportOrderedReachedOrders(
  orders: Order[],
  period: PeriodSelection,
): Order[] {
  const bounds = getPeriodBounds(period);
  if (!bounds) {
    return orders.filter(
      (order) =>
        Boolean(order.statusEnteredAt?.["已下单"]) || isCumulativeOrderedOrder(order),
    );
  }
  const start = bounds.start.getTime();
  const end = bounds.end.getTime();
  return orders.filter((order) => {
    const at = order.statusEnteredAt?.["已下单"];
    if (!at) return false;
    const t = new Date(at).getTime();
    return Number.isFinite(t) && t >= start && t < end;
  });
}

/** 本期已下单量：单数 + 金额（主单额 + 增补） */
export function measureReportOrderedReached(
  orders: Order[],
  supplements: SupplementOrder[],
  period: PeriodSelection,
): { count: number; amount: number } {
  const reached = filterReportOrderedReachedOrders(orders, period);
  return {
    count: reached.length,
    amount: reached.reduce(
      (sum, order) => sum + getOrderedReachedAmount(order, supplements),
      0,
    ),
  };
}
