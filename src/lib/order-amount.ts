import { sumSupplementAmount } from "./supplement-utils";
import type { Order, OrderStatus, SupplementOrder } from "./types";

export interface OrderAmountMetricCell {
  count: number;
  amount: number;
}

export interface OrderAmountParts {
  notOrdered: OrderAmountMetricCell;
  ordered: OrderAmountMetricCell;
  pendingRefund: OrderAmountMetricCell;
  confirmedRefund: OrderAmountMetricCell;
}

const ORDERED_STATUSES: OrderStatus[] = ["已下单", "已安装", "已验收"];

function emptyCell(): OrderAmountMetricCell {
  return { count: 0, amount: 0 };
}

function getMainOrderAmountValue(order: Order): number {
  return order.orderAmount != null && order.orderAmount > 0
    ? order.orderAmount
    : 0;
}

function isOrderedStatus(order: Order): boolean {
  return ORDERED_STATUSES.includes(order.status);
}

function getRefundMainAmount(order: Order): number {
  const main = getMainOrderAmountValue(order);
  return main > 0 ? main : order.budget > 0 ? order.budget : 0;
}

/** 单笔订单：未下单 / 已下单 / 待退单 / 已退单 四类金额（全系统统一口径） */
export function classifyOrderAmount(
  order: Order,
  supplements: SupplementOrder[],
): OrderAmountParts {
  const notOrdered = emptyCell();
  const ordered = emptyCell();
  const pendingRefund = emptyCell();
  const confirmedRefund = emptyCell();

  const supplementTotal = isOrderedStatus(order)
    ? sumSupplementAmount(supplements, order.id)
    : 0;

  if (order.status === "待退单") {
    pendingRefund.count = 1;
    pendingRefund.amount = getRefundMainAmount(order) + supplementTotal;
    return { notOrdered, ordered, pendingRefund, confirmedRefund };
  }

  if (order.status === "已退单") {
    confirmedRefund.count = 1;
    confirmedRefund.amount = getRefundMainAmount(order) + supplementTotal;
    return { notOrdered, ordered, pendingRefund, confirmedRefund };
  }

  if (isOrderedStatus(order)) {
    ordered.count = 1;
    ordered.amount = getMainOrderAmountValue(order) + supplementTotal;
    return { notOrdered, ordered, pendingRefund, confirmedRefund };
  }

  notOrdered.count = 1;
  notOrdered.amount = order.budget > 0 ? order.budget : 0;
  return { notOrdered, ordered, pendingRefund, confirmedRefund };
}

export interface AggregatedOrderAmounts {
  notOrdered: OrderAmountMetricCell;
  ordered: OrderAmountMetricCell;
  pendingRefund: OrderAmountMetricCell;
  confirmedRefund: OrderAmountMetricCell;
  /** 原始未下单金额合计 */
  notOrderedAmount: number;
  /** @deprecated 与 notOrderedAmount 相同；保留兼容 */
  netNotOrderedAmount: number;
  orderedAmount: number;
  pendingRefundAmount: number;
  confirmedRefundAmount: number;
  /** 待退单 + 已退单 */
  refundAmount: number;
  /** 未下单 + 已下单 − 待退单 − 已退单 */
  totalDispatch: number;
}

export function aggregateOrderAmounts(
  orders: Order[],
  supplements: SupplementOrder[],
): AggregatedOrderAmounts {
  const notOrdered = emptyCell();
  const ordered = emptyCell();
  const pendingRefund = emptyCell();
  const confirmedRefund = emptyCell();

  for (const order of orders) {
    const parts = classifyOrderAmount(order, supplements);
    notOrdered.count += parts.notOrdered.count;
    notOrdered.amount += parts.notOrdered.amount;
    ordered.count += parts.ordered.count;
    ordered.amount += parts.ordered.amount;
    pendingRefund.count += parts.pendingRefund.count;
    pendingRefund.amount += parts.pendingRefund.amount;
    confirmedRefund.count += parts.confirmedRefund.count;
    confirmedRefund.amount += parts.confirmedRefund.amount;
  }

  const notOrderedAmount = notOrdered.amount;
  const confirmedRefundAmount = confirmedRefund.amount;
  const pendingRefundAmount = pendingRefund.amount;
  const orderedAmount = ordered.amount;
  const netNotOrderedAmount = notOrderedAmount;
  const refundAmount = pendingRefundAmount + confirmedRefundAmount;
  const totalDispatch =
    notOrderedAmount + orderedAmount - pendingRefundAmount - confirmedRefundAmount;

  return {
    notOrdered,
    ordered,
    pendingRefund,
    confirmedRefund,
    notOrderedAmount,
    netNotOrderedAmount,
    orderedAmount,
    pendingRefundAmount,
    confirmedRefundAmount,
    refundAmount,
    totalDispatch,
  };
}

/** @deprecated 未下单量不再扣已退单；直接返回原始未下单 */
export function netNotOrderedCell(
  notOrdered: OrderAmountMetricCell,
  _confirmedRefund?: OrderAmountMetricCell,
): OrderAmountMetricCell {
  return { count: notOrdered.count, amount: notOrdered.amount };
}
