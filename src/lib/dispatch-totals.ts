import { aggregateOrderAmounts, classifyOrderAmount } from "./order-amount";
import type { Order, SupplementOrder } from "./types";

export type { OrderAmountMetricCell, OrderAmountParts } from "./order-amount";
export {
  aggregateOrderAmounts,
  classifyOrderAmount,
  netNotOrderedCell,
} from "./order-amount";

export interface DispatchAmountTotals {
  /** 原始未下单合计 */
  notOrderedAmount: number;
  /** 展示用：未下单 − 已退单 */
  netNotOrderedAmount: number;
  orderedAmount: number;
  pendingRefundAmount: number;
  confirmedRefundAmount: number;
  /** 待退单 + 已退单 */
  refundAmount: number;
  /** 未下单 + 已下单 − 待退单 − 已退单 */
  totalDispatch: number;
}

/** 单笔订单对有效总派单的拆分 */
export function getOrderDispatchParts(
  order: Order,
  supplements: SupplementOrder[],
): {
  ordered: number;
  notOrdered: number;
  pendingRefund: number;
  confirmedRefund: number;
  refund: number;
} {
  const parts = classifyOrderAmount(order, supplements);
  const refund =
    parts.pendingRefund.amount + parts.confirmedRefund.amount;
  return {
    ordered: parts.ordered.amount,
    notOrdered: parts.notOrdered.amount,
    pendingRefund: parts.pendingRefund.amount,
    confirmedRefund: parts.confirmedRefund.amount,
    refund,
  };
}

/** 单笔订单有效总派单（列表行展示用） */
export function getOrderTotalDispatch(
  order: Order,
  supplements: SupplementOrder[],
): number {
  const parts = classifyOrderAmount(order, supplements);
  return (
    parts.notOrdered.amount +
    parts.ordered.amount -
    parts.pendingRefund.amount -
    parts.confirmedRefund.amount
  );
}

export function sumDispatchTotals(
  orders: Order[],
  supplements: SupplementOrder[],
): DispatchAmountTotals {
  const agg = aggregateOrderAmounts(orders, supplements);
  return {
    notOrderedAmount: agg.notOrderedAmount,
    netNotOrderedAmount: agg.netNotOrderedAmount,
    orderedAmount: agg.orderedAmount,
    pendingRefundAmount: agg.pendingRefundAmount,
    confirmedRefundAmount: agg.confirmedRefundAmount,
    refundAmount: agg.refundAmount,
    totalDispatch: agg.totalDispatch,
  };
}

export function formatDispatchMoney(amount: number): string {
  return `¥${amount.toLocaleString("zh-CN")}`;
}

/** 展示未下单金额（已减去已退单） */
export function formatNetNotOrderedMoney(amount: number): string {
  return formatDispatchMoney(amount);
}
