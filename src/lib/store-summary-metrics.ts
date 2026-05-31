import { FLOW_ORDER_STATUSES } from "./constants";
import {
  formatDispatchMoney,
  getOrderDispatchParts,
  getOrderTotalDispatch,
  sumDispatchTotals,
} from "./dispatch-totals";
import { isRefundStatus } from "./order-utils";
import type { FlowOrderStatus, Order, SupplementOrder } from "./types";

const ORDERED_STATUS_INDEX = FLOW_ORDER_STATUSES.indexOf("已下单");

const CUMULATIVE_ORDERED_STATUSES: FlowOrderStatus[] = [
  "已下单",
  "已安装",
  "已验收",
];

export function formatCountAmountStat(count: number, amount: number): string {
  return `${count} / ${formatDispatchMoney(amount)}`;
}

export function isStockOrder(order: Order): boolean {
  if (isRefundStatus(order.status)) return false;
  const index = FLOW_ORDER_STATUSES.indexOf(order.status as FlowOrderStatus);
  return index >= 0 && index < ORDERED_STATUS_INDEX;
}

/** 累计下单：已到「已下单」及之后（含已安装、已验收），非退单 */
export function isCumulativeOrderedOrder(order: Order): boolean {
  if (isRefundStatus(order.status)) return false;
  return CUMULATIVE_ORDERED_STATUSES.includes(order.status as FlowOrderStatus);
}

/** 累计退单：待退单 + 已退单 */
export function isCumulativeRefundOrder(order: Order): boolean {
  return isRefundStatus(order.status);
}

/** 累计未完结：非退单且尚未验收（含存量、已下单、已安装） */
export function isCumulativeUnfinished(order: Order): boolean {
  if (isRefundStatus(order.status)) return false;
  return order.status !== "已验收";
}

/** @deprecated 使用 isCumulativeUnfinished */
export const isCumulativeInProgress = isCumulativeUnfinished;

export function countNonRefundOrders(orders: Order[]): number {
  return orders.filter((order) => !isRefundStatus(order.status)).length;
}

function sumOrderAmounts(
  orders: Order[],
  supplements: SupplementOrder[],
  predicate: (order: Order) => boolean,
): { count: number; amount: number } {
  let count = 0;
  let amount = 0;
  for (const order of orders) {
    if (!predicate(order)) continue;
    count += 1;
    amount += getOrderTotalDispatch(order, supplements);
  }
  return { count, amount };
}

export interface AllSummaryDispatchBuckets {
  total: { count: number; amount: number };
  stock: { count: number; amount: number };
  ordered: { count: number; amount: number };
  refund: { count: number; amount: number };
}

export function computeAllSummaryDispatchBuckets(
  orders: Order[],
  supplements: SupplementOrder[],
): AllSummaryDispatchBuckets {
  const stock = sumOrderAmounts(orders, supplements, isStockOrder);
  const ordered = sumOrderAmounts(orders, supplements, isCumulativeOrderedOrder);

  let refundCount = 0;
  let refundAmount = 0;
  for (const order of orders) {
    if (!isCumulativeRefundOrder(order)) continue;
    refundCount += 1;
    refundAmount += getOrderDispatchParts(order, supplements).refund;
  }

  const refund = { count: refundCount, amount: refundAmount };
  return {
    stock,
    ordered,
    refund,
    total: {
      count: stock.count + ordered.count + refund.count,
      amount: stock.amount + ordered.amount + refund.amount,
    },
  };
}

export interface StorePortfolioMetrics {
  dispatchBuckets: AllSummaryDispatchBuckets;
  unfinished: { count: number; amount: number };
  stock: { count: number; amount: number };
  effective: { count: number; amount: number; avgPerOrder: number };
}

export function computeStorePortfolioMetrics(
  orders: Order[],
  supplements: SupplementOrder[],
): StorePortfolioMetrics {
  const dispatchBuckets = computeAllSummaryDispatchBuckets(orders, supplements);
  const unfinished = sumOrderAmounts(orders, supplements, isCumulativeUnfinished);
  const stock = dispatchBuckets.stock;
  const effectiveCount = countNonRefundOrders(orders);
  const effectiveAmount = sumDispatchTotals(orders, supplements).totalDispatch;
  const avgPerOrder =
    effectiveCount > 0 ? effectiveAmount / effectiveCount : 0;

  return {
    dispatchBuckets,
    unfinished,
    stock,
    effective: {
      count: effectiveCount,
      amount: effectiveAmount,
      avgPerOrder,
    },
  };
}
